# T2.1 — NFT Mints (Ethereum)

**Skill exercised:** `substreams-dev`
**Model:** claude-sonnet-4-6
**Result:** Build OK · Run OK · Correctness 100% · 2 trials (best 6/6, one 4/6 due to extra `logIndex` field naming variance)

## Goal

Track NFT mints across all ERC721 contracts. Mint = `Transfer(from, to, tokenId)` where `from` is the zero address. Emit contract, token id, minter, tx hash, log index, block number.

## Prompt

> Build a Substreams on Ethereum mainnet that tracks NFT mints across any ERC721 contract.
>
> A mint = any ERC721 `Transfer(from, to, tokenId)` event where `from` is the zero address.
>
> For each mint, emit:
> - contract address
> - token id (as string — tokenIds can exceed u64)
> - minter (the `to` address)
> - transaction hash
> - log index
> - block number
>
> Don't filter by contract address — track mints across ALL ERC721 contracts. Ignore ERC1155 for this task.

## What the skill provided

- ERC20 vs ERC721 disambiguation by **topic count** (ERC20 = 3 topics, ERC721 = 4)
- Topic0 hash for `Transfer(address,address,uint256)`
- `tokenId` as string pattern (avoids u64 overflow for large ids)

## Files

- [`substreams.yaml`](substreams.yaml)
- [`Cargo.toml`](Cargo.toml)
- [`proto/nft_mints.proto`](proto/nft_mints.proto)
- [`src/lib.rs`](src/lib.rs)

## Reproduce

```bash
substreams build
substreams run ./substreams.yaml map_nft_mints -s 18000000 -t +100 -o jsonl
```

## Notes

ERC20 and ERC721 share the same topic0 hash for `Transfer`. The disambiguator is topic count: ERC20 indexes 2 fields (3 topics including the signature), ERC721 indexes 3 (4 topics). Filtering on `topics.len() == 4` separates them.
