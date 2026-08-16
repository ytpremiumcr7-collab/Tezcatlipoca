// create-generator.js
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const IGNORE = new Set([
  'node_modules', '.git', 'dist', 'build', '.venv', '__pycache__',
  'package-lock.json', '.oxlintrc.json', 'create-generator.cjs',
]);

function walk(dir, base = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue;
    if (IGNORE.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, relativePath));
    } else {
      results.push({
        path: relativePath.replace(/\\/g, '/'),
        content: fs.readFileSync(fullPath, 'utf8'),
      });
    }
  }
  return results;
}

const files = walk(ROOT_DIR);

const output = `// generate-project.js
const fs = require('fs');
const path = require('path');

const files = ${JSON.stringify(files, null, 2)};

const root = process.argv[2] || '.';

for (const file of files) {
  const fullPath = path.join(root, file.path);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, file.content, 'utf8');
  console.log('Creado:', file.path);
}

console.log('Proyecto generado exitosamente en', root);
`;

fs.writeFileSync('generate-project.cjs', output, 'utf8');
console.log('Generador creado: generate-project.cjs');
