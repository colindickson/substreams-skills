# Substreams Skills

Agent Skills for Substreams development - open-source expertise packages for AI assistants.

## What are Agent Skills?

Agent Skills are folders containing instructions and resources that AI assistants can load dynamically to gain expertise in specific domains. These skills follow the open [Agent Skills specification](https://agentskills.io/specification).

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

### Claude Code

1. Clone this repository:
   ```bash
   git clone https://github.com/streamingfast/substreams-skills.git
   cd substreams-skills
   ```

2. In Claude Code settings, add skill paths:
   ```
   ~/substreams-skills/skills/substreams-dev
   ~/substreams-skills/skills/substreams-sql
   ~/substreams-skills/skills/substreams-testing
   ```

### Cursor

Similar to Claude Code - add skill directory paths in Cursor settings.

### VS Code

VS Code 1.107+ supports Claude Skills (experimental feature). Configure in your VS Code settings:

1. Enable the experimental feature in settings
2. Add skill paths to your configuration
3. Skills will be available to Claude in VS Code

See [VS Code 1.107 release notes](https://code.visualstudio.com/updates/v1_107#_reuse-your-claude-skills-experimental) for details.

## Contributing

See [SKILL_DEVELOPMENT.md](./SKILL_DEVELOPMENT.md) for guidelines on creating new skills.

## Validation

All skills are validated against the Agent Skills specification:

```bash
# Install skills-ref CLI (if not already installed)
npm install -g @anthropic/skills-ref

# Validate all skills
./scripts/validate-all.sh
```

## License

Apache 2.0 - See [LICENSE](./LICENSE)

## Resources

* [Substreams Documentation](https://substreams.streamingfast.io)
* [Agent Skills Specification](https://agentskills.io/specification)
* [StreamingFast Discord](https://discord.gg/streamingfast)

