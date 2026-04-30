# T6.1 — Uniswap V2 Swaps from Solidity Source (no ABI JSON)

**Skill exercised:** `substreams-dev`
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · 2 trials, both 6/6

## Goal

Index Swap events on the USDC-ETH Uniswap V2 pair (`0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc`). **No pre-computed ABI JSON allowed** — derive the event signature and topic0 hash from the Solidity source supplied with the task.

## Prompt

> Build a Substreams on Ethereum mainnet that indexes Swap events on the USDC-ETH Uniswap V2 pair.
>
> The Solidity source for UniswapV2Pair is provided in `context/UniswapV2Pair.sol`. **Do not use any pre-computed ABI JSON.** Derive the event signature and topic0 hash from the Solidity source provided.
>
> For each Swap event, emit: tx hash, log index, sender, to, amount0_in/out, amount1_in/out, block number.

(`context/UniswapV2Pair.sol` was supplied as task context during evaluation; it is not committed to this repo.)

## What the skill provided

- Raw topic-match decoding pattern (no `abigen` required for a single well-known event)
- Topic-count disambiguation + ABI decoding for indexed vs non-indexed parameters
- `keccak256` of canonical event signature → topic0 derivation guidance

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`proto/univ2_swaps.proto`](proto/univ2_swaps.proto)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_swaps -s 18000000 -t +100 -o jsonl
```

## Notes

Real-world parallel: many older or unverified contracts have no ABI JSON readily available. Reading the Solidity source and computing topic0 from the canonical signature is the fallback.

For the full token-metadata variant (with ABI generation), see [T2.2](../T2.2-univ2-swaps/).
