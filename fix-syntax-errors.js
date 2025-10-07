#!/usr/bin/env node

import fs from 'fs';
import _path from 'path';

const filesToFix = [
  './packages/core/src/plugins/builtin/bun-test-adapter.ts',
  './packages/core/src/prioritization/issue-classifier.ts',
  './packages/core/src/prioritization/rule-engine.ts',
  './packages/core/src/services/coverage-analyzer.ts'
];

filesToFix.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix 1: corrupted array access like "criticalDomain(s as any)" -> "criticalDomains"
  const corruptedArrayPattern = /(\w+)\(s as any\)/g;
  if (corruptedArrayPattern.test(content)) {
    content = content.replace(corruptedArrayPattern, '$1s');
    modified = true;
    console.log(`Fixed corrupted array access in ${filePath}`);
  }

  // Fix 2: corrupted property access like "context.(config as any)" -> "context.config as any"
  const corruptedPropertyPattern = /\.context\.\(([^)]+) as any\)/g;
  if (corruptedPropertyPattern.test(content)) {
    content = content.replace(corruptedPropertyPattern, '.context.$1');
    modified = true;
    console.log(`Fixed corrupted property access in ${filePath}`);
  }

  // Fix 3: Fix broken object property declarations
  const brokenPropertyPattern = /(\w+):\s*([^,}\n]+)\s+as any,?\s*\n/g;
  if (brokenPropertyPattern.test(content)) {
    content = content.replace(brokenPropertyPattern, '$1: $2,\n');
    modified = true;
    console.log(`Fixed broken property declarations in ${filePath}`);
  }

  // Fix 4: Fix specific patterns seen in errors
  content = content.replace(/context\.\(config as any\)/g, 'context.config');
  content = content.replace(/criticalDomain\(s as any\)/g, 'criticalDomains');
  content = content.replace(/userFacingPath\(s as any\)/g, 'userFacingPaths');
  content = content.replace(/userFacingType\(s as any\)/g, 'userFacingTypes');
  content = content.replace(/criticalDomain\(s as any\)/g, 'criticalDomains');
  content = content.replace(/debtPath\(s as any\)/g, 'debtPaths');
  content = content.replace(/validSeveritie\(s as any\)/g, 'validSeverities');
  content = content.replace(/validCategorie\(s as any\)/g, 'validCategories');
  content = content.replace(/error\(s as any\)/g, 'errors');
  content = content.replace(/metric\(s as any\)/g, 'metrics');
  content = content.replace(/categoryCount\(s as any\)/g, 'categoryCounts');
  content = content.replace(/categorie\(s as any\)/g, 'categories');
  content = content.replace(/securityIssue\(s as any\)/g, 'securityIssues');
  content = content.replace(/performanceIssue\(s as any\)/g, 'performanceIssues');
  content = content.replace(/criticalIssue\(s as any\)/g, 'criticalIssues');
  content = content.replace(/teamMember\(s as any\)/g, 'teamMembers');
  content = content.replace(/alternative\(s as any\)/g, 'alternatives');
  content = content.replace(/reason\(s as any\)/g, 'reasons');

  if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
});

console.log('Completed fixing syntax errors.');