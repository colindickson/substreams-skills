# T5.3 — Raydium CLMM Swaps (Solana)

**Skill exercised:** `substreams-dev` (Solana section)
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · 2 of 4 trials at 6/6 (after `walk_instructions` skill fix)

## Goal

Track swaps on Raydium Concentrated Liquidity Market Maker (program `CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK`). Emit slot, signature, pool, input/output amounts (raw u64 strings), direction, post-swap tick.

Raydium uses Anchor — `swap` and `swap_v2` instructions are dispatched by 8-byte discriminators.

## Prompt

(Full prompt in eval/ — describes the swap instruction discriminator + data layout.)

## What the skill provided

- Anchor discriminator computation: `sha256("global:swap")[0..8]`
- `walk_instructions()` for both top-level and inner instruction processing
- Instruction-data parsing patterns (little-endian u64 reads, account index lookups)

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_raydium_swaps -s 320000000 -t +100 -o jsonl
```

## Notes

Earlier trials (pre-skill-fix) produced an empty output — the agent iterated only top-level instructions and missed swaps emitted as inner instructions. The fix was a clearer `walk_instructions()` example in the skill.
