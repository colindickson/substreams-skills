# T5.2 — Solana USDC Transfers

**Skill exercised:** `substreams-dev` (Solana section)
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · best 1 of 2 trials at 6/6 (one 5/6 from minor field-name variance)

## Goal

Track all SPL Token transfers of USDC on Solana mainnet. Emit slot, signature, source/destination token accounts, raw u64 amount, signing authority.

USDC mint: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
SPL Token program: `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`

## Prompt

Prompt covered `Transfer` vs `TransferChecked` instruction discrimination and mint-account resolution. Not reproduced here.

## What the skill provided

- `walk_instructions()` for top-level + inner instruction iteration in one pass
- SPL Token program discriminators (`Transfer = 3`, `TransferChecked = 12`)
- `b58!` macro for compile-time program ID + mint constants (no runtime base58 decode)
- Account index resolution against `transaction.message.accountKeys`

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_usdc_transfers -s 320000000 -t +100 -o jsonl
```
