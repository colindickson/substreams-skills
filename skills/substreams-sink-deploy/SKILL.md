---
name: substreams-sink-deploy
description: Use when the user wants to RUN, DEPLOY, or OPERATE a Substreams sink — i.e. take a built `.spkg` and pipe its data into a destination. Triggers on "run substreams-sink-sql", "deploy my substreams to Postgres", "set up substreams-sink-files", "publish to PubSub", "stream to S3", "deploy hosted sink", "start the sink binary". Covers sink CLI binaries (substreams-sink-sql, -files, -pubsub, -webhook), schema setup, cursor management, reorg handling, hosted vs self-hosted decision, batch flush tuning, and common pitfalls. Distinct from substreams-sql (which covers BUILDING the db_out Rust module — its proto, table mappings, and Rust APIs). Use this skill AFTER the .spkg is already built.
license: Apache-2.0
compatibility:
  platforms: [claude-code, cursor, vscode, windsurf]
metadata:
  version: 0.1.2
  author: StreamingFast
  documentation: https://docs.substreams.dev/how-to-guides/sinks
---

# Substreams Sink Deployment Expert

End-to-end guide for taking a working Substreams package and getting its data into a destination — local, hosted, or managed.

## When to Use This Skill

Use this skill when the user says any of:
- "deploy my substreams"
- "I want to send data to Postgres / ClickHouse"
- "stream my Substreams to S3 / GCS / files"
- "publish to PubSub / a webhook"
- "deploy to a hosted sink"
- "set up substreams-sink-sql / -files / -pubsub"

**Do NOT use this skill** when the user is:
- Writing the Substreams Rust code → use `substreams-dev`
- Picking field names for `db_out` / `DatabaseChanges` → use `substreams-sql`
- Consuming Substreams in a Go/JS/Rust app → use `substreams-sink`

## Decision Tree: Which Sink?

```
Where does the data need to land?

├── SQL database queries (analytics, joins, BI)
│   └── Postgres / ClickHouse  →  substreams-sink-sql        (proto: DatabaseChanges)
│
├── Object storage / data lake (S3, GCS, local FS)
│   └── CSV / Parquet bulk files →  substreams-sink-files   (proto: any custom)
│
├── Real-time event bus
│   ├── Google Cloud PubSub      →  substreams-sink-pubsub  (proto: sf.substreams.sink.pubsub.v1.Publish)
│   └── HTTP webhook             →  substreams sink webhook (proto: any)
│
├── Subgraph (The Graph network)
│   └── graph-node                 →  Substreams-powered Subgraph (proto: sf.substreams.sink.entity.v1.EntityChanges)
│
├── Custom application code
│   └── Go / JS / Rust SDK       →  see substreams-sink skill (no binary, app-level)
│
└── Just JSONL on stdout
    └── substreams sink protojson  (built-in, zero install — for testing)
```

**Picking SQL vs Files vs Stream SDK** — most common decision:
- **SQL** → you'll run analytical queries, need joins, need ad-hoc BI. ~5-50K rows/sec.
- **Files** (CSV/Parquet) → archival, batch ETL into a warehouse, training data. Cheapest at scale.
- **Stream SDK** → you have an existing app and need each event passed to your code. Highest control, most code to write.

## Architecture: Build Side vs Run Side

Every sink has two halves. Skill tasks usually mix them up.

```
┌────────────────────────────────────┐    ┌──────────────────────────────────┐
│  BUILD SIDE (Rust / .spkg)         │    │  RUN SIDE (sink binary)          │
│                                    │    │                                  │
│  - Substreams package (.spkg)      │───▶│  - substreams-sink-<x> binary    │
│  - Output module emits the         │    │  - Reads from Substreams endpoint│
│    proto type the sink expects     │    │  - Writes to destination         │
│  - One module per sink type        │    │  - Manages cursor + reorgs       │
└────────────────────────────────────┘    └──────────────────────────────────┘
        ↑                                          ↑
        │ owned by substreams-dev /                │ owned by THIS skill
        │ substreams-sql skills                    │
```

**Key rule:** the sink binary will refuse to run if your output module emits the wrong proto type. Each sink expects a specific message.

| Sink                      | Output module proto type                                       |
|---------------------------|----------------------------------------------------------------|
| `substreams-sink-sql`     | `proto:sf.substreams.sink.database.v1.DatabaseChanges`         |
| `substreams-sink-pubsub`  | `proto:sf.substreams.sink.pubsub.v1.Publish`                   |
| `substreams-sink-files`   | any user-defined proto (you choose; the sink streams it raw)   |
| `substreams sink webhook` | any user-defined proto (delivered as JSON to the URL)          |
| Subgraph (graph-node)     | `proto:sf.substreams.sink.entity.v1.EntityChanges`             |
| `substreams sink protojson` | any (writes proto-as-JSON lines)                             |

If the user has the wrong output type, redirect them to the `substreams-sql` skill (for `db_out`) or the `substreams-dev` skill (for `EntityChanges` / custom protos) BEFORE running the sink.

---

## Sink: SQL (Postgres / ClickHouse)

### Install

```bash
# Binary release (preferred):
brew install streamingfast/tap/substreams-sink-sql            # macOS
# or download from: https://github.com/streamingfast/substreams-sink-sql/releases

# From source:
go install github.com/streamingfast/substreams-sink-sql/cmd/substreams-sink-sql@latest
```

### Required files

```
my-substreams/
├── substreams.yaml          # has a db_out module (DatabaseChanges output)
├── my-substreams-v0.1.0.spkg
└── schema.sql               # your CREATE TABLE statements
```

The `schema.sql` MUST define `cursors` and `substreams_history` tables on top of your application tables — the sink uses them for cursor + reorg state. The CLI generates a starter `schema.sql` for you:

```bash
substreams-sink-sql generate <DSN> ./my-substreams.spkg <module_name>
```

### DSN format

```bash
# Postgres
postgresql://user:pass@host:5432/dbname?sslmode=disable

# ClickHouse
clickhouse://default:pass@host:9000/dbname
```

### Setup → Run flow

```bash
# 1. Create DB schema (one-time)
substreams-sink-sql setup "$DSN" ./my-substreams.spkg

# 2. Run the sink (long-running process)
#    CLI signature: substreams-sink-sql run <DSN> <manifest> [<block_range>] -e <endpoint>
#    Module name is auto-inferred from the .spkg if a single sink module exists.
substreams-sink-sql run "$DSN" \
    ./my-substreams.spkg \
    "12000000:+1000000" \
    -e "https://mainnet.eth.streamingfast.io:443"
```

Required env: `SUBSTREAMS_API_KEY` set to your StreamingFast API key.

> **CLI arg order matters and is non-obvious.** Endpoint is a `-e/--endpoint` flag, NOT positional. The module name is positional but optional — only required if your `.spkg` has multiple sink-compatible output modules (rare). Block range syntax: `START:STOP` or `START:+N` for N blocks forward, or omit STOP for open-ended live tailing.

### Two schema mapping modes

The sink supports two ways to map proto → SQL:

1. **`db_out` module** (recommended). Your Substreams emits `DatabaseChanges` directly. Full control over INSERT / UPDATE / UPSERT. See `substreams-sql` skill for proto setup.
2. **Relational mappings ("from-proto")**. Sink derives SQL ops from your output proto using buf annotations on field tags. Simpler for read-only mirrors; can't express updates/deletes cleanly. Skip unless asked.

If you use `db_out`, the proto type MUST be:
```
output:
  type: proto:sf.substreams.sink.database.v1.DatabaseChanges
```

### Cursor management (zero config — automatic)

The sink writes the latest processed cursor to the `cursors` table on every batch. On restart, it picks up from there. **Do not manage cursors manually.** If you delete the row, the sink will re-process from the original `start_block`.

To intentionally restart from scratch:
```bash
substreams-sink-sql undo "$DSN" ./manifest.spkg --all
```

### Reorg handling

- **Postgres**: reorgs handled in real-time. Sink uses `substreams_history` to roll back forks.
- **ClickHouse**: reorgs supported with delay (waits N blocks for finality before writing). Set the buffer with `--undo-buffer-size`.

For tasks that must NEVER see uncommitted data (e.g. accounting, balances), use Postgres OR run with `--final-blocks-only`.

### Hosted SQL sink

StreamingFast offers managed Postgres sinks. There is **no public self-service deploy** — email `sales@streamingfast.io` with your `.spkg` and DSN target. Pinax also offers managed substreams-sink-sql; see https://pinax.network.

---

## Sink: Files (CSV / Parquet → S3, GCS, local)

### When to use

You need bulk data on object storage for downstream ETL (Snowflake, BigQuery, dbt, Athena). NOT for real-time application use — files are batched on a configurable interval.

### Install

```bash
go install github.com/streamingfast/substreams-sink-files/cmd/substreams-sink-files@latest
```

### Output proto: any (you choose)

Unlike SQL, the files sink doesn't mandate a proto shape. You design your output proto, the sink writes one row per repeated entry.

```protobuf
message Transfers {
  repeated Transfer transfers = 1;
}
message Transfer {
  string from = 1;
  string to = 2;
  string amount = 3;
  // ...
}
```

The sink walks `repeated` fields at the top level and emits one CSV/Parquet row per entry.

### Run

```bash
substreams-sink-files run \
    "$ENDPOINT" \
    ./my-substreams.spkg \
    map_transfers \
    s3://my-bucket/transfers/ \
    "12000000:+1000000" \
    --encoder=parquet \
    --buffer-max-size=200000   # rows per file
```

Encoders: `parquet` (recommended for warehouses), `csv`, `jsonl`.

Storage URLs: `s3://`, `gs://`, `file:///abs/path`.

### Cursor

Stored in the destination as a hidden `_cursor.json` next to the output files. Survives restarts.

---

## Sink: PubSub

### Install

```bash
go install github.com/streamingfast/substreams-sink-pubsub/cmd/substreams-sink-pubsub@latest
```

### Required output type

```
output:
  type: proto:sf.substreams.sink.pubsub.v1.Publish
```

The `Publish` proto holds the bytes to publish + topic attributes. Your map module wraps your domain proto into `Publish`.

```rust
use substreams_sink_pubsub::pb::sf::substreams::sink::pubsub::v1::Publish;

#[substreams::handlers::map]
fn map_publish(block: Block) -> Result<Publish, Error> {
    let my_event = MyEvent { /* ... */ };
    let bytes = my_event.encode_to_vec();
    Ok(Publish {
        messages: vec![ Message { data: bytes, attributes: HashMap::new() }],
    })
}
```

### Run

```bash
substreams-sink-pubsub sink \
    -e "$ENDPOINT" \
    --project my-gcp-project \
    ./my-substreams.spkg \
    map_publish \
    my-topic-name
```

GCP credentials via standard `GOOGLE_APPLICATION_CREDENTIALS` env var.

---

## Sink: Webhook (built into substreams CLI)

No separate binary needed. Use the built-in:

```bash
substreams sink webhook \
    -e "$ENDPOINT" \
    ./my-substreams.spkg \
    map_events \
    https://my-app.example.com/webhook
```

Each block's output is POSTed as JSON. Your endpoint must return 2xx; otherwise the sink retries with exponential backoff. Cursor stored in `./state.json` next to the manifest.

**Don't use webhooks for high-volume data.** PubSub or SQL beats it past ~100 events/sec.

---

## Sink: ProtoJSON (testing / debugging)

Built-in, zero install. Just emits proto-as-JSONL files. Use this for local validation before plugging in a real sink:

```bash
substreams sink protojson \
    -e "$ENDPOINT" \
    ./my-substreams.spkg \
    map_my_module \
    ./output_dir/ \
    "12000000:+100"
```

---

## Sink: Subgraph (The Graph)

Substreams-powered subgraphs deploy via `graph deploy`, not via a substreams sink binary. Required output module:

```yaml
- name: graph_out
  kind: map
  inputs:
    - source: sf.substreams.type.v2.Block
  output:
    type: proto:sf.substreams.sink.entity.v1.EntityChanges
```

Then in `subgraph.yaml`:

```yaml
specVersion: 1.2.0
features:
  - nonFatalErrors
dataSources:
  - kind: substreams
    name: my-substreams
    network: mainnet
    source:
      package:
        moduleName: graph_out
        file: ./my-substreams-v0.1.0.spkg
    mapping:
      kind: substreams/graph-entities
      apiVersion: 0.0.7
schema:
  file: ./schema.graphql
```

Deploy: `graph deploy <subgraph-name>` (Studio or hosted).

For `EntityChanges` proto setup and module patterns → use the `substreams-dev` skill.

---

## Hosted vs Self-Hosted Decision

| You want                                           | Pick                                |
|----------------------------------------------------|-------------------------------------|
| Zero ops, paid managed Postgres                    | StreamingFast hosted (sales@) / Pinax |
| Free, you manage the box                           | Self-host `substreams-sink-sql`     |
| Subgraph on The Graph network                       | Substreams-powered Subgraph (decentralized) |
| Files into your data lake                          | Self-host `substreams-sink-files`   |
| Push events to your existing app                   | Stream SDK (`substreams-sink` skill) |

**No public self-service deploy CLI exists today.** Hosted = email + onboarding. Track https://docs.substreams.dev/how-to-guides/sinks for changes.

---

## Common Pitfalls

### 1. Wrong output proto type → sink refuses to start

```
Error: module 'db_out' output type 'proto:my.types.v1.Events'
       does not match expected 'proto:sf.substreams.sink.database.v1.DatabaseChanges'
```

Fix: the substreams module's output proto must EXACTLY match what the sink expects. See table above. For SQL specifically, you must use `db_out` returning `DatabaseChanges` — not your domain proto. The `substreams-sql` skill covers building this module.

### 2. `schema.sql` missing `cursors` table → setup fails

The sink's setup step expects to create / find specific bookkeeping tables. If you hand-wrote `schema.sql` without them, run:
```bash
substreams-sink-sql generate "$DSN" ./manifest.spkg <module>
```
to regenerate, then merge your custom tables in.

### 3. Long-running sink container restarts at block 0 every time

Cursor not persisted. For SQL sink: cursor lives in DB — not affected. For files sink: cursor lives in destination bucket — not affected if you re-point at the same URL. For webhook/protojson: `./state.json` must persist between runs (mount as volume in Docker).

### 4. `block.transactions()` works but ClickHouse sees no rows for ~50 blocks

Reorg buffer. Set `--undo-buffer-size=12` or smaller if you accept some rollback risk. Default holds writes until finality (~32 blocks on Eth, ~12 on Polygon, etc.).

### 5. `substreams-sink-sql` says "auth required" even with API key set

The sink reads `SUBSTREAMS_API_KEY` from env (this is the correct var name — NOT `SUBSTREAMS_API_TOKEN`). If you're using `--api-key-envvar=OTHER_VAR` make sure the env var name matches. JWT mode (older accounts) requires `SUBSTREAMS_API_TOKEN` instead.

### 6. Sink ran but no rows landed — `--batch-block-flush-interval` too large for short ranges

**Default is 1000.** If you process fewer than 1000 blocks (e.g. an eval task with `+100`), the sink batches everything in memory and only commits at process termination — and only the partial completion-callback flush fires. Net result: one partial flush, most blocks lost.

```bash
# Wrong (default 1000) — 100 blocks won't commit
substreams-sink-sql run "$DSN" ./pkg.spkg "18000000:+100" -e "$EP"

# Right — flush every block for short ranges
substreams-sink-sql run "$DSN" ./pkg.spkg "18000000:+100" -e "$EP" \
    --batch-block-flush-interval=1
```

**Production**: leave default `1000` (or set higher for very high-throughput chains like Solana). Tune down only for testing or very low-volume modules.

### 7. "substreams sent a single primary key, but our sql table has a composite primary key" — PK wire format mismatch

Sink v4+ enforces strict matching between `schema.sql` and the wire-format PK from your `db_out` Rust module:

| Your `schema.sql` declares                                  | Your Rust code MUST send                          |
|-------------------------------------------------------------|---------------------------------------------------|
| `PRIMARY KEY (id)` (single column)                          | `tables.create_row("t", &id)` — single string    |
| `PRIMARY KEY (tx_hash, log_index)` (composite, 2+ columns)  | `tables.create_row("t", [("tx_hash", &h), ("log_index", li)])` — slice of (col, val) tuples |

If you see this error: either rewrite the Rust to send a tuple slice, OR change the schema to a single-column synthetic PK (`id VARCHAR PRIMARY KEY`) and concatenate fields in Rust (`format!("{}-{}", tx_hash, log_index)`).

For build-side patterns → `substreams-sql` skill.

### 8. Module hash mismatch on restart after schema/code changes

You changed your `.spkg` and now the sink errors:
```
module hash mismatch: cursor was for hash X, current module is hash Y
```

The cursor pins a specific module-hash to detect drift. Two options:
```bash
# Restart from the cursor's block, ignoring hash change (data may be inconsistent)
substreams-sink-sql run ... --on-module-hash-mismatch=warn

# Or reset the cursor — sink starts from scratch
substreams-sink-sql run ... --on-module-hash-mismatch=ignore
```

For accuracy, prefer wiping the destination and re-running rather than `ignore` — partial data from the old module hash mixed with new data is a debugging nightmare.

### 9. PubSub "permission denied"

GCP service account needs `pubsub.publisher` on the topic. Check `gcloud auth application-default login` is set, OR `GOOGLE_APPLICATION_CREDENTIALS` points at a key file with the right role.

---

## Production Patterns

### Backfill then live

For initial load of millions of blocks then continuous tailing:

```bash
# 1. Backfill (bounded range, parallel-friendly with --workers=N)
substreams-sink-sql run "$DSN" ./pkg.spkg "12000000:18000000" -e "$EP" --workers=8

# 2. Live (start = stop block of backfill, omit stop for open-ended)
substreams-sink-sql run "$DSN" ./pkg.spkg "18000000:" -e "$EP" --workers=1
```

For files sink: same pattern, single command `--start-block=12000000 --stop-block=18000000` then a separate live run.

### Monitoring

All sinks expose Prometheus metrics on `--metrics-listen-addr=:9100`:
- `substreams_sink_block_height` — last processed block
- `substreams_sink_blocks_per_second` — throughput
- `substreams_sink_undo_count` — reorgs handled

Alert on:
- block_height stalled for > N minutes
- undo_count rising fast (chain instability or node issue)

### Reorg-safe accounting

If your sink writes balances/totals, you MUST use Postgres + `db_out` with `UPSERT`. ClickHouse + relational-mappings can produce double-counted rows during reorgs. When in doubt, run with `--final-blocks-only` (sacrifices ~1 minute of latency for zero rollback risk).

### Restart safety

Kill -9 the sink mid-batch. Restart. Sink reads cursor → resumes at last committed block → no duplicate rows (atomic per-batch commit). This is by design; do not add your own dedup logic.

---

## Quick Reference: Full Example (SQL → Postgres)

```bash
# Prereqs
export SUBSTREAMS_API_KEY=server_xxx
export DSN="postgresql://user:pass@localhost:5432/mydb?sslmode=disable"

# 0. Get a working substreams package with a db_out module
#    (see substreams-sql skill for the build side)

# 1. Generate schema.sql template
substreams-sink-sql generate "$DSN" ./erc20.spkg db_out > schema.sql
# Edit schema.sql to add your domain tables (the sink-managed cursors/history tables are pre-generated)

# 2. Create DB tables
substreams-sink-sql setup "$DSN" ./erc20.spkg

# 3. Run sink (foreground; use systemd/docker for production)
substreams-sink-sql run "$DSN" \
    ./erc20.spkg \
    "12000000:+10000" \
    -e "https://mainnet.eth.streamingfast.io:443" \
    --metrics-listen-addr=:9100

# 4. Query
psql "$DSN" -c "SELECT count(*) FROM erc20_transfers"
```

---

## Resources

- Sinks overview: https://docs.substreams.dev/how-to-guides/sinks
- SQL sink: https://github.com/streamingfast/substreams-sink-sql
- Files sink: https://github.com/streamingfast/substreams-sink-files
- PubSub sink: https://github.com/streamingfast/substreams-sink-pubsub
- Hosted: sales@streamingfast.io
- Pinax: https://pinax.network
- The Graph (subgraphs): https://thegraph.com/docs/en/cookbook/substreams-powered-subgraphs/
