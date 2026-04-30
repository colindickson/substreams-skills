# T4.1 — "Track whale activity on Ethereum" (cautionary)

**Skill exercised:** `substreams-dev`
**Model:** claude-sonnet-4-6
**Result:** Silent ship — agent built a full pipeline without asking any clarifying question.

## What this example shows

This is **not a working pattern to copy**. It's a cautionary tale about an open limitation of these skills.

## The prompt

> Track whale activity on Ethereum.

That's the entire prompt. It's intentionally underspecified — a real user might mean any of:

- Large native ETH transfers? Threshold?
- Large ERC20 transfers? Across all tokens, or a watchlist?
- DEX trades above some USD value?
- Specific whale wallets being monitored?
- Last hour, last day, real-time stream?

## What the agent did

Across 3 trials, every run silent-shipped a full Substreams project with hardcoded choices:

- Picked a threshold (varied: ≥100 ETH, ≥1000 ETH, ≥$1M USD value)
- Picked a token universe (some did native ETH only; some included a top-20 ERC20 list)
- Picked an output schema with no input from the user
- Did **not** ask a single clarifying question

The skill text was iterated three times to add a "pre-flight clarification" preamble. Behavioral effect on this prompt: zero.

## Why this happens (and why we're flagging it)

Skill content is loaded into the agent's context, but it cannot fully override the model's posture. When given a vague prompt, the model defaults to **producing artifacts** rather than **asking questions**. This is a model-layer behavior, not a skill bug — fixing it requires a harness-level vague-prompt detector, which is out of scope for these skills.

## What to do instead

**Be specific.** The same agent given a tightly-scoped prompt produces correct, high-quality output (see all the other examples in this folder). Compare with:

- [T1.2 — USDC transfers](../T1.2-usdc-transfers/) — fully specified ERC20 transfer task, 100% match
- [T2.2 — Uniswap V2 swaps](../T2.2-univ2-swaps/) — fully specified with Swap event signature + factory address
- [T3.1 — V3 swaps + USD price](../T3.1-univ3-usd-price/) — includes the exact sqrtPriceX96 formula

If you're unsure how to scope a Substreams task, write the prompt as a prose paragraph but include: chain, contract addresses or event signatures, exact fields you want emitted, block range for testing.
