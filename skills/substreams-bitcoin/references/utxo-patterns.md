# Bitcoin UTXO Patterns for Substreams

## Understanding the UTXO Model

Bitcoin uses the Unspent Transaction Output (UTXO) model instead of account-based balances. Each transaction consumes existing UTXOs and creates new ones.

### UTXO Lifecycle

```
Block N:
  TX A creates outputs:
    - Output 0: 1.0 BTC to address1 (UTXO created)
    - Output 1: 0.5 BTC to address2 (UTXO created)

Block N+100:
  TX B spends TX A's Output 0:
    - Input: TX A, vout 0 (UTXO consumed)
    - Output 0: 0.9 BTC to address3 (new UTXO)
    - Fee: 0.1 BTC (implicit)
```

## Tracking UTXOs in Substreams

### Pattern 1: Per-Block UTXO Extraction

Extract newly created UTXOs from each block:

```rust
#[substreams::handlers::map]
fn map_new_utxos(_clock: Clock, block: Block) -> Result<NewUtxos, Error> {
    let mut utxos = Vec::new();

    for tx in &block.tx {
        for (idx, output) in tx.vout.iter().enumerate() {
            let address = extract_address(output);
            if address.is_empty() {
                continue;
            }

            utxos.push(UtxoCreated {
                txid: tx.txid.clone(),
                vout: idx as u32,
                value_sats: btc_to_sats(output.value),
                address,
                script_type: extract_script_type(output),
                block_height: block.height as u32,
                block_time: block.time as u64,
            });
        }
    }

    Ok(NewUtxos { utxos })
}
```

### Pattern 2: Tracking Spent UTXOs

Track which UTXOs are being spent:

```rust
#[substreams::handlers::map]
fn map_spent_utxos(_clock: Clock, block: Block) -> Result<SpentUtxos, Error> {
    let mut spent = Vec::new();

    for tx in &block.tx {
        for input in &tx.vin {
            // Skip coinbase inputs
            if !input.coinbase.is_empty() {
                continue;
            }

            spent.push(UtxoSpent {
                spent_txid: input.txid.clone(),
                spent_vout: input.vout,
                spending_txid: tx.txid.clone(),
                block_height: block.height as u32,
            });
        }
    }

    Ok(SpentUtxos { spent })
}
```

### Pattern 3: UTXO Set Store (Stateful)

Use a store to maintain UTXO state across blocks:

```rust
// Store module to track UTXO existence
#[substreams::handlers::store]
fn store_utxo_set(
    new_utxos: NewUtxos,
    spent_utxos: SpentUtxos,
    store: StoreSetProto<UtxoInfo>,
) {
    // Add new UTXOs
    for utxo in new_utxos.utxos {
        let key = format!("{}:{}", utxo.txid, utxo.vout);
        store.set(0, &key, &UtxoInfo {
            txid: utxo.txid,
            vout: utxo.vout,
            value: utxo.value_sats,
            address: utxo.address,
        });
    }

    // Remove spent UTXOs
    for spent in spent_utxos.spent {
        let key = format!("{}:{}", spent.spent_txid, spent.spent_vout);
        store.delete_prefix(0, &key);
    }
}
```

## Address Balance Calculation

Since Bitcoin doesn't have account balances, calculate from UTXOs:

```rust
// Map module using UTXO store
#[substreams::handlers::map]
fn map_address_balances(
    block: Block,
    utxo_store: StoreGetProto<UtxoInfo>,
) -> Result<AddressBalances, Error> {
    let mut balances: HashMap<String, u64> = HashMap::new();

    // This example shows the pattern - actual implementation
    // would iterate through relevant store entries
    for tx in &block.tx {
        for output in &tx.vout {
            if let Some(addr) = extract_address(output) {
                let entry = balances.entry(addr).or_insert(0);
                *entry += btc_to_sats(output.value);
            }
        }
    }

    Ok(AddressBalances {
        balances: balances.into_iter()
            .map(|(addr, bal)| AddressBalance { address: addr, balance: bal })
            .collect()
    })
}
```

## Fee Calculation with UTXO Store

Accurate fee calculation requires knowing input values:

```rust
fn calculate_tx_fee(
    tx: &Transaction,
    utxo_store: &StoreGetProto<UtxoInfo>,
) -> u64 {
    // Coinbase has no fee
    if tx.vin.iter().any(|v| !v.coinbase.is_empty()) {
        return 0;
    }

    // Sum input values from UTXO store
    let input_total: u64 = tx.vin.iter()
        .filter(|input| input.coinbase.is_empty())
        .filter_map(|input| {
            let key = format!("{}:{}", input.txid, input.vout);
            utxo_store.get_last(&key)
        })
        .map(|utxo| utxo.value)
        .sum();

    // Sum output values
    let output_total: u64 = tx.vout.iter()
        .map(|o| btc_to_sats(o.value))
        .sum();

    input_total.saturating_sub(output_total)
}
```

## Common UTXO Queries

### Get UTXOs for Address

```rust
fn get_address_utxos(
    address: &str,
    utxo_store: &StoreGetProto<UtxoInfo>,
) -> Vec<UtxoInfo> {
    // Store iteration pattern
    let prefix = format!("addr:{}:", address);
    utxo_store.get_many_at(&prefix)
        .into_iter()
        .collect()
}
```

### Check if UTXO is Spent

```rust
fn is_utxo_spent(
    txid: &str,
    vout: u32,
    utxo_store: &StoreGetProto<UtxoInfo>,
) -> bool {
    let key = format!("{}:{}", txid, vout);
    utxo_store.get_last(&key).is_none()
}
```

## Best Practices

1. **Use composite keys**: `{txid}:{vout}` uniquely identifies a UTXO
2. **Delete spent UTXOs**: Don't just mark as spent - delete to save storage
3. **Index by address**: Create secondary index for address queries
4. **Handle reorgs**: Substreams handles this automatically with cursors
5. **Batch operations**: Process all UTXOs in a block together
