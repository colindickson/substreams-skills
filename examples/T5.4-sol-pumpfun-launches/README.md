# T5.4 — Pump.fun Launches (Solana)

**Skill exercised:** `substreams-dev` (Solana section)
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · 2 trials, both 6/6

## Goal

Track new token launches on pump.fun (program `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`). Each launch emits the bonding-curve `create` instruction. Pull token mint, name, symbol, creator, initial virtual SOL + token reserves.

## Prompt

> Build a Substreams on Solana mainnet that tracks new token launches on pump.fun.
>
> pump.fun program ID: `6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P`
>
> For each new token launch, emit: slot, signature, mint, name, symbol, creator, initial virtual SOL reserves, initial virtual token reserves.
>
> pump.fun uses Anchor. The relevant instruction is `create`.

## What the skill provided

- Anchor `create` instruction discriminator (`sha256("global:create")[0..8]`)
- Instruction-data parsing: variable-length string fields (length-prefixed) followed by fixed `u64` reserves
- Account index resolution for `mint`, `creator`, `bonding_curve`

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_pumpfun_launches -s 320000000 -t +100 -o jsonl
```

## Notes

pump.fun launches hundreds of tokens per minute, so any 100-slot window has plenty of records. Useful as a high-volume Anchor parsing test.
