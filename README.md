# Substreams Skills

Agent Skills for Substreams development - open-source expertise packages for AI assistants.

## What are Agent Skills?

Agent Skills are folders containing instructions and resources that AI assistants can load dynamically to gain expertise in specific domains. These skills follow the open [Agent Skills specification](https://agentskills.io/specification).

## Available Skills

Skills will be added incrementally. Check back soon for:
- **Substreams Development** - Building Substreams projects, manifests, modules
- **Substreams SQL** - SQL database sinks (PostgreSQL, ClickHouse)
- **Substreams Testing** - Testing strategies and best practices

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

