---
name: substreams-sql
description: Expert knowledge for building SQL database sinks from Substreams. Covers database changes (CDC), relational mappings, PostgreSQL, ClickHouse, and materialized views.
license: Apache-2.0
compatibility:
  platforms: [claude-code, cursor, vscode, windsurf]
metadata:
  version: 1.0.0
  author: StreamingFast
  documentation: https://substreams.streamingfast.io
---

# Substreams SQL Expert

Expert assistant for building SQL database sinks from Substreams data - transforming blockchain data into relational databases.

## Core Concepts

### What is Substreams SQL?

Substreams SQL enables you to:
- **Transform blockchain data** into structured SQL tables
- **Stream changes** to PostgreSQL, ClickHouse, and other databases
- **Build materialized views** with real-time updates
- **Handle reorgs** with proper cursor-based streaming
- **Scale horizontally** with parallel processing

### Two Main Approaches

1. **Database Changes (CDC)** - Stream individual row changes
2. **Relational Mappings** - Transform data into normalized tables

## Database Changes (CDC) Approach

### Overview

The CDC approach streams individual database operations (INSERT, UPDATE, DELETE) to maintain real-time consistency.

### Key Components

**Protobuf Schema** (`database_changes.proto`):
```protobuf
syntax = "proto3";

package db_out;

message DatabaseChanges {
  repeated TableChange table_changes = 1;
}

message TableChange {
  string table = 1;
  string pk = 2;
  uint64 ordinal = 3;
  Operation operation = 4;
  repeated Field fields = 5;

  enum Operation {
    UNSPECIFIED = 0;
    CREATE = 1;
    UPDATE = 2;
    DELETE = 3;
  }
}

message Field {
  string name = 1;
  string new_value = 2;
  string old_value = 3;
}
```

**Rust Implementation**:
```rust
use substreams::prelude::*;
use substreams_database_change::pb::database::DatabaseChanges;
use substreams_database_change::tables::Tables;

#[substreams::handlers::map]
pub fn db_out(events: Events) -> Result<DatabaseChanges, Error> {
    let mut tables = Tables::new();

    for transfer in events.transfers {
        tables
            .create_row("transfers", format!("{}-{}", transfer.tx_hash, transfer.log_index))
            .set("tx_hash", transfer.tx_hash)
            .set("from_addr", transfer.from)
            .set("to_addr", transfer.to)
            .set("amount", transfer.amount)
            .set("block_num", transfer.block_number)
            .set("timestamp", transfer.timestamp);
    }

    for balance in events.balance_changes {
        tables
            .update_row("balances", balance.address)
            .set("balance", balance.new_balance)
            .set("updated_at", balance.timestamp);
    }

    Ok(tables.to_database_changes())
}
```

### Manifest Configuration

```yaml
modules:
  - name: db_out
    kind: map
    inputs:
      - map: map_events
    output:
      type: proto:db_out.DatabaseChanges

sinks:
  - name: db_sink
    type: sf.substreams.sink.sql.v1.Service
    config:
      schema: "./schema.sql"
      engine: postgres
      postgresqlDsn: "postgresql://user:pass@localhost/db"
      # Or for ClickHouse:
      # engine: clickhouse  
      # clickhouseDsn: "clickhouse://user:pass@localhost:9000/db"
    inputs:
      - map: db_out
```

### Advantages
- ✅ **Real-time consistency** - Changes applied immediately
- ✅ **Handles reorgs** - Can reverse/replay operations
- ✅ **Efficient updates** - Only changed data is transmitted
- ✅ **ACID compliance** - Database transactions ensure consistency

### Use Cases
- Real-time dashboards
- Trading applications
- Balance tracking
- Event sourcing

## Relational Mappings Approach

### Overview

Transform Substreams data into normalized relational tables with proper foreign keys and indexes.

### Schema Design

**Example Schema** (`schema.sql`):
```sql
-- Blocks table
CREATE TABLE blocks (
    number BIGINT PRIMARY KEY,
    hash VARCHAR(66) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    parent_hash VARCHAR(66),
    size_bytes BIGINT
);

-- Transactions table  
CREATE TABLE transactions (
    hash VARCHAR(66) PRIMARY KEY,
    block_number BIGINT REFERENCES blocks(number),
    from_addr VARCHAR(42),
    to_addr VARCHAR(42),
    value NUMERIC(78,0),
    gas_limit BIGINT,
    gas_used BIGINT,
    status INTEGER
);

-- ERC20 Transfers
CREATE TABLE erc20_transfers (
    id SERIAL PRIMARY KEY,
    tx_hash VARCHAR(66) REFERENCES transactions(hash),
    log_index INTEGER,
    contract_address VARCHAR(42),
    from_addr VARCHAR(42),
    to_addr VARCHAR(42),
    amount NUMERIC(78,0),
    block_number BIGINT
);

-- Token balances (aggregated)
CREATE TABLE token_balances (
    address VARCHAR(42),
    token_address VARCHAR(42),
    balance NUMERIC(78,0),
    last_updated BIGINT,
    PRIMARY KEY (address, token_address)
);

-- Indexes for performance
CREATE INDEX idx_transfers_contract ON erc20_transfers(contract_address);
CREATE INDEX idx_transfers_from ON erc20_transfers(from_addr);
CREATE INDEX idx_transfers_to ON erc20_transfers(to_addr);
CREATE INDEX idx_transfers_block ON erc20_transfers(block_number);
```

**Rust Implementation**:
```rust
#[substreams::handlers::map]
pub fn db_out(block: Block) -> Result<DatabaseChanges, Error> {
    let mut tables = Tables::new();

    // Insert block data
    tables
        .create_row("blocks", block.number.to_string())
        .set("number", block.number)
        .set("hash", Hex::encode(&block.hash))
        .set("timestamp", block.timestamp_seconds())
        .set("parent_hash", Hex::encode(&block.parent_hash))
        .set("size_bytes", block.size);

    for (tx_idx, tx) in block.transaction_traces.iter().enumerate() {
        // Insert transaction
        let tx_hash = Hex::encode(&tx.hash);
        tables
            .create_row("transactions", &tx_hash)
            .set("hash", &tx_hash)
            .set("block_number", block.number)
            .set("from_addr", Hex::encode(&tx.from))
            .set("to_addr", Hex::encode(&tx.to))
            .set("value", tx.value.to_string())
            .set("gas_limit", tx.gas_limit)
            .set("gas_used", tx.gas_used)
            .set("status", tx.status);

        // Process ERC20 transfers
        for (log_idx, log) in tx.receipt.logs.iter().enumerate() {
            if is_erc20_transfer(log) {
                let transfer = decode_transfer(log);
                let transfer_id = format!("{}-{}", tx_hash, log_idx);
                
                tables
                    .create_row("erc20_transfers", transfer_id)
                    .set("tx_hash", &tx_hash)
                    .set("log_index", log_idx as i32)
                    .set("contract_address", Hex::encode(&log.address))
                    .set("from_addr", transfer.from)
                    .set("to_addr", transfer.to)
                    .set("amount", transfer.amount)
                    .set("block_number", block.number);
            }
        }
    }

    Ok(tables.to_database_changes())
}
```

### Advantages
- ✅ **Normalized data** - Proper relational structure
- ✅ **Complex queries** - JOIN operations, aggregations
- ✅ **Data integrity** - Foreign keys, constraints
- ✅ **Analytics friendly** - Optimized for reporting

## PostgreSQL Implementation

### Setup and Configuration

**Docker Setup**:
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: substreams
      POSTGRES_USER: substreams
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  postgres_data:
```

**Connection Configuration**:
```yaml
# substreams.yaml
sinks:
  - name: postgres_sink
    type: sf.substreams.sink.sql.v1.Service
    config:
      schema: "./schema.sql"
      engine: postgres
      postgresqlDsn: "postgresql://substreams:password@localhost:5432/substreams?sslmode=disable"
      
      # Connection pooling
      maxConnections: 10
      maxIdleConnections: 5
      maxConnectionLifetime: "1h"
      
      # Batching for performance
      flushInterval: "1s"
      batchSize: 1000
      
    inputs:
      - map: db_out
```

### PostgreSQL-Specific Features

**JSONB Support**:
```sql
-- Store complex data as JSONB
CREATE TABLE transaction_logs (
    tx_hash VARCHAR(66),
    log_index INTEGER,
    data JSONB,
    topics JSONB
);

-- Index JSONB fields
CREATE INDEX idx_logs_data ON transaction_logs USING GIN (data);
```

**Materialized Views**:
```sql
-- Daily transfer volumes
CREATE MATERIALIZED VIEW daily_transfer_volumes AS
SELECT 
    DATE(to_timestamp(timestamp)) as date,
    contract_address,
    COUNT(*) as transfer_count,
    SUM(amount) as total_volume
FROM erc20_transfers t
JOIN transactions tx ON t.tx_hash = tx.hash
GROUP BY DATE(to_timestamp(timestamp)), contract_address;

-- Refresh strategy (handled by Substreams)
CREATE UNIQUE INDEX ON daily_transfer_volumes (date, contract_address);
```

**Performance Tuning**:
```sql
-- Partitioning by block number
CREATE TABLE erc20_transfers (
    -- columns...
    block_number BIGINT
) PARTITION BY RANGE (block_number);

CREATE TABLE erc20_transfers_y2024 PARTITION OF erc20_transfers
    FOR VALUES FROM (18000000) TO (20000000);

-- Parallel processing
SET max_parallel_workers_per_gather = 4;
SET max_parallel_workers = 8;
```

### Best Practices for PostgreSQL

1. **Use appropriate data types**:
   ```sql
   -- Use NUMERIC for big integers (token amounts)
   amount NUMERIC(78,0)  -- Not BIGINT
   
   -- Use proper VARCHAR sizes
   address VARCHAR(42)   -- Ethereum addresses
   hash VARCHAR(66)      -- Transaction hashes
   ```

2. **Index strategically**:
   ```sql
   -- Query-specific indexes
   CREATE INDEX idx_transfers_token_date ON erc20_transfers(contract_address, block_number);
   
   -- Partial indexes for active data
   CREATE INDEX idx_active_balances ON token_balances(address) WHERE balance > 0;
   ```

3. **Use constraints**:
   ```sql
   -- Data validation
   ALTER TABLE erc20_transfers ADD CONSTRAINT check_positive_amount 
       CHECK (amount >= 0);
   
   -- Foreign keys for referential integrity
   ALTER TABLE erc20_transfers ADD CONSTRAINT fk_transaction
       FOREIGN KEY (tx_hash) REFERENCES transactions(hash);
   ```

## ClickHouse Implementation

### Setup and Configuration

**Docker Setup**:
```yaml
# docker-compose.yml
version: '3.8'
services:
  clickhouse:
    image: clickhouse/clickhouse-server:latest
    ports:
      - "9000:9000"
      - "8123:8123"
    environment:
      CLICKHOUSE_DEFAULT_ACCESS_MANAGEMENT: 1
    volumes:
      - clickhouse_data:/var/lib/clickhouse
      - ./clickhouse-schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  clickhouse_data:
```

**Substreams Configuration**:
```yaml
sinks:
  - name: clickhouse_sink
    type: sf.substreams.sink.sql.v1.Service
    config:
      schema: "./clickhouse-schema.sql"
      engine: clickhouse
      clickhouseDsn: "clickhouse://default:@localhost:9000/default"
      
      # ClickHouse specific settings
      batchSize: 10000
      flushInterval: "5s"
      compression: "lz4"
      
    inputs:
      - map: db_out
```

### ClickHouse Schema Design

**Optimized for Analytics**:
```sql
-- Blocks table with MergeTree engine
CREATE TABLE blocks (
    number UInt64,
    hash String,
    timestamp DateTime,
    parent_hash String,
    size_bytes UInt64,
    tx_count UInt32
) ENGINE = MergeTree()
ORDER BY number
SETTINGS index_granularity = 8192;

-- ERC20 transfers optimized for time-series queries
CREATE TABLE erc20_transfers (
    block_number UInt64,
    tx_hash String,
    log_index UInt32,
    contract_address String,
    from_addr String,
    to_addr String,
    amount UInt256,
    timestamp DateTime,
    
    -- Pre-computed fields for analytics
    hour DateTime,
    date Date
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (contract_address, timestamp, block_number)
SETTINGS index_granularity = 8192;

-- Materialized view for real-time aggregations
CREATE MATERIALIZED VIEW hourly_transfer_stats
ENGINE = SummingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (contract_address, hour)
AS SELECT
    contract_address,
    toStartOfHour(timestamp) AS hour,
    count() AS transfer_count,
    sum(amount) AS total_volume
FROM erc20_transfers
GROUP BY contract_address, hour;
```

**ClickHouse-Specific Features**:
```sql
-- Compression and optimization
ALTER TABLE erc20_transfers MODIFY COLUMN amount Codec(Delta, ZSTD);

-- TTL for data lifecycle management
ALTER TABLE erc20_transfers MODIFY TTL date + INTERVAL 2 YEAR;

-- Dictionaries for dimension data
CREATE DICTIONARY token_metadata (
    address String,
    symbol String,
    decimals UInt8,
    name String
) PRIMARY KEY address
SOURCE(POSTGRESQL(
    host 'postgres'
    port 5432
    user 'substreams'
    password 'password'
    db 'substreams'
    table 'token_metadata'
))
LIFETIME(300)
LAYOUT(HASHED());
```

### Performance Optimization

**Partitioning Strategy**:
```sql
-- Monthly partitioning for time-series data
CREATE TABLE erc20_transfers_distributed AS erc20_transfers
ENGINE = Distributed('cluster', 'default', 'erc20_transfers', rand());

-- Partition pruning
SELECT * FROM erc20_transfers 
WHERE date >= '2024-01-01' AND date < '2024-02-01';
```

**Query Optimization**:
```sql
-- Use projection for common query patterns
ALTER TABLE erc20_transfers ADD PROJECTION daily_stats (
    SELECT 
        date,
        contract_address,
        sum(amount),
        count()
    GROUP BY date, contract_address
);

-- Pre-aggregated tables
CREATE TABLE daily_token_stats
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (date, contract_address)
AS SELECT
    date,
    contract_address,
    sumState(amount) as total_volume,
    countState() as transfer_count
FROM erc20_transfers
GROUP BY date, contract_address;
```

## Materialized Views and Real-time Updates

### Concept

Materialized views provide pre-computed query results that update automatically as new data arrives.

### Implementation Patterns

**PostgreSQL Materialized Views**:
```sql
-- Token holder counts
CREATE MATERIALIZED VIEW token_holder_counts AS
SELECT 
    token_address,
    COUNT(DISTINCT address) as holder_count,
    SUM(balance) as total_supply
FROM token_balances 
WHERE balance > 0
GROUP BY token_address;

-- Refresh trigger (automated by Substreams)
CREATE OR REPLACE FUNCTION refresh_token_holder_counts()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY token_holder_counts;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER token_balance_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON token_balances
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_token_holder_counts();
```

**ClickHouse Materialized Views**:
```sql
-- Real-time price calculations
CREATE MATERIALIZED VIEW token_prices_mv
ENGINE = ReplacingMergeTree(timestamp)
ORDER BY (token_address, timestamp)
AS SELECT
    token_address,
    timestamp,
    price_usd,
    volume_24h,
    market_cap
FROM (
    -- Complex price calculation logic
    SELECT 
        t.contract_address as token_address,
        toStartOfMinute(t.timestamp) as timestamp,
        calculatePrice(t.amount, p.eth_price) as price_usd,
        sum(t.amount) OVER (
            PARTITION BY t.contract_address 
            ORDER BY t.timestamp 
            RANGE BETWEEN INTERVAL 24 HOUR PRECEDING AND CURRENT ROW
        ) as volume_24h
    FROM erc20_transfers t
    JOIN eth_prices p ON toStartOfMinute(t.timestamp) = p.timestamp
    WHERE t.contract_address = '0x...' -- USDC
);
```

### Update Strategies

**Incremental Updates**:
```rust
// Track last processed block for incremental updates
#[substreams::handlers::store]
pub fn store_last_block(block: Block, store: StoreSetInt64) {
    store.set(0, "last_processed_block", &block.number.to_string(), block.number as i64);
}

// Only process new data
#[substreams::handlers::map]
pub fn incremental_db_out(
    block: Block,
    last_block_store: StoreGetInt64
) -> Result<DatabaseChanges, Error> {
    let last_processed = last_block_store.get_last("last_processed_block")
        .unwrap_or(0);
    
    if block.number <= last_processed {
        return Ok(DatabaseChanges::default()); // Skip already processed
    }
    
    // Process only new block data
    process_block_data(block)
}
```

**Cursor-based Consistency**:
```yaml
# Ensure reorg handling in manifest
modules:
  - name: db_out
    kind: map
    inputs:
      - source: sf.ethereum.type.v2.Block
        mode: sorted  # Ensures proper ordering for reorgs
    output:
      type: proto:db_out.DatabaseChanges

sinks:
  - name: db_sink
    # Cursor management handled automatically
    config:
      ignoreReorgThreshold: 200  # Handle reorgs up to 200 blocks
```

## Advanced Patterns

### Multi-Database Sinks

```yaml
# Stream to both PostgreSQL and ClickHouse
sinks:
  - name: postgres_operational
    type: sf.substreams.sink.sql.v1.Service
    config:
      engine: postgres
      postgresqlDsn: "postgresql://user:pass@postgres:5432/operational"
      schema: "./operational-schema.sql"
    inputs:
      - map: db_out_operational

  - name: clickhouse_analytics  
    type: sf.substreams.sink.sql.v1.Service
    config:
      engine: clickhouse
      clickhouseDsn: "clickhouse://default:@clickhouse:9000/analytics"
      schema: "./analytics-schema.sql"
    inputs:
      - map: db_out_analytics
```

### Data Transformation Pipelines

```rust
// Multi-stage data processing
#[substreams::handlers::map]
pub fn extract_events(block: Block) -> Result<RawEvents, Error> {
    // Stage 1: Extract raw events
    extract_raw_blockchain_events(block)
}

#[substreams::handlers::map]  
pub fn enrich_events(raw_events: RawEvents) -> Result<EnrichedEvents, Error> {
    // Stage 2: Enrich with metadata, decode parameters
    enrich_with_token_metadata(raw_events)
}

#[substreams::handlers::map]
pub fn db_out_operational(enriched: EnrichedEvents) -> Result<DatabaseChanges, Error> {
    // Stage 3: Transform for operational database (normalized)
    create_operational_tables(enriched)
}

#[substreams::handlers::map]
pub fn db_out_analytics(enriched: EnrichedEvents) -> Result<DatabaseChanges, Error> {
    // Stage 4: Transform for analytics database (denormalized)
    create_analytics_tables(enriched)
}
```

## Troubleshooting

### Common Issues

**Connection Problems**:
```bash
# Test database connectivity
psql "postgresql://user:pass@localhost:5432/db" -c "SELECT version();"
clickhouse-client --host localhost --port 9000 --query "SELECT version()"

# Check sink logs
substreams run -s 1000000 -t +1000 db_out --debug
```

**Schema Mismatches**:
```bash
# Validate schema against database
substreams sql validate --schema ./schema.sql --dsn "postgresql://..."

# Compare expected vs actual schema
pg_dump --schema-only dbname > current_schema.sql
diff expected_schema.sql current_schema.sql
```

**Performance Issues**:
```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM erc20_transfers WHERE contract_address = '0x...';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- ClickHouse query profiling
SELECT * FROM system.query_log 
WHERE type = 'QueryFinish' 
ORDER BY event_time DESC 
LIMIT 10;
```

### Data Consistency

**Reorg Handling**:
```rust
// Proper reorg handling in stores
#[substreams::handlers::store]
pub fn store_balances(events: Events, store: StoreSetBigInt) {
    for transfer in events.transfers {
        // Use ordinal-based keys for reorg safety
        let key = format!("{}:{}:{}", transfer.contract, transfer.from, block.number);
        store.set(transfer.ordinal, &key, &transfer.amount);
    }
}
```

**Cursor Management**:
```yaml
# Proper cursor configuration
sinks:
  - name: db_sink
    config:
      # Ensure cursor persistence
      cursorFile: "./cursor.json"
      # Handle chain reorganizations  
      reorgHandling: true
      finalityBlocks: 200
```

### Monitoring and Alerting

**Key Metrics**:
```sql
-- PostgreSQL monitoring
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;

-- ClickHouse monitoring  
SELECT 
    table,
    sum(rows) as total_rows,
    sum(bytes_on_disk) as size_bytes
FROM system.parts 
WHERE active = 1
GROUP BY table
ORDER BY size_bytes DESC;
```

**Health Checks**:
```bash
#!/bin/bash
# Database health monitoring script

# Check latest block processed
LATEST_BLOCK=$(psql $DSN -t -c "SELECT MAX(block_number) FROM transactions;")
CHAIN_HEAD=$(curl -s https://api.etherscan.io/api?module=proxy&action=eth_blockNumber | jq -r .result)

LAG=$((CHAIN_HEAD - LATEST_BLOCK))
if [ $LAG -gt 100 ]; then
    echo "WARNING: Database is $LAG blocks behind chain head"
    exit 1
fi

echo "Database is healthy, lag: $LAG blocks"
```

## Resources

* [Database Changes Documentation](./references/database-changes.md)
* [PostgreSQL Best Practices](./references/postgresql-patterns.md)  
* [ClickHouse Optimization Guide](./references/clickhouse-patterns.md)
* [Schema Design Patterns](./references/schema-patterns.md)

## Getting Help

* [Substreams Discord](https://discord.gg/streamingfast)
* [SQL Sink Documentation](https://substreams.streamingfast.io/documentation/consume/sql)
* [GitHub Issues](https://github.com/streamingfast/substreams/issues)