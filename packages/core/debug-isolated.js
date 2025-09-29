import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('=== Testing Turbo Detection Issue ===');

// Test 1: Create a clean test directory
const testDir = join(process.cwd(), 'debug-isolated-test');
console.log('Test directory:', testDir);

// Clean up if exists
if (existsSync(testDir)) {
  console.log('Cleaning up existing directory...');
  require('fs').rmSync(testDir, { recursive: true, force: true });
}

mkdirSync(testDir, { recursive: true });

// Create only turbo.json
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

// Check files
console.log('\n=== Files in test directory ===');
const files = ['turbo.json', 'nx.json', 'package.json'];
files.forEach(file => {
  const fullPath = join(testDir, file);
  const exists = existsSync(fullPath);
  console.log(`  ${file}: ${exists} (${fullPath})`);
});

// Test the actual detection logic
console.log('\n=== Testing Detection Logic ===');

// Test 1: Check individual files
console.log('Individual file checks:');
const turboExists = existsSync(join(testDir, 'turbo.json'));
const nxExists = existsSync(join(testDir, 'nx.json'));
console.log(`  turbo.json exists: ${turboExists}`);
console.log(`  nx.json exists: ${nxExists}`);

// Test 2: Check the pattern matching logic (like in the actual code)
console.log('\nPattern matching logic:');
const patterns = {
  nx: ['nx.json'],
  turbo: ['turbo.json']
};

for (const [type, patternFiles] of Object.entries(patterns)) {
  for (const pattern of patternFiles) {
    const fullPath = join(testDir, pattern);
    const exists = existsSync(fullPath);
    console.log(`  ${type} - ${pattern}: ${exists}`);
    if (exists) {
      console.log(`    Would return: ${type}`);
    }
  }
}

// Test 3: Check if there's any nx.json in parent directories
console.log('\n=== Checking for nx.json in parent directories ===');
let currentDir = testDir;
while (currentDir !== '/') {
  const nxPath = join(currentDir, 'nx.json');
  if (existsSync(nxPath)) {
    console.log(`Found nx.json in: ${nxPath}`);
  }
  currentDir = join(currentDir, '..');
}

// Clean up
require('fs').rmSync(testDir, { recursive: true, force: true });
console.log('\nCleaned up test directory');