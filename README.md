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

### ✅ Substreams Sink (`substreams-sink`)
Expert knowledge for consuming Substreams data in custom applications. Use when integrating Substreams outputs directly into Go, JavaScript, Python, or Rust code:
- **Go sink** — cursor management, reorg handling, gRPC streaming
- **JavaScript sink** — Node.js integration and event handling
- **Python / Rust** — SDK usage and production patterns

### ✅ Substreams Sink Deployment (`substreams-sink-deploy`)
Expert operational guide for running and deploying Substreams sink binaries. Covers:
- **Sink selection** — decision tree for SQL, Files, PubSub, Webhook, ProtoJSON, Subgraph
- **SQL sink** — DSN formats, schema setup, cursor management, reorg handling (Postgres + ClickHouse)
- **Files sink** — CSV/Parquet to S3, GCS, or local storage
- **PubSub / Webhook** — event streaming and HTTP delivery
- **Production patterns** — backfill + live tailing, monitoring, restart safety
- **Common pitfalls** — wrong proto type, missing domain tables/schema.sql, PK mismatch, batch flush tuning

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
substreams-sink-deploy · ~62 description tokens
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
    ├── substreams-sink/
    │   └── SKILL.md
    ├── substreams-sink-deploy/
    │   └── SKILL.md
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
