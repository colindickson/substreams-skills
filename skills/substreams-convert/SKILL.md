---
name: substreams-convert
description: Expert knowledge for converting existing blockchain indexing projects into Substreams. Use when migrating a subgraph (The Graph) or a Solana program/contract into a Substreams module pipeline.
license: Apache-2.0
compatibility:
  platforms: [claude-code, cursor, vscode, windsurf]
metadata:
  version: 1.0.0
  author: StreamingFast
  documentation: https://substreams.streamingfast.io
---

# Substreams Conversion Expert

Expert assistant for converting existing blockchain indexing projects — subgraphs and Solana contracts — into high-performance Substreams pipelines.

## Core Concepts

### Why Convert to Substreams?

Substreams offers several advantages over traditional indexers:

- **Parallelism**: Substreams processes historical data in parallel, providing up to 100× faster backfill than sequential indexers
- **Composability**: Modules from different packages can be combined, enabling code reuse across teams
- **Portability**: The same module logic can output to Postgres, ClickHouse, The Graph, Kafka, or any custom sink
- **Determinism**: WASM execution ensures identical outputs for identical inputs on any runner

### Supported Conversion Inputs

This skill covers two main conversion paths:

| Input | Reference File | Description |
|---|---|---|
| **Subgraph** (The Graph) | [references/subgraph.md](./references/subgraph.md) | Convert a GraphQL-schema subgraph with AssemblyScript handlers to Substreams |
| **Solana Contract** | [references/solana-contract.md](./references/solana-contract.md) | Build a Substreams pipeline from a Solana program (on-chain IDL or raw instructions) |

## When to Use This Skill

Load this skill when the user wants to:

- Migrate a subgraph (`.yaml` + `schema.graphql` + AssemblyScript mappings) to Substreams
- Build a Substreams module that feeds graph-node via `graph_out` / `EntityChanges`
- Convert a Solana program's IDL or raw instruction layout into Substreams Rust handlers
- Understand the conceptual mapping between subgraph entities and Substreams protobuf types
- Understand the conceptual mapping between Solana programs/instructions and Substreams modules

## Conversion Workflow Overview

### Step 1 — Identify the source

Ask the user which type of project they are converting:
- A subgraph (provides `subgraph.yaml`, `schema.graphql`, AssemblyScript mappings)?
- A Solana contract/program (provides program ID, IDL, or raw instruction spec)?

### Step 2 — Load the relevant reference

- **Subgraph** → read [references/subgraph.md](./references/subgraph.md)
- **Solana Contract** → read [references/solana-contract.md](./references/solana-contract.md)

### Step 3 — Map the schema

Convert the source schema into Substreams protobuf types (`.proto` files).

### Step 4 — Implement Rust handlers

Translate the source handlers (AssemblyScript or Anchor/native Rust) into Substreams `map` and `store` modules.

### Step 5 — Configure the manifest

Wire modules together in `substreams.yaml`, referencing `initialBlock` from the original data source definition.

### Step 6 — Build and verify

> **Also load `substreams-dev`** for Cargo.toml setup, build commands, `initialBlock` guidance, and general Rust module development patterns.
> **Also load `substreams-sink`** if the target output is `graph_out` (EntityChanges for Graph Node) or any other sink type.
> **Also load `substreams-sink-deploy`** when ready to run the converted substreams against a live sink (Graph Node, Postgres, etc.).

```bash
substreams build
substreams run ./substreams.yaml <output_module> -s <start_block> -t +100 -o jsonl
```

## Key Differences from Traditional Indexers

| Concept | Subgraph / Traditional | Substreams |
|---|---|---|
| Language | AssemblyScript / JavaScript | Rust (compiled to WASM) |
| Schema | GraphQL SDL | Protobuf |
| Handler trigger | Event / call template | Block-level map module |
| State | Entity store (auto-managed) | Explicit `store` modules |
| Output | GraphQL API | Protobuf stream → any sink |
| Reorg handling | Automatic (graph-node) | Cursor-based, explicit |
| Backfill speed | Sequential | Parallel (up to 100×) |

## Resources

- [Substreams Documentation](https://substreams.streamingfast.io)
- [Substreams GitHub](https://github.com/streamingfast/substreams)
- [The Graph Substreams Integration](https://thegraph.com/docs/en/substreams-powered-subgraphs/)
- [substreams-sink-subgraph](https://github.com/streamingfast/substreams-sink-subgraph)
- [Subgraph Conversion Reference](./references/subgraph.md)
- [Solana Contract Conversion Reference](./references/solana-contract.md)
