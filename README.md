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

1. Run `/plugin` to open the plugin manager
1. Go to the **Marketplaces** tab
1. Select **Add marketplace** and enter: `streamingfast/substreams-skills`
1. Go to the **Discover** tab
1. Find and install the `substreams-dev` plugin
1. Restart Claude instance(s) (otherwise `skills` are not properly re-discovered).

After installation, Claude will automatically use the Substreams expertise when working on relevant projects.

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

## Available Skills

| Skill | Description |
|-------|-------------|
| `substreams-dev` | Expert knowledge for developing, building, and debugging Substreams projects |

Future skills (coming soon):
- **substreams-sql** - SQL database sinks (PostgreSQL, ClickHouse)
- **substreams-testing** - Testing strategies and best practices

## Plugin Structure

```
substreams-skills/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata
└── skills/
    └── substreams-dev/
        ├── SKILL.md          # Main skill content
        └── references/       # Additional reference materials
            ├── manifest-spec.md
            ├── module-types.md
            ├── networks.md
            └── patterns.md
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
