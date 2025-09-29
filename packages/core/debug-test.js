import { StructureAnalyzer } from './src/detection/structure-analyzer.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const analyzer = new StructureAnalyzer();

// Test npm workspace detection
const testDir = join(process.cwd(), 'debug-test');
if (!existsSync(testDir)) {
  mkdirSync(testDir, { recursive: true });
}

writeFileSync(
  join(testDir, 'package.json'),
  JSON.stringify({
    name: 'npm-workspace',
    version: '1.0.0',
    workspaces: ['packages/*']
  })
);

console.log('Test directory:', testDir);
console.log('Package.json exists:', existsSync(join(testDir, 'package.json')));

const pkg = JSON.parse(require('fs').readFileSync(join(testDir, 'package.json'), 'utf-8'));
console.log('Package.json workspaces:', pkg.workspaces);

const isMonorepo = analyzer.detectMonorepo(testDir);
console.log('Is monorepo:', isMonorepo);

const type = analyzer.detectMonorepoType(testDir);
console.log('Monorepo type:', type);