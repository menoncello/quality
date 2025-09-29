import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Test Turbo workspace detection
const testDir = join(process.cwd(), 'debug-turbo-test');
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
}

// Create only turbo.json, no nx.json
writeFileSync(
  join(testDir, 'package.json'),
  JSON.stringify({
    name: 'turbo-workspace',
    version: '1.0.0'
  })
);

writeFileSync(
  join(testDir, 'turbo.json'),
  JSON.stringify({
    pipeline: {}
  })
);

console.log('Test directory:', testDir);
console.log('Files in directory:');
const files = ['turbo.json', 'nx.json', 'package.json'];
files.forEach(file => {
  const exists = existsSync(join(testDir, file));
  console.log(`  ${file}: ${exists}`);
});

// Now test the actual detection logic
const packageJsonPath = join(testDir, 'package.json');
if (existsSync(packageJsonPath)) {
  const pkg = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf-8'));
  console.log('Package.json workspaces:', pkg.workspaces);
}

// Test monorepo files detection
const monorepoFiles = [
  'pnpm-workspace.yaml',
  'nx.json',
  'turbo.json',
  'lerna.json',
  'rush.json',
];

console.log('Monorepo files found:');
monorepoFiles.forEach(file => {
  const exists = existsSync(join(testDir, file));
  console.log(`  ${file}: ${exists}`);
});

// Clean up
require('fs').rmSync(testDir, { recursive: true, force: true });
console.log('Cleaned up test directory');