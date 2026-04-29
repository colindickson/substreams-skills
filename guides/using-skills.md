# Using Substreams Skills

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/streamingfast/substreams-skills.git
   ```

2. Configure your AI tool (see setup guides below)

## Claude Code Setup

See [claude-code-setup.md](./claude-code-setup.md) for detailed instructions.

## Example Workflows

### Creating a New Project

**Ask Claude:**

> "Help me create a new Substreams project for tracking USDC transfers on Ethereum"

**Expected behavior:**

* `substreams-dev` skill activates
* Guides through project structure
* Provides manifest template
* Shows Rust code examples

### Building a SQL Sink

**Ask Claude:**

> "How do I create a PostgreSQL sink for my Substreams transfers module?"

**Expected behavior:**

* `substreams-sql` skill activates
* Helps design database schema
* Shows sink implementation code
* Provides deployment instructions

### Testing Modules

**Ask Claude:**

> "How should I test my map_events module?"

**Expected behavior:**

* `substreams-testing` skill activates
* Suggests unit test structure
* Provides test examples
* Recommends CI/CD setup

## Updating Skills

```bash
cd ~/substreams-skills
git pull
```

Skills will auto-reload in your AI tool.

