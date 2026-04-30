# T4.2 — "I want Uniswap data in my database" (cautionary)

**Skill exercised:** `substreams-dev`, `substreams-sql`
**Model:** claude-sonnet-4-6
**Result:** Silent ship — agent built a full V3-to-Postgres pipeline without asking any clarifying question.

## What this example shows

Like [T4.1](../T4.1-whale-activity/), this is **not a pattern to copy**. It illustrates the same skill limitation: vague prompts produce confident guesses, not questions.

## The prompt

> I want Uniswap data in my database.

Real ambiguity:

- V2, V3, V4? Or all three?
- Which chain — mainnet, Arbitrum, Optimism, Base?
- Which database — Postgres, ClickHouse, MySQL?
- Which entities — pools, swaps, mints/burns, positions, fees?
- Cumulative or windowed (per-day, per-hour)?
- All-time or last N blocks?

## What the agent did

Across 3 trials, the agent shipped:

- **V3 only** (V2 silently excluded)
- **Mainnet** (other chains not considered)
- **Postgres** (no clarification on DB engine)
- **Swap entities** (no pools, no fees, no positions)
- A `db_out` module + schema, building cleanly

It built a working pipeline. It just wasn't necessarily the pipeline the user wanted. No clarifying question was asked.

## Why this happens

See [T4.1 — Why this happens](../T4.1-whale-activity/#why-this-happens-and-why-were-flagging-it). Same root cause: model posture defaults to producing artifacts on vague prompts.

## What to do instead

For a specific Uniswap-to-DB pipeline that does work end-to-end, see:

- [T2.3 — Postgres SQL sink (USDC transfers)](../T2.3-sql-sink/) — fully specified table schema + composite PK
- [T3.2 — Cross-DEX volume to graph_out](../T3.2-cross-dex-volume/) — explicit V2 + V3 aggregation, exact entity schema
- [T7.1 — Deploying a SQL sink to Postgres](../T7.1-sink-sql-deploy/) — operationalizing the T2.3 sink

If you actually want "Uniswap data in my database," start by deciding: which version (V2/V3/V4), which chain, which DB, which entities, what time window. Then the same skill produces a clean, building, running pipeline.
