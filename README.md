# Substreams Skills

Agent Skills for Substreams development - open-source expertise packages for AI assistants.

## What is this?

This is a **Claude Code Plugin** that provides AI assistants with expert knowledge about Substreams - a high-performance blockchain data indexing and transformation technology.

When installed, Claude gains deep expertise in:
- Building Substreams projects with `substreams.yaml` manifests
- Writing Rust modules (map, store, index types)
- Creating protobuf schemas for blockchain data
- Performance optimization and debugging

## Available Skills

### ✅ Substreams Development (`substreams-dev`)
Expert knowledge for developing, building, and debugging Substreams projects on any blockchain. Comprehensive guidance on:
- Creating and configuring `substreams.yaml` manifests
- Writing efficient Rust modules (map, store, index types)
- Protobuf schema design and code generation
- Performance optimization and avoiding excessive cloning
- Debugging and troubleshooting common issues

### ✅ Substreams SQL (`substreams-sql`)
Expert knowledge for building SQL database sinks from Substreams data. Covers both approaches:
- **Database Changes (CDC)** - Stream individual row changes for real-time consistency
- **Relational Mappings** - Transform data into normalized tables with proper relationships
- **PostgreSQL** - Advanced patterns, indexing strategies, and performance optimization
- **ClickHouse** - Analytics-optimized schemas, materialized views, and time-series patterns
- **Schema Design** - Best practices for blockchain data modeling

### ✅ Substreams Testing (`substreams-testing`)
Expert knowledge for testing Substreams applications at all levels. Complete testing strategy:
- **Unit Testing** - Testing individual functions with real blockchain data
- **Integration Testing** - End-to-end workflows with real block processing
- **Performance Testing** - Benchmarking, memory profiling, and production mode validation
- **FireCore Tools** - Using Firehose, StreamingFast API, and testing utilities
- **CI/CD Integration** - Automated testing pipelines and regression detection

## Installation

### Claude Code (Recommended)

To install the plugin (which pulls the skills):

```bash
claude plugin marketplace add https://github.com/streamingfast/substreams-skills
claude plugin install substreams-dev
```

Or use the `/plugin` interactive flow directly within `claude`.

Validate that everything works properly by running `/skills` within `claude`, see example output:

```
...

Plugin skills (plugin)
substreams-dev · ~58 description tokens
substreams-sink · ~57 description tokens
substreams-sql · ~48 description tokens
substreams-testing · ~43 description tokens
```

**Alternative: Local Development**

Clone and load directly without installing:

```bash
git clone https://github.com/streamingfast/substreams-skills.git
claude --plugin-dir ./substreams-skills
```

### Cursor

Add the skill directory path in Cursor settings:
```
~/substreams-skills/skills/substreams-dev
```

### VS Code

VS Code 1.107+ supports Claude Skills (experimental feature):

1. Enable the experimental feature in settings
2. Add skill paths to your configuration
3. Skills will be available to Claude in VS Code

See [VS Code 1.107 release notes](https://code.visualstudio.com/updates/v1_107#_reuse-your-claude-skills-experimental) for details.

## Examples & Evaluation

Real Substreams projects an agent built end-to-end from a natural-language prompt, using these skills:

- [`examples/`](./examples/) — 16 example directories (14 working case studies + 2 cautionary tales; Ethereum + Solana, single-map to multi-module, SQL sink, Anchor, no-ABI/no-IDL flows)
- [`EVAL.md`](./EVAL.md) — one-page summary of the test pass: 100% build/run, 12/14 byte-match correctness on the best trial

Setup guides for various editors live under [`guides/`](./guides/).

## Plugin Structure

```
substreams-skills/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
└── skills/
    ├── substreams-dev/
    │   ├── SKILL.md          # Main skill content
    │   └── references/       # Additional reference materials
    │       ├── manifest-spec.md
    │       ├── module-types.md
    │       ├── networks.md
    │       └── patterns.md
    ├── substreams-sql/
    │   ├── SKILL.md
    │   └── references/
    │       ├── clickhouse-patterns.md
    │       └── database-changes.md
    └── substreams-testing/
        ├── SKILL.md
        └── references/
            ├── firecore-tools.md
            └── integration-testing.md
```

## Contributing

See [SKILL_DEVELOPMENT.md](./SKILL_DEVELOPMENT.md) for guidelines on creating new skills.

## Validation

Validate all skills against the specification:

```bash
npm run validate
```

## License

Apache 2.0 - See [LICENSE](./LICENSE)

## Resources

* [Substreams Documentation](https://substreams.streamingfast.io)
* [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
* [StreamingFast Discord](https://discord.gg/streamingfast)
