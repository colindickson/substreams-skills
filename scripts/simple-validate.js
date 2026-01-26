#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function validateSkill(skillDir) {
    const skillPath = path.join(skillDir, 'SKILL.md');

    if (!fs.existsSync(skillPath)) {
        throw new Error(`SKILL.md not found in ${skillDir}`);
    }

    const content = fs.readFileSync(skillPath, 'utf8');

    // Check for YAML frontmatter
    if (!content.startsWith('---\n')) {
        throw new Error(`SKILL.md must start with YAML frontmatter in ${skillDir}`);
    }

    const frontmatterEnd = content.indexOf('\n---\n', 4);
    if (frontmatterEnd === -1) {
        throw new Error(`Invalid YAML frontmatter format in ${skillDir}`);
    }

    const frontmatterContent = content.substring(4, frontmatterEnd);

    try {
        const frontmatter = yaml.load(frontmatterContent);

        // Validate required fields
        if (!frontmatter.name) {
            throw new Error(`Missing required field 'name' in ${skillDir}`);
        }

        if (!frontmatter.description) {
            throw new Error(`Missing required field 'description' in ${skillDir}`);
        }

        // Validate name format
        if (!/^[a-z0-9-]{1,64}$/.test(frontmatter.name)) {
            throw new Error(`Invalid name format in ${skillDir}. Must be 1-64 chars, lowercase, alphanumeric + hyphens`);
        }

        // Validate description length
        if (frontmatter.description.length > 1024) {
            throw new Error(`Description too long in ${skillDir}. Must be <= 1024 characters`);
        }

        return frontmatter.name;

    } catch (e) {
        if (e.message.includes('Missing required') || e.message.includes('Invalid')) {
            throw e;
        }
        throw new Error(`YAML parsing error in ${skillDir}: ${e.message}`);
    }
}

function validatePluginJson(rootDir) {
    const pluginPath = path.join(rootDir, '.claude-plugin', 'plugin.json');

    if (!fs.existsSync(pluginPath)) {
        throw new Error(`plugin.json not found at ${pluginPath}`);
    }

    let plugin;
    try {
        const content = fs.readFileSync(pluginPath, 'utf8');
        plugin = JSON.parse(content);
    } catch (e) {
        throw new Error(`Invalid JSON in plugin.json: ${e.message}`);
    }

    // Validate required fields
    if (!plugin.name) {
        throw new Error(`plugin.json: Missing required field 'name'`);
    }

    if (!plugin.description) {
        throw new Error(`plugin.json: Missing required field 'description'`);
    }

    if (!plugin.version) {
        throw new Error(`plugin.json: Missing required field 'version'`);
    }

    // Validate name format (kebab-case)
    if (!/^[a-z0-9-]{1,64}$/.test(plugin.name)) {
        throw new Error(`plugin.json: Invalid name format. Must be 1-64 chars, lowercase, alphanumeric + hyphens`);
    }

    // Validate version format (semver-like)
    if (!/^\d+\.\d+\.\d+/.test(plugin.version)) {
        throw new Error(`plugin.json: Invalid version format. Expected semver (e.g., 1.0.0)`);
    }

    // Validate optional fields types
    if (plugin.repository !== undefined && typeof plugin.repository !== 'string') {
        throw new Error(`plugin.json: 'repository' must be a string URL, not an object`);
    }

    if (plugin.homepage !== undefined && typeof plugin.homepage !== 'string') {
        throw new Error(`plugin.json: 'homepage' must be a string URL`);
    }

    if (plugin.license !== undefined && typeof plugin.license !== 'string') {
        throw new Error(`plugin.json: 'license' must be a string (SPDX identifier)`);
    }

    return plugin;
}

function validateMarketplaceJson(rootDir) {
    const marketplacePath = path.join(rootDir, '.claude-plugin', 'marketplace.json');

    if (!fs.existsSync(marketplacePath)) {
        return null; // marketplace.json is optional
    }

    let marketplace;
    try {
        const content = fs.readFileSync(marketplacePath, 'utf8');
        marketplace = JSON.parse(content);
    } catch (e) {
        throw new Error(`Invalid JSON in marketplace.json: ${e.message}`);
    }

    // Validate required fields
    if (!marketplace.name) {
        throw new Error(`marketplace.json: Missing required field 'name'`);
    }

    // Validate name format (kebab-case)
    if (!/^[a-z0-9-]{1,64}$/.test(marketplace.name)) {
        throw new Error(`marketplace.json: Invalid name format. Must be 1-64 chars, lowercase, alphanumeric + hyphens`);
    }

    // Validate owner (required object)
    if (!marketplace.owner) {
        throw new Error(`marketplace.json: Missing required field 'owner'`);
    }

    if (typeof marketplace.owner !== 'object') {
        throw new Error(`marketplace.json: 'owner' must be an object`);
    }

    if (!marketplace.owner.name) {
        throw new Error(`marketplace.json: Missing required field 'owner.name'`);
    }

    // Validate plugins array
    if (!marketplace.plugins) {
        throw new Error(`marketplace.json: Missing required field 'plugins'`);
    }

    if (!Array.isArray(marketplace.plugins)) {
        throw new Error(`marketplace.json: 'plugins' must be an array`);
    }

    // Validate each plugin entry
    for (let i = 0; i < marketplace.plugins.length; i++) {
        const plugin = marketplace.plugins[i];

        if (!plugin.name) {
            throw new Error(`marketplace.json: plugins[${i}] missing required field 'name'`);
        }

        if (!plugin.source) {
            throw new Error(`marketplace.json: plugins[${i}] missing required field 'source'`);
        }

        // Validate source format
        if (typeof plugin.source === 'string') {
            // Relative path must start with ./
            if (!plugin.source.startsWith('./') && !plugin.source.startsWith('/')) {
                throw new Error(`marketplace.json: plugins[${i}].source must start with './' for relative paths`);
            }
            // No path traversal
            if (plugin.source.includes('..')) {
                throw new Error(`marketplace.json: plugins[${i}].source cannot contain '..' (path traversal)`);
            }
        } else if (typeof plugin.source === 'object') {
            // Object source must have 'source' type field
            if (!plugin.source.source) {
                throw new Error(`marketplace.json: plugins[${i}].source object missing 'source' type field`);
            }
            const validTypes = ['github', 'url', 'npm'];
            if (!validTypes.includes(plugin.source.source)) {
                throw new Error(`marketplace.json: plugins[${i}].source.source must be one of: ${validTypes.join(', ')}`);
            }
        } else {
            throw new Error(`marketplace.json: plugins[${i}].source must be a string path or source object`);
        }
    }

    return marketplace;
}

function main() {
    const rootDir = path.join(__dirname, '..');
    const skillsDir = path.join(rootDir, 'skills');

    console.log('Validating Claude Code Plugin...\n');

    let hasErrors = false;

    // Validate plugin.json
    console.log('Checking plugin.json...');
    try {
        const plugin = validatePluginJson(rootDir);
        console.log(`✓ plugin.json valid (name: ${plugin.name}, version: ${plugin.version})\n`);
    } catch (error) {
        console.error(`✗ ${error.message}\n`);
        hasErrors = true;
    }

    // Validate marketplace.json (optional)
    console.log('Checking marketplace.json...');
    try {
        const marketplace = validateMarketplaceJson(rootDir);
        if (marketplace) {
            console.log(`✓ marketplace.json valid (name: ${marketplace.name}, ${marketplace.plugins.length} plugin(s))\n`);
        } else {
            console.log(`- marketplace.json not found (optional)\n`);
        }
    } catch (error) {
        console.error(`✗ ${error.message}\n`);
        hasErrors = true;
    }

    // Validate skills
    if (!fs.existsSync(skillsDir)) {
        console.log('⚠ No skills directory found');
    } else {
        const skillDirs = fs.readdirSync(skillsDir)
            .map(name => path.join(skillsDir, name))
            .filter(dir => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'SKILL.md')));

        if (skillDirs.length === 0) {
            console.log('⚠ No skills found to validate');
        } else {
            console.log('Validating skills...');

            for (const skillDir of skillDirs) {
                const skillName = path.basename(skillDir);
                try {
                    const name = validateSkill(skillDir);
                    console.log(`✓ ${name} valid`);
                } catch (error) {
                    console.error(`✗ ${skillName}: ${error.message}`);
                    hasErrors = true;
                }
            }
        }
    }

    console.log('');

    if (hasErrors) {
        console.log('Validation failed with errors.');
        process.exit(1);
    } else {
        console.log('All validations passed!');
    }
}

if (require.main === module) {
    main();
}
