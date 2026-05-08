const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src');

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else if (ent.name.endsWith('.js')) {
      execSync(`node --check ${JSON.stringify(full)}`, { stdio: 'inherit' });
    }
  }
}

walk(srcDir);
