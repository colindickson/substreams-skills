# Substreams Skills

Agent Skills for Substreams development - open-source expertise packages for AI assistants.

## What is this?

This is a **Claude Code Plugin** that provides AI assistants with expert knowledge about Substreams - a high-performance blockchain data indexing and transformation technology.

When installed, Claude gains deep expertise in:
- Building Substreams projects with `substreams.yaml` manifests
- Writing Rust modules (map, store, index types)
- Creating protobuf schemas for blockchain data
- Performance optimization and debugging

## Installation

### Claude Code (Recommended)

**Step 1: Add the marketplace**

```bash
/plugin marketplace add streamingfast/substreams-skills
```

**Step 2: Install the plugin**

```bash
/plugin install substreams@streamingfast-substreams
```

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
