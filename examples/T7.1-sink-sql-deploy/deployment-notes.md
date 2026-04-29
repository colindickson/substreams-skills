# T7.1 Deployment Notes — sonnet-4-6 / 2026-04-29

## Skill Discoverability
`substreams:substreams-sink-deploy` was present in the available-skills list. Loaded before task execution. All 3 known gotchas were covered by the skill's "Common Pitfalls" section.

## Task Outcome
PASS — 537 rows in `usdc_transfers` (expected 537).

## Issues Encountered

### 1. DSN scheme rejection
`substreams-sink-sql` v4.13.1 rejects `postgresql://` as the DSN scheme.
Allowed schemes: `[psql, postgres, clickhouse, parquet]`.
Fix: use `psql://...` or `postgres://...`.
The skill's quick-reference example uses `postgresql://` which will fail on this version.

### 2. Setup embeds composite-PK schema — manual fix required after setup
The `setup` command applies the schema embedded in the `.spkg`, which in T2.3 has:
```sql
PRIMARY KEY (tx_hash, log_index)
```
But the Rust `db_out` module sends a single synthetic string PK: `format!("{}-{}", tx_hash, log_index)`.

The correct fix sequence:
1. Run `substreams-sink-sql setup` (creates cursors + substreams_history tables)
2. DROP the application table (`usdc_transfers`)
3. Recreate with `id VARCHAR NOT NULL PRIMARY KEY`
4. Then run the sink

Running `setup` AFTER manually creating the table would overwrite it with the composite PK version.

### 3. --batch-block-flush-interval=1 is essential for 100-block range
Without it (default=1000), the sink completes 100 blocks without ever flushing to DB.
The sink logs show `db_flush_rate: 0.000 flush/s` if you forget this flag.

## Environment
- substreams-sink-sql v4.13.1
- Postgres 15 (Docker, port 5436)
- Block range: 18000000:+100 (historical, served fast from SF cache)
- Endpoint: mainnet.eth.streamingfast.io:443
- SPKG: usdc-sql-sink-v0.1.0.spkg (module: db_out)
