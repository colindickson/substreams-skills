# Common Substreams Patterns

Collection of proven patterns and best practices for Substreams development.

## Event Extraction Patterns

### Basic ERC-20 Transfer Extraction

```rust
use substreams::prelude::*;
use substreams_ethereum::pb::eth::v2::Block;

const TRANSFER_EVENT_SIGNATURE: [u8; 32] = [
    0xdd, 0xf2, 0x52, 0xad, 0x1b, 0xe2, 0xc8, 0x9b, 0x69, 0xc2, 0xb0, 0x68, 0xfc, 0x37, 0x8d, 0xaa,
    0x95, 0x2b, 0xa7, 0xf1, 0x63, 0xc4, 0xa1, 0x16, 0x28, 0xf5, 0x5a, 0x4d, 0xf5, 0x23, 0xb3, 0xef,
];

#[substreams::handlers::map]
pub fn map_transfers(block: Block) -> Result<Transfers, Error> {
    let mut transfers = Transfers::default();
    
    for trx in block.transactions() {
        for log in &trx.receipt.logs {
            if is_transfer_event(log) {
                transfers.items.push(extract_transfer(log, &trx, &block));
            }
        }
    }
    
    Ok(transfers)
}

fn is_transfer_event(log: &Log) -> bool {
    log.topics.len() >= 3 && log.topics[0] == TRANSFER_EVENT_SIGNATURE
}

fn extract_transfer(log: &Log, trx: &TransactionTrace, block: &Block) -> Transfer {
    Transfer {
        tx_hash: Hex::encode(&trx.hash),
        from: extract_address(&log.topics[1]),
        to: extract_address(&log.topics[2]),
        amount: extract_uint256(&log.data),
        token: Hex::encode(&log.address),
        block_num: block.number,
        block_time: block.timestamp_seconds(),
        log_index: log.index,
    }
}
```

### Multi-Event Extraction

```rust
#[substreams::handlers::map]
pub fn map_dex_events(block: Block) -> Result<DexEvents, Error> {
    let mut events = DexEvents::default();
    
    for trx in block.transactions() {
        for log in &trx.receipt.logs {
            match classify_event(log) {
                EventType::UniswapV2Swap => {
                    events.swaps.push(extract_uniswap_v2_swap(log, trx, &block));
                }
                EventType::UniswapV3Swap => {
                    events.swaps.push(extract_uniswap_v3_swap(log, trx, &block));
                }
                EventType::Transfer => {
                    events.transfers.push(extract_transfer(log, trx, &block));
                }
                EventType::Unknown => {} // Skip unknown events
            }
        }
    }
    
    Ok(events)
}

enum EventType {
    UniswapV2Swap,
    UniswapV3Swap,
    Transfer,
    Unknown,
}

fn classify_event(log: &Log) -> EventType {
    if log.topics.is_empty() {
        return EventType::Unknown;
    }
    
    match log.topics[0].as_slice() {
        UNISWAP_V2_SWAP_SIGNATURE => EventType::UniswapV2Swap,
        UNISWAP_V3_SWAP_SIGNATURE => EventType::UniswapV3Swap,
        TRANSFER_SIGNATURE => EventType::Transfer,
        _ => EventType::Unknown,
    }
}
```

## Store Aggregation Patterns

### Time-Based Aggregation

```rust
#[substreams::handlers::store]
pub fn store_daily_volume(
    transfers: Transfers, 
    store: StoreAddBigDecimal
) {
    for transfer in transfers.items {
        let day = get_day_key(transfer.block_time);
        let key = format!("daily:{}:{}", day, transfer.token);
        
        let amount = BigDecimal::from_str(&transfer.amount)
            .unwrap_or_else(|_| BigDecimal::zero());
        
        store.add(0, &key, &amount);
    }
}

fn get_day_key(timestamp: u64) -> String {
    let dt = DateTime::from_timestamp(timestamp as i64, 0).unwrap();
    dt.format("%Y-%m-%d").to_string()
}
```

### Hierarchical Aggregation

```rust
#[substreams::handlers::store]
pub fn store_hierarchical_stats(
    events: DexEvents,
    store: StoreAddInt64
) {
    for swap in events.swaps {
        // Global stats
        store.add(0, "global:swap_count", 1);
        store.add(0, "global:volume", swap.amount_usd as i64);
        
        // Protocol stats
        let protocol_key = format!("protocol:{}:swap_count", swap.protocol);
        store.add(0, &protocol_key, 1);
        
        // Pair stats
        let pair_key = format!("pair:{}:{}:swap_count", swap.token0, swap.token1);
        store.add(0, &pair_key, 1);
        
        // Hourly stats
        let hour = get_hour_key(swap.block_time);
        let hourly_key = format!("hourly:{}:swap_count", hour);
        store.add(0, &hourly_key, 1);
    }
}
```

### Running Averages

```rust
#[substreams::handlers::store]
pub fn store_moving_average(
    prices: Prices,
    price_store: StoreSetBigDecimal,
    count_store: StoreAddInt64,
    sum_store: StoreAddBigDecimal,
) {
    for price in prices.items {
        let token = &price.token;
        
        // Update count and sum
        count_store.add(0, &format!("count:{}", token), 1);
        sum_store.add(0, &format!("sum:{}", token), &price.value);
        
        // Calculate and store average
        let count = count_store.get_last(&format!("count:{}", token))
            .unwrap_or(0);
        let sum = sum_store.get_last(&format!("sum:{}", token))
            .unwrap_or_else(|| BigDecimal::zero());
        
        if count > 0 {
            let average = sum / BigDecimal::from(count);
            price_store.set(0, &format!("avg:{}", token), &average);
        }
    }
}
```

## Multi-Module Composition

### Producer-Consumer Pattern

```yaml
# Producer module
- name: map_raw_events
  kind: map
  inputs:
    - source: sf.ethereum.type.v2.Block
  output:
    type: proto:events.RawEvents

# Consumer modules
- name: store_event_counts
  kind: store
  updatePolicy: add
  valueType: int64
  inputs:
    - map: map_raw_events

- name: store_event_metadata
  kind: store
  updatePolicy: set
  valueType: string
  inputs:
    - map: map_raw_events

- name: index_active_blocks
  kind: index
  inputs:
    - map: map_raw_events
```

### Enrichment Pipeline

```rust
// Step 1: Extract basic events
#[substreams::handlers::map]
pub fn map_basic_events(block: Block) -> Result<BasicEvents, Error> {
    // Extract events without enrichment
}

// Step 2: Build metadata store
#[substreams::handlers::store]
pub fn store_metadata(events: BasicEvents, store: StoreSetString) {
    // Store metadata for enrichment
}

// Step 3: Enrich events
#[substreams::handlers::map]
pub fn map_enriched_events(
    events: BasicEvents,
    metadata: StoreGetString,
) -> Result<EnrichedEvents, Error> {
    let mut enriched = EnrichedEvents::default();
    
    for event in events.items {
        let metadata_key = format!("meta:{}", event.contract);
        let metadata = metadata.get_last(&metadata_key);
        
        enriched.items.push(EnrichedEvent {
            event: Some(event),
            metadata,
        });
    }
    
    Ok(enriched)
}
```

## Parameterized Modules

### Contract-Specific Processing

```rust
#[substreams::handlers::map]
pub fn map_contract_events(
    params: String,
    block: Block,
) -> Result<ContractEvents, Error> {
    let target_contract = params.to_lowercase();
    let mut events = ContractEvents::default();
    
    for trx in block.transactions() {
        for log in &trx.receipt.logs {
            let contract_addr = Hex::encode(&log.address).to_lowercase();
            if contract_addr == target_contract {
                events.items.push(extract_event(log, trx, &block));
            }
        }
    }
    
    Ok(events)
}
```

Usage:
```bash
substreams run map_contract_events \
  -p map_contract_events=0xa0b86a33e6842a82e50c9c82c95846c26c7b3b96
```

### Multi-Parameter Processing

```rust
#[derive(serde::Deserialize)]
struct Params {
    contracts: Vec<String>,
    min_value: u64,
    include_failed: bool,
}

#[substreams::handlers::map]
pub fn map_filtered_events(
    params: String,
    block: Block,
) -> Result<FilteredEvents, Error> {
    let params: Params = serde_json::from_str(&params)?;
    let mut events = FilteredEvents::default();
    
    for trx in block.transactions() {
        // Skip failed transactions if not included
        if !params.include_failed && !trx.receipt.status {
            continue;
        }
        
        for log in &trx.receipt.logs {
            let contract = Hex::encode(&log.address).to_lowercase();
            
            if params.contracts.contains(&contract) {
                if let Some(event) = extract_and_filter_event(log, trx, &block, &params) {
                    events.items.push(event);
                }
            }
        }
    }
    
    Ok(events)
}
```

Usage:
```bash
substreams run map_filtered_events \
  -p 'map_filtered_events={"contracts":["0x123...","0x456..."],"min_value":1000,"include_failed":false}'
```

## Dynamic Data Sources

### Registry-Based Processing

```rust
#[substreams::handlers::map]
pub fn map_dynamic_contracts(
    block: Block,
    registry_store: StoreGetString,
) -> Result<DynamicEvents, Error> {
    let mut events = DynamicEvents::default();
    
    // Get list of active contracts from registry
    let active_contracts = get_active_contracts(&registry_store, block.number);
    
    for trx in block.transactions() {
        for log in &trx.receipt.logs {
            let contract = Hex::encode(&log.address);
            
            if active_contracts.contains(&contract) {
                events.items.push(extract_event(log, trx, &block));
            }
        }
    }
    
    Ok(events)
}

fn get_active_contracts(
    store: &StoreGetString,
    block_num: u64,
) -> HashSet<String> {
    let mut contracts = HashSet::new();
    
    // Query registry for contracts active at this block
    if let Some(registry_data) = store.get_last("active_contracts") {
        if let Ok(contract_list) = serde_json::from_str::<Vec<String>>(&registry_data) {
            contracts.extend(contract_list);
        }
    }
    
    contracts
}
```

### Factory Pattern

```rust
#[substreams::handlers::store]
pub fn store_factory_contracts(
    events: FactoryEvents,
    store: StoreSetString,
) {
    for event in events.items {
        match event.event_type.as_str() {
            "PairCreated" => {
                let pair_address = event.pair_address;
                let key = format!("pair:{}", pair_address);
                
                let pair_info = PairInfo {
                    token0: event.token0,
                    token1: event.token1,
                    created_at: event.block_num,
                };
                
                let serialized = serde_json::to_string(&pair_info).unwrap();
                store.set(0, &key, &serialized);
            }
            _ => {}
        }
    }
}
```

## Error Handling Patterns

### Graceful Degradation

```rust
#[substreams::handlers::map]
pub fn map_robust_events(block: Block) -> Result<Events, Error> {
    let mut events = Events::default();
    let mut error_count = 0;
    
    for trx in block.transactions() {
        match process_transaction_safe(trx) {
            Ok(mut trx_events) => {
                events.items.append(&mut trx_events);
            }
            Err(e) => {
                error_count += 1;
                substreams::log::warn!(
                    "Failed to process transaction {}: {}", 
                    Hex::encode(&trx.hash), 
                    e
                );
                
                // Continue processing other transactions
                if error_count > 10 {
                    return Err(anyhow::anyhow!("Too many errors in block"));
                }
            }
        }
    }
    
    if error_count > 0 {
        substreams::log::info!("Block processed with {} errors", error_count);
    }
    
    Ok(events)
}
```

### Validation Patterns

```rust
fn validate_transfer(transfer: &Transfer) -> Result<(), Error> {
    if transfer.amount.is_empty() {
        return Err(anyhow::anyhow!("Empty amount"));
    }
    
    if transfer.from == transfer.to {
        return Err(anyhow::anyhow!("Self-transfer"));
    }
    
    if BigInt::from_str(&transfer.amount)?.is_negative() {
        return Err(anyhow::anyhow!("Negative amount"));
    }
    
    Ok(())
}
```

## Performance Optimization Patterns

### Efficient Filtering

```rust
#[substreams::handlers::map]
pub fn map_filtered_efficiently(block: Block) -> Result<Events, Error> {
    let mut events = Events::default();
    
    // Pre-filter transactions
    let relevant_transactions: Vec<_> = block
        .transactions()
        .iter()
        .filter(|trx| has_relevant_logs(trx))
        .collect();
    
    for trx in relevant_transactions {
        for log in &trx.receipt.logs {
            if is_target_event(log) {
                events.items.push(extract_event(log, trx, &block));
            }
        }
    }
    
    Ok(events)
}

fn has_relevant_logs(trx: &TransactionTrace) -> bool {
    trx.receipt.logs.iter().any(|log| {
        !log.topics.is_empty() && 
        TARGET_SIGNATURES.contains(&log.topics[0])
    })
}
```

### Batch Processing

```rust
#[substreams::handlers::store]
pub fn store_batch_updates(
    events: Events,
    store: StoreAddBigInt,
) {
    let mut updates: HashMap<String, BigInt> = HashMap::new();
    
    // Batch updates by key
    for event in events.items {
        let key = format!("token:{}", event.token);
        let amount = BigInt::from_str(&event.amount).unwrap_or_default();
        
        *updates.entry(key).or_insert_with(BigInt::zero) += amount;
    }
    
    // Apply batched updates
    for (key, total_amount) in updates {
        store.add(0, &key, &total_amount);
    }
}
```

## Testing Patterns

### Mock Data Generation

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    fn create_test_block() -> Block {
        let mut block = Block::default();
        block.number = 17000000;
        block.timestamp = Some(prost_types::Timestamp {
            seconds: 1681234567,
            nanos: 0,
        });
        
        // Add test transactions
        block.transaction_traces.push(create_test_transaction());
        
        block
    }
    
    fn create_test_transaction() -> TransactionTrace {
        let mut trx = TransactionTrace::default();
        trx.hash = vec![0x12; 32];
        
        // Add test logs
        trx.receipt.logs.push(create_transfer_log());
        
        trx
    }
    
    #[test]
    fn test_transfer_extraction() {
        let block = create_test_block();
        let result = map_transfers(block).unwrap();
        
        assert_eq!(result.items.len(), 1);
        assert_eq!(result.items[0].amount, "1000000000000000000");
    }
}
```

