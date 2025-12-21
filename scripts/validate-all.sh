#!/bin/bash
set -e

echo "Validating all Substreams Skills..."

# Check if skills-ref is installed
if ! command -v skills-ref &> /dev/null; then
    echo "Error: skills-ref not found. Install with: npm install -g @anthropic/skills-ref"
    exit 1
fi

# Count skills
skill_count=0

# Validate each skill
for skill_dir in skills/*/; do
    if [ -d "$skill_dir" ] && [ -f "${skill_dir}SKILL.md" ]; then
        skill_name=$(basename "$skill_dir")
        echo "Validating $skill_name..."
        skills-ref validate "$skill_dir"
        echo "✓ $skill_name valid"
        ((skill_count++))
    fi
done

if [ $skill_count -eq 0 ]; then
    echo "⚠ No skills found to validate"
    exit 0
fi

echo ""
echo "All $skill_count skill(s) validated successfully!"

