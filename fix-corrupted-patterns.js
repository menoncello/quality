#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const rootDir = './packages/core/src';

const fixCorruptedPatterns = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix corrupted variable name patterns like "criticalDomain(s as any)" -> "criticalDomains"
  content = content.replace(/(\w+)\(s as any\)/g, (match, varName) => {
    modified = true;
    return varName + 's';
  });

  // Fix corrupted property access like "context.(config as any)" -> "context.config as any"
  content = content.replace(/\.(\([^)]+\) as any\)/g, (match, propAccess) => {
    modified = true;
    const prop = propAccess.replace(/[()]/g, '');
    return `.${prop}`;
  });

  // Fix corrupted array access patterns
  content = content.replace(/(\w+)\(\s*as any\)/g, '$1');
  content = content.replace(/(\w+)\s+as any\)\./g, '$1.');

  // Fix corrupted parameter declarations
  content = content.replace(/(\w+):\s*(\w+)\s+as any\)/g, '$1: $2)');

  // Fix broken property assignment patterns
  content = content.replace(/:\s*([^,\n]+)\s+as any,/g, ': $1,');

  // Fix broken object property patterns
  content = content.replace(/(\w+):\s*([^,\n}]+)\s+as any(\s*[,\}])/g, '$1: $2$3');

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed corrupted patterns in ${filePath}`);
  }
};

const walkDir = (dir, callback) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts')) {
      callback(filePath);
    }
  }
};

console.log('Fixing corrupted patterns from previous batch fixes...');

walkDir(rootDir, fixCorruptedPatterns);

console.log('Completed fixing corrupted patterns.');