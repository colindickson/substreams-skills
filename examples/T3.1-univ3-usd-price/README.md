# T3.1 — Uniswap V3 Swaps + USD Price (Ethereum)

**Skill exercised:** `substreams-dev`
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · best 2 of 4 trials at 6/6 (after `RpcBatch` skill patch)

## Goal

Track Uniswap V3 swaps. For each swap, compute USD price using sqrtPriceX96 + token decimals. If the pool contains a USD-pegged stable (USDC/USDT/DAI), report token0's USD price; otherwise emit `null`.

## Prompt

(See full prompt in eval/, ~50 lines including the `(sqrtPriceX96 / 2^96)^2 * 10^(decimals0 - decimals1)` formula and stable-coin reference token list.)

## What the skill provided

- ABI generation via `build.rs` for `UniswapV3Pool` + ERC20
- **V3 pool token resolution pattern** — explicit `RpcBatch` example for fetching `pool.token0()` / `pool.token1()` from chain. Without this, agents either hardcoded known tokens or failed to resolve them. (Skill patch landed mid-eval; trials before the patch averaged 41% match, after the patch 100%.)
- `BigInt` / `BigDecimal` for sqrtPriceX96 math (256-bit precision)
- USD pricing logic conditional on stable-coin presence

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`build.rs`](build.rs)
- [`abi/`](abi/), [`src/abi/`](src/abi/)
- [`proto/uniswap_v3.proto`](proto/uniswap_v3.proto)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_swaps -s 18000000 -t +100 -o jsonl
```

## Notes

V3 pool token resolution is the major skill gap surfaced by this task. Agents reliably miss `pool.token0()` / `pool.token1()` resolution unless the skill includes a copy-paste `RpcBatch` example. After patching, 2/2 fresh trials reach 100% match.
