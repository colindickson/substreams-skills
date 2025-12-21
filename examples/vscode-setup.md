# VS Code Setup for Substreams Skills

**Requirements:** VS Code 1.107 or later with experimental Claude Skills feature enabled.

## Step 1: Clone Repository

```bash
cd ~/
git clone https://github.com/streamingfast/substreams-skills.git
```

## Step 2: Enable Experimental Feature

1. Open VS Code settings (File → Preferences → Settings or `Cmd+,` on Mac)
2. Search for "Claude Skills" or navigate to experimental features
3. Enable the Claude Skills experimental feature

## Step 3: Configure Skills

Add skill directories to your VS Code settings (`.vscode/settings.json` or user settings):

```json
{
  "claude.skills": [
    "~/substreams-skills/skills/substreams-dev",
    "~/substreams-skills/skills/substreams-sql",
    "~/substreams-skills/skills/substreams-testing"
  ]
}
```

**Note:** Adjust paths to absolute paths if needed:

```json
{
  "claude.skills": [
    "/Users/yourname/substreams-skills/skills/substreams-dev",
    "/Users/yourname/substreams-skills/skills/substreams-sql",
    "/Users/yourname/substreams-skills/skills/substreams-testing"
  ]
}
```

## Step 4: Verify Installation

Ask Claude in VS Code:

> "What Substreams skills are available?"

You should see all available skills listed.

## Step 5: Test a Skill

Ask Claude:

> "How do I create a new Substreams map module?"

The `substreams-dev` skill should activate and provide guidance.

## Updating Skills

```bash
cd ~/substreams-skills
git pull
```

Reload VS Code window for skills to update.

## Reference

* [VS Code 1.107 Release Notes - Claude Skills](https://code.visualstudio.com/updates/v1_107#_reuse-your-claude-skills-experimental)

