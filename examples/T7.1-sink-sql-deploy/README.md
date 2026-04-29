# T7.1 — Deploy a SQL Sink to Postgres

**Skill exercised:** `substreams-sink-deploy`
**Model:** claude-sonnet-4-6
**Result:** PASS — sink installed, schema applied, **537/537 rows match golden** · 5 trials, all PASS once known gotchas were patched into the skill

## Goal

Take a built `.spkg` (the T2.3 SQL sink) and deploy it end-to-end:

1. Stand up local Postgres (Docker)
2. Install / locate `substreams-sink-sql` binary
3. Generate `schema.sql`, create database tables
4. Run the sink against blocks `18000000:+100`
5. Verify with `SELECT count(*) FROM usdc_transfers`

This is operational, not Rust-coding — the skill covers CLI arg order, DSN scheme, schema setup sequencing, and the batch-flush flag.

## Prompt

(Full prompt in eval/ — supplies the `.spkg` path, Postgres credentials, endpoint, expected verify query.)

## What the skill provided

The skill's "Common Pitfalls" section covered all three issues that surfaced during the trial:

1. **DSN scheme** — `substreams-sink-sql` v4.13.1 rejects `postgresql://`. Allowed: `psql://`, `postgres://`, `clickhouse://`, `parquet://`. Skill quick-reference example was patched to use `psql://`.
2. **Composite-PK schema mismatch** — `setup` applies the schema embedded in the `.spkg`. T2.3's embedded schema has `PRIMARY KEY (tx_hash, log_index)` while the Rust `db_out` module emits a single synthetic string PK (`format!("{}-{}", tx_hash, log_index)`). Correct sequence: run `setup`, drop the application table, recreate with `id VARCHAR PRIMARY KEY`, then run the sink.
3. **`--batch-block-flush-interval=1`** — without it (default 1000), a 100-block range completes without flushing to DB and the verify query returns 0 rows.

## Files

- [`deployment-notes.md`](deployment-notes.md) — agent's actual deployment writeup, including the issues encountered + fix sequence

## Reproduce

```bash
docker run -d -p 5436:5432 -e POSTGRES_PASSWORD=secret postgres:15
go install github.com/streamingfast/substreams-sink-sql/cmd/substreams-sink-sql@latest

# Build the .spkg from the T2.3 example first
substreams-sink-sql setup "psql://postgres:secret@localhost:5436/postgres?sslmode=disable" usdc-sql-sink-v0.1.0.spkg

# Drop + recreate the table with synthetic PK (see deployment-notes.md)
psql ... -c "DROP TABLE usdc_transfers; CREATE TABLE usdc_transfers (id VARCHAR PRIMARY KEY, ...);"

substreams-sink-sql run \
  "psql://postgres:secret@localhost:5436/postgres?sslmode=disable" \
  usdc-sql-sink-v0.1.0.spkg \
  18000000:+100 \
  --batch-block-flush-interval=1
```
