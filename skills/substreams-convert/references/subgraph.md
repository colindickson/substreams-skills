# Subgraph → Substreams Conversion Guide

Load this file when converting a subgraph (The Graph) into a Substreams pipeline.

## Conceptual Mapping

| Subgraph Concept | Substreams Equivalent |
|---|---|
| `schema.graphql` entity | Protobuf message (`.proto`) |
| `subgraph.yaml` data source | `substreams.yaml` module + `initialBlock` |
| AssemblyScript event handler | Rust `map` module |
| Entity store (auto) | Explicit `store` module |
| `graph-node` indexer | `substreams-sink-subgraph` or direct `graph_out` |
| Template (dynamic data source) | Map module emitting new addresses → store |

## Step-by-Step Migration

### 1. Convert the GraphQL Schema to Protobuf

**Before (GraphQL SDL):**

```graphql
type Transfer @entity {
  id: ID!
  from: String!
  to: String!
  amount: BigDecimal!
  blockNumber: BigInt!
  timestamp: BigInt!
}
```

**After (Protobuf):**

```protobuf
syntax = "proto3";
package myproject.v1;

message Transfer {
  string id = 1;
  string from = 2;
  string to = 3;
  string amount = 4;       // BigDecimal as string
  uint64 block_number = 5;
  uint64 timestamp = 6;
}

message Transfers {
  repeated Transfer transfers = 1;
}
```

> **BigInt / BigDecimal in Protobuf**: Substreams does not have native BigDecimal. Represent them as `string` (human-readable decimal) or `bytes` (big-endian). Use the `substreams::scalar::BigDecimal` / `BigInt` helpers in Rust:
>
> ```rust
> use substreams::scalar::{BigDecimal, BigInt};
>
> // From a raw u256 value (e.g. from event.value which is substreams BigInt):
> let amount_str = event.value.to_decimal(6).to_string();  // USDC (6 decimals)
>
> // Parse back from string:
> let amount: BigDecimal = "1234.56".parse().unwrap_or_default();
>
> // BigInt arithmetic:
> let raw: BigInt = event.amount; // already BigInt from ABI codegen
> let human = raw.to_decimal(18).to_string(); // 18-decimal token
> ```

### 2. Identify the Data Source Chain and Initial Block

**subgraph.yaml:**
```yaml
dataSources:
  - kind: ethereum/contract
    name: ERC20Token
    network: mainnet
    source:
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      abi: ERC20
      startBlock: 6082465
```

**substreams.yaml:**
```yaml
specVersion: v0.1.0
package:
  name: erc20_transfers
  version: v0.1.0
network: mainnet          # same as subgraph network

protobuf:
  files:
    - transfers.proto
  importPaths:
    - ./proto

binaries:
  default:
    type: wasm/rust-v1
    file: ./target/wasm32-unknown-unknown/release/erc20_transfers.wasm

modules:
  - name: map_transfers
    kind: map
    initialBlock: 6082465   # from subgraph startBlock
    inputs:
      - source: sf.ethereum.type.v2.Block
    output:
      type: proto:myproject.v1.Transfers
```

> **IMPORTANT**: Use the contract's `startBlock` from the subgraph as `initialBlock` in Substreams. Do NOT use block 0 or the chain genesis block — this forces a full chain backfill from the beginning.

### 3. Convert Event Handlers

**Before (AssemblyScript):**

```typescript
export function handleTransfer(event: TransferEvent): void {
  let transfer = new Transfer(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  transfer.from = event.params.from.toHexString();
  transfer.to = event.params.to.toHexString();
  transfer.amount = event.params.value.toBigDecimal();
  transfer.blockNumber = event.block.number;
  transfer.timestamp = event.block.timestamp;
  transfer.save();
}
```

**After (Rust, Substreams map module):**

> **Ethereum address filtering — use foundational modules + Substreams Filters, not raw `block.logs()`**
>
> Iterating `block.logs()` and filtering by address in-handler works, but it processes every log in every block. For production Ethereum Substreams, the idiomatic approach is:
>
> 1. **Import a foundational module** such as `graph_node_ethereum_filter` or `filtered_events` from the [`substreams-ethereum`](https://github.com/streamingfast/substreams-ethereum) package. These modules use Substreams' native **index/filter** mechanism to skip blocks that contain no logs for your address — vastly reducing WASM execution cost.
> 2. **Use a `filtered_events` input** in your manifest so your map module only receives pre-filtered log data:
>
> ```yaml
> modules:
>   - name: map_transfers
>     kind: map
>     initialBlock: 6082465
>     inputs:
>       - map: filtered_events   # only blocks containing logs for TOKEN_ADDRESS
>     output:
>       type: proto:myproject.v1.Transfers
> ```
>
> For a single known contract address, the simpler in-handler filter shown below is acceptable for prototyping. Switch to the foundational module pattern for production or when indexing many blocks.

```rust
use substreams::errors::Error;
use substreams_ethereum::pb::eth::v2::Block;
use substreams_ethereum::Event;

use crate::abi::erc20::events::Transfer as TransferEvent;
use crate::pb::myproject::v1::{Transfer, Transfers};

// Contract address (from subgraph.yaml source.address)
const TOKEN_ADDRESS: [u8; 20] =
    hex_literal::hex!("A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48");

#[substreams::handlers::map]
pub fn map_transfers(block: Block) -> Result<Transfers, Error> {
    let mut transfers = Transfers::default();

    for log in block.logs() {
        // Filter by contract address (replaces subgraph data source address filter).
        // In production, prefer a foundational filtered_events module as input
        // so blocks with no matching logs are skipped entirely (see note above).
        if log.address() != TOKEN_ADDRESS {
            continue;
        }

        // Decode event (replaces AssemblyScript event handler binding)
        if let Some(event) = TransferEvent::match_and_decode(log) {
            let tx_hash = format!("0x{}", hex::encode(log.receipt.transaction.hash.as_slice()));
            let id = format!("{}-{}", tx_hash, log.index());

            transfers.transfers.push(Transfer {
                id,
                from: format!("0x{}", hex::encode(event.from)),
                to: format!("0x{}", hex::encode(event.to)),
                amount: event.value.to_decimal(6).to_string(), // 6 = USDC decimals; parameterize per token — never hardcode 18
                block_number: block.number,
                timestamp: block.timestamp_seconds(),
            });
        }
    }

    Ok(transfers)
}
```

> **`substreams_ethereum::Event`** provides `match_and_decode` — equivalent to subgraph's automatic event binding. Add `substreams-ethereum = "0.11"` to `Cargo.toml`.

> **Multiple contract addresses**: Subgraphs commonly index many contracts (e.g. all pairs in a factory). In Substreams, use a `HashSet` of known addresses populated from a store, then check `known_addresses.contains(log.address())`. For dynamically discovered addresses (factory pattern), see Section 6 (Dynamic Data Sources).

```rust
// For a fixed allow-list of contracts:
const KNOWN_TOKENS: &[[u8; 20]] = &[
    hex_literal::hex!("A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"), // USDC
    hex_literal::hex!("dAC17F958D2ee523a2206206994597C13D831ec7"), // USDT
];

// In handler:
if !KNOWN_TOKENS.contains(&log.address()) {
    continue;
}
```

### 4. Migrating Entity Storage (store modules)

Subgraphs persist entities automatically; Substreams uses explicit `store` modules.

**Subgraph — accumulated balance entity:**

```typescript
export function handleTransfer(event: TransferEvent): void {
  let balance = Balance.load(event.params.to.toHexString());
  if (balance == null) {
    balance = new Balance(event.params.to.toHexString());
    balance.amount = BigDecimal.fromString("0");
  }
  balance.amount = balance.amount.plus(event.params.value.toBigDecimal());
  balance.save();
}
```

**Substreams — explicit store module:**

```yaml
# substreams.yaml
modules:
  - name: map_transfers
    kind: map
    initialBlock: 6082465
    inputs:
      - source: sf.ethereum.type.v2.Block
    output:
      type: proto:myproject.v1.Transfers

  - name: store_balances
    kind: store
    initialBlock: 6082465
    updatePolicy: add
    valueType: bigdecimal
    inputs:
      - map: map_transfers
```

```rust
// Store handler — accumulates balance per address
#[substreams::handlers::store]
pub fn store_balances(transfers: Transfers, store: StoreAddBigDecimal) {
    for transfer in transfers.transfers {
        let amount: BigDecimal = match transfer.amount.parse() {
            Ok(a) => a,
            Err(_) => {
                substreams::log::warn!("invalid amount value: {}", transfer.amount);
                continue;
            }
        };
        store.add(0, &transfer.to, amount);
    }
}
```

### 5. Output: graph_out for Graph-Node Compatibility

To keep using graph-node as the consumer (Substreams-powered subgraph), output `EntityChanges` from a `graph_out` module.

**Protobuf definition** (embed this in your `proto/` directory — the upstream crate is unmaintained on modern toolchains):

```protobuf
// proto/entity.proto
// Copy verbatim — field numbers, enum values, and message names must match
// the canonical proto exactly or Graph Node will silently produce empty/garbage output.
// Canonical source: https://github.com/streamingfast/substreams-sink-entity-changes/blob/develop/proto/sf/substreams/sink/entity/v1/entity.proto
syntax = "proto3";
package sf.substreams.sink.entity.v1;

message EntityChanges {
  repeated EntityChange entity_changes = 1;   // field 1, NOT 5
}
message EntityChange {
  enum Operation { UNSET=0; CREATE=1; UPDATE=2; DELETE=3; FINAL=4; }
  string entity       = 1;
  string id           = 2;
  uint64 ordinal      = 3;
  Operation operation = 4;
  repeated Field fields = 5;
}
message Value {
  oneof typed {
    int32  int32      = 1;
    string bigdecimal = 2;
    string bigint     = 3;
    string string     = 4;
    bytes  bytes      = 5;
    bool   bool       = 6;
    Array  array      = 10;
  }
}
message Array {
  repeated Value value = 1;
}
message Field {
  string name      = 1;
  Value  old_value = 2;   // required by canonical proto — omitting causes decode issues
  Value  new_value = 3;
}
```

**graph_out module (substreams.yaml):**

```yaml
  - name: graph_out
    kind: map
    initialBlock: 6082465
    inputs:
      - store: store_balances
        mode: deltas
    output:
      type: proto:sf.substreams.sink.entity.v1.EntityChanges
```

**graph_out Rust handler:**

```rust
use substreams::store::{DeltaBigDecimal, Deltas};
use crate::pb::sf::substreams::sink::entity::v1::{
    entity_change::Operation, EntityChange, EntityChanges, Field, Value,
    value::Typed,
};

#[substreams::handlers::map]
pub fn graph_out(
    store_deltas: Deltas<DeltaBigDecimal>,
) -> Result<EntityChanges, substreams::errors::Error> {
    let mut entity_changes = EntityChanges::default();

    for delta in store_deltas.deltas {
        let address = delta.key.clone();

        // First write → CREATE, subsequent → UPDATE (mirrors subgraph semantics)
        let operation = if delta.old_value.is_zero() {
            Operation::Create
        } else {
            Operation::Update
        };

        entity_changes.entity_changes.push(EntityChange {
            entity: "Balance".to_string(),
            id: address,
            ordinal: delta.ordinal,
            operation: operation as i32,
            fields: vec![Field {
                name: "amount".to_string(),
                old_value: Some(Value {
                    typed: Some(Typed::Bigdecimal(delta.old_value.to_string())),
                }),
                new_value: Some(Value {
                    typed: Some(Typed::Bigdecimal(delta.new_value.to_string())),
                }),
            }],
        });
    }

    Ok(entity_changes)
}
```

> **Next step — deploying the graph_out module**: Once your `graph_out` module is built, load the **`substreams-sink-deploy` skill** for instructions on running `substreams-sink-subgraph` to wire the output into Graph Node or the hosted subgraph network.

### 6. Dynamic Data Sources (Templates)

Subgraphs use templates for contracts deployed at runtime (e.g., Uniswap pair contracts). In Substreams, use a factory pattern with a store:

```yaml
# substreams.yaml
modules:
  - name: map_new_pairs          # detects factory events → emits pair addresses
    kind: map
    inputs:
      - source: sf.ethereum.type.v2.Block
    output:
      type: proto:myproject.v1.PairAddresses

  - name: store_pairs             # caches known pair addresses
    kind: store
    updatePolicy: set_if_not_exists
    valueType: string
    inputs:
      - map: map_new_pairs

  - name: map_pair_events         # processes events only for known pairs
    kind: map
    inputs:
      - source: sf.ethereum.type.v2.Block
      - store: store_pairs
        mode: get
    output:
      type: proto:myproject.v1.PairEvents
```

## Cargo.toml for Subgraph Conversion

> **Version note**: Verify the latest compatible versions at [crates.io](https://crates.io). The versions below are the current recommended set at the time of writing; check `substreams`, `substreams-ethereum`, and `substreams-database-change` for updates.

```toml
[package]
name    = "my_substreams"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
substreams           = "0.7"
substreams-ethereum  = "0.11"
prost                = "0.13"
prost-types          = "0.13"
hex                  = "0.4"
hex-literal          = "0.4"
num-bigint           = "0.4"
ethabi               = "18"

[build-dependencies]
substreams-ethereum = "0.11"

[profile.release]
lto       = true
opt-level = "s"
strip     = "debuginfo"
```

## Complete Manifest Example

```yaml
specVersion: v0.1.0
package:
  name: erc20_subgraph_conversion
  version: v0.1.0
network: mainnet

protobuf:
  files:
    - transfers.proto
    - entity.proto
  importPaths:
    - ./proto

binaries:
  default:
    type: wasm/rust-v1
    file: ./target/wasm32-unknown-unknown/release/erc20_subgraph_conversion.wasm

modules:
  - name: map_transfers
    kind: map
    initialBlock: 6082465
    inputs:
      - source: sf.ethereum.type.v2.Block
    output:
      type: proto:myproject.v1.Transfers

  - name: store_balances
    kind: store
    initialBlock: 6082465
    updatePolicy: add
    valueType: bigdecimal
    inputs:
      - map: map_transfers

  - name: graph_out
    kind: map
    initialBlock: 6082465
    inputs:
      - store: store_balances
        mode: deltas
    output:
      type: proto:sf.substreams.sink.entity.v1.EntityChanges
```

## Common Pitfalls

| Subgraph Pitfall | Substreams Solution |
|---|---|
| `startBlock: 0` on all data sources | Use the actual contract deployment block as `initialBlock` |
| Entities auto-saved to store | Use explicit `store` module with appropriate `updatePolicy` |
| `event.params.value.toBigDecimal()` | `event.value.to_decimal(decimals)` (substreams BigInt helper) |
| `Address.fromString(hex)` | `hex::decode(addr.trim_start_matches("0x"))` |
| Template / dynamic data source | Factory pattern: store of addresses + filter in map module |
| `BigDecimal.plus()` across blocks | `store` with `updatePolicy: add` and `valueType: bigdecimal` |
| `entity.save()` on every event | Emit from map → drive store deltas → `graph_out` reads deltas |
| Subgraph grafting (resume from snapshot) | No equivalent in Substreams — `initialBlock` is the only start point. Set it to the contract deployment block; there is no way to resume from a prior subgraph deployment's state. Plan for a full backfill from `initialBlock`. |

## Testing

```bash
# Build
substreams build

# Interactive visual debugger — best tool for inspecting module outputs during conversion
substreams gui ./substreams.yaml map_transfers -s 6082465 -t +100

# Test with a small range (use startBlock from the subgraph)
substreams run ./substreams.yaml graph_out \
  -s 6082465 -t +1000 \
  -o jsonl

# Verify entity output looks correct
substreams run ./substreams.yaml map_transfers \
  -s 6082465 -t +100 \
  -o json
```

## References

- [Substreams-powered subgraphs (The Graph docs)](https://thegraph.com/docs/en/substreams-powered-subgraphs/)
- [substreams-sink-subgraph](https://github.com/streamingfast/substreams-sink-subgraph)
- [substreams-entity-change proto](https://github.com/streamingfast/substreams-sink-entity-changes)
- [Graph Node Substreams integration](https://github.com/graphprotocol/graph-node)
