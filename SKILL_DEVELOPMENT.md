# Skill Development Guide

Guidelines for contributing new skills to this repository.

## Skill Format

Each skill is a directory with:
- `SKILL.md`: Main skill file with YAML frontmatter
- `references/`: Supporting documentation (loaded on-demand)

## YAML Frontmatter Requirements

```yaml
---
name: skill-name              # Required: 1-64 chars, lowercase, alphanumeric + hyphens
description: Brief description # Required: 1-1024 chars, when to use this skill
license: Apache-2.0           # Optional but recommended
compatibility:                # Optional: target platforms
  platforms: [claude-code, cursor, vscode, windsurf]
metadata:                     # Optional: additional info
  version: 1.0.0
  author: StreamingFast
  documentation: https://substreams.streamingfast.io
---
```

## Content Guidelines

### Keep it Concise

* **Metadata**: ~100 tokens (loaded at startup)
* **Main content**: <5000 tokens (loaded on activation)
* **References**: No limit (loaded on-demand)

### Structure

1. **Overview**: What this skill does
2. **When to Use**: Clear activation criteria
3. **Core Concepts**: Essential knowledge
4. **Common Workflows**: Step-by-step guides
5. **Examples**: Concrete code samples
6. **Troubleshooting**: Common issues
7. **Resources**: Links to references

### Writing Style

* **Clear and direct**: Avoid fluff
* **Actionable**: Provide specific steps
* **Examples**: Show, don't just tell
* **Progressive**: Basic to advanced
* **Links**: Reference detailed docs for deep dives

## Validation

Before submitting, validate your skill:

```bash
# Validate specific skill
skills-ref validate ./skills/your-skill

# Validate all skills
./scripts/validate-all.sh
```

## Testing

Test your skill with AI tools:

1. Load skill in Claude Code/Cursor
2. Ask questions that should activate it
3. Verify responses use skill knowledge
4. Check references load correctly

## Submitting

1. Create feature branch from `develop`
2. Create your skill in `skills/your-skill/`
3. Add tests if applicable
4. Run validation: `./scripts/validate-all.sh`
5. Submit pull request to `develop` with:
   * Skill description
   * When it should be used
   * Testing notes

## Review Criteria

- [ ] Frontmatter valid and complete
- [ ] Description clearly states when to use
- [ ] Content under 5000 tokens (main SKILL.md)
- [ ] References properly linked
- [ ] Examples are correct and tested
- [ ] Validation passes
- [ ] No duplicate content with existing skills

## Questions?

Open an issue or ask in [StreamingFast Discord](https://discord.gg/streamingfast)

