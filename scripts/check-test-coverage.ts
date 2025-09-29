#!/usr/bin/env bun

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, parse } from 'node:path';

interface FileStats {
  sourceFiles: string[];
  testFiles: Set<string>;
  untestedFiles: Array<{ path: string; lines: number }>;
}

function countLines(filePath: string): number {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, test directories, and scripts
      if (!file.match(/^(node_modules|dist|tests|test|__tests__|scripts|\..*)/)) {
        getAllFiles(filePath, fileList);
      }
    } else if (
      file.match(/\.(ts|tsx)$/) &&
      !file.match(/\.test\.(ts|tsx)$/) &&
      !file.match(/\.spec\.(ts|tsx)$/)
    ) {
      // Skip type definition files and barrel exports (index.ts that only export)
      if (!file.match(/\.d\.ts$/) && file !== 'types.ts') {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

function getTestFiles(dir: string, testFiles: string[] = []): string[] {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        if (!file.match(/^(node_modules|dist|\..*)/)) {
          getTestFiles(filePath, testFiles);
        }
      } else if (file.match(/\.(test|spec)\.(ts|tsx)$/)) {
        testFiles.push(filePath);
      }
    }
  } catch (error) {
    // Directory might not exist
  }

  return testFiles;
}

function getSourceFileNameFromTest(testPath: string): string {
  const parsed = parse(testPath);
  // Remove .test or .spec from filename
  const baseName = parsed.name.replace(/\.(test|spec)$/, '');
  return baseName;
}

function analyzeTestCoverage(rootDir: string): FileStats {
  const sourceFiles = getAllFiles(rootDir);
  const testFiles = getTestFiles(rootDir);

  // Create a set of base names from test files
  const testedFileNames = new Set<string>();

  for (const testFile of testFiles) {
    const baseName = getSourceFileNameFromTest(testFile);
    testedFileNames.add(baseName);
  }

  // Find source files without corresponding tests
  const untestedFiles: Array<{ path: string; lines: number }> = [];

  for (const sourceFile of sourceFiles) {
    const parsed = parse(sourceFile);
    const baseName = parsed.name;

    // Skip if this file has a corresponding test
    if (!testedFileNames.has(baseName)) {
      const lines = countLines(sourceFile);
      untestedFiles.push({ path: sourceFile, lines });
    }
  }

  // Sort by lines of code (descending)
  untestedFiles.sort((a, b) => b.lines - a.lines);

  return {
    sourceFiles,
    testFiles: testedFileNames,
    untestedFiles,
  };
}

// Main execution
const rootDir = process.cwd();
const stats = analyzeTestCoverage(rootDir);

console.log('📊 Test Coverage Analysis\n');
console.log(`Total source files: ${stats.sourceFiles.length}`);
console.log(`Files with tests: ${stats.testFiles.size}`);
console.log(`Files without tests: ${stats.untestedFiles.length}\n`);

if (stats.untestedFiles.length > 0) {
  console.log('⚠️  Files without test coverage (sorted by lines of code):\n');

  for (const file of stats.untestedFiles) {
    const relativePath = relative(rootDir, file.path);
    const linesFormatted = file.lines.toString().padStart(4, ' ');
    console.log(`   ${linesFormatted} lines - ${relativePath}`);
  }

  console.log();
  process.exit(1);
} else {
  console.log('✅ All source files have corresponding tests!');
  process.exit(0);
}
