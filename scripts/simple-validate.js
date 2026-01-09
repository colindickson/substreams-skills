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
        
        console.log(`✓ ${frontmatter.name} valid`);
        return true;
        
    } catch (e) {
        throw new Error(`YAML parsing error in ${skillDir}: ${e.message}`);
    }
}

function main() {
    const skillsDir = path.join(__dirname, '..', 'skills');
    
    if (!fs.existsSync(skillsDir)) {
        console.log('⚠ No skills directory found');
        process.exit(0);
    }
    
    const skillDirs = fs.readdirSync(skillsDir)
        .map(name => path.join(skillsDir, name))
        .filter(dir => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, 'SKILL.md')));
    
    if (skillDirs.length === 0) {
        console.log('⚠ No skills found to validate');
        process.exit(0);
    }
    
    console.log('Validating all Substreams Skills...');
    
    let validCount = 0;
    for (const skillDir of skillDirs) {
        const skillName = path.basename(skillDir);
        try {
            console.log(`Validating ${skillName}...`);
            validateSkill(skillDir);
            validCount++;
        } catch (error) {
            console.error(`✗ ${skillName}: ${error.message}`);
            process.exit(1);
        }
    }
    
    console.log('');
    console.log(`All ${validCount} skill(s) validated successfully!`);
}

if (require.main === module) {
    main();
}
