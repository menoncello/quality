#!/usr/bin/env node

import fs from 'fs';
import _path from 'path';

const fixCoverageAnalyzer = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix 1: Remove "as any" from array property declarations
  content = content.replace(/(\w+) as any,/g, '$1,');

  // Fix 2: Fix corrupted function declarations
  content = content.replace(/generateTestSuggestionsFor as any(\w+)/g, 'this.generateTestSuggestionsFor$1');

  // Fix 3: Fix corrupted property access
  content = content.replace(/\(l as any\)/g, 'l');
  content = content.replace(/\(s as any\)/g, 's');

  // Fix 4: Fix corrupted method calls
  content = content.replace(/this\.generateTestSuggestionsFor as any(\w+)/g, 'this.generateTestSuggestionsFor$1');

  // Fix 5: Fix corrupted object property declarations
  content = content.replace(/\w+:\s*\[.*?\]\s*\.\w+\([^)]*\)\s*\.\s*filter\(Boolean\).*?\.\s*filter\(Boolean\)/g, (match) => {
    // Fix duplicate filter calls
    return match.replace(/\.filter\(Boolean\).*?\.\s*filter\(Boolean\)/, '.filter(Boolean)');
  });

  fs.writeFileSync(filePath, content);
  console.log(`Fixed coverage-analyzer.ts`);
};

const fixIssueClassifier = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix corrupted domain access
  content = content.replace(/context\.businessDomain as any\.toLowerCase\(\)/g, 'context.businessDomain.toLowerCase()');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed issue-classifier.ts`);
};

const fixRuleEngine = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix corrupted property access
  content = content.replace(/\.\w+\(\s*as any\)/g, (match) => {
    const prop = match.replace(/[.()]/g, '').replace('as any', '');
    return '.' + prop;
  });

  fs.writeFileSync(filePath, content);
  console.log(`Fixed rule-engine.ts`);
};

const fixBunTestAdapter = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix corrupted property access
  content = content.replace(/context\.\(config as any\)/g, 'context.config');
  content = content.replace(/bun\.\(config as any\)\./g, 'bun.config.');
  content = content.replace(/vitest\.\(config as any\)\./g, 'vitest.config.');
  content = content.replace(/jest\.\(config as any\)\./g, 'jest.config.');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed bun-test-adapter.ts`);
};

// Apply fixes
const files = [
  './packages/core/src/services/coverage-analyzer.ts',
  './packages/core/src/prioritization/issue-classifier.ts',
  './packages/core/src/prioritization/rule-engine.ts',
  './packages/core/src/plugins/builtin/bun-test-adapter.ts'
];

console.log('Applying comprehensive fixes...');

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    if (filePath.includes('coverage-analyzer')) {
      fixCoverageAnalyzer(filePath);
    } else if (filePath.includes('issue-classifier')) {
      fixIssueClassifier(filePath);
    } else if (filePath.includes('rule-engine')) {
      fixRuleEngine(filePath);
    } else if (filePath.includes('bun-test-adapter')) {
      fixBunTestAdapter(filePath);
    }
  }
});

console.log('Completed comprehensive fixes.');