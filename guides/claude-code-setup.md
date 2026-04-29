# Claude Code Setup for Substreams Skills

## Step 1: Clone Repository

```bash
cd ~/
git clone https://github.com/streamingfast/substreams-skills.git
```

## Step 2: Configure Claude Code

1. Open Claude Code settings
2. Navigate to "Skills" section
3. Add skill directories:
   * `~/substreams-skills/skills/substreams-dev`
   * `~/substreams-skills/skills/substreams-sql`
   * `~/substreams-skills/skills/substreams-testing`

## Step 3: Verify Installation

Ask Claude:

> "What Substreams skills are available?"

You should see all available skills listed.

## Step 4: Test a Skill

Ask Claude:

> "How do I create a new Substreams map module?"

The `substreams-dev` skill should activate and provide guidance.

## Updating Skills

```bash
cd ~/substreams-skills
git pull
```

Skills will auto-reload in Claude Code.

