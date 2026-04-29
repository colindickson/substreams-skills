# T6.2 — Marinade Deposits from Anchor Source (no IDL)

**Skill exercised:** `substreams-dev` (Solana section)
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · 2 trials, both 6/6

## Goal

Track Marinade Finance `deposit` instructions (program `MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD`). **No IDL JSON allowed** — derive the Anchor instruction discriminator and parse the instruction data layout from Anchor Rust source provided with the task.

## Prompt

> Build a Substreams on Solana mainnet that tracks Marinade Finance `deposit` instructions.
>
> The Rust source for the deposit instruction is provided in `context/deposit.rs`. **Do not use any IDL JSON file.** Compute the Anchor instruction discriminator from the source (`sha256("global:deposit")[0..8]`) and parse the instruction data layout from the source.
>
> For each deposit: slot, signature, user wallet, sol_amount (lamports), msol_minted.

## What the skill provided

- Anchor discriminator formula: `sha256("global:<name>")[0..8]`
- Instruction-data parsing pattern (8-byte discriminator + little-endian payload)
- Account-index extraction for the `transfer_from` signer

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_marinade_deposits -s 250000000 -t +100 -o jsonl
```

## Notes

Real-world parallel: many Anchor programs publish source on GitHub but no IDL on-chain or in npm. Computing the discriminator from `sha256("global:<instruction>")` and reading the `#[derive(AnchorDeserialize)]` struct lets you parse instructions without a published IDL.

For the IDL-free path on Ethereum (Solidity source instead of Rust), see [T6.1](../T6.1-eth-univ2-no-abi/).
