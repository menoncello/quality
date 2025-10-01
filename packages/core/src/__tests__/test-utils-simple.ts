/**
 * Simple Test Utilities for Analysis Engine Tests
 *
 * Provides basic helper functions for creating test projects and plugins
 * with proper cleanup, avoiding complex template literals.
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { AnalysisPlugin } from '../plugins/analysis-plugin';

export interface TestProjectOptions {
  fileCount: number;
  fileTypes: string[];
  complexity: 'simple' | 'medium' | 'complex';
}

export interface TestProject {
  path: string;
  files: string[];
  modifyFile: (relativePath: string, content: string) => Promise<void>;
  addFile: (relativePath: string, content: string) => Promise<void>;
  removeFile: (relativePath: string) => Promise<void>;
}

export interface TestPluginOptions {
  name: string;
  version?: string;
  dependencies?: string[];
  timeout?: number;
  initialize?: (config: any) => Promise<void>;
  execute: (context: any) => Promise<any>;
  cleanup?: () => Promise<void>;
  validateConfig?: (config: any) => { valid: boolean; errors?: string[] };
  getDefaultConfig?: () => any;
  supportsIncremental?: () => boolean;
  supportsCache?: () => boolean;
  getMetrics?: () => any;
  updateConfig?: (newConfig: any) => Promise<void>;
}

export async function createTestProject(name: string, options: TestProjectOptions): Promise<TestProject> {
  const testDir = join(tmpdir(), `dev-quality-test-${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(join(testDir, 'src'), { recursive: true });

  const files: string[] = [];

  // Create package.json
  const packageJson = {
    name: `test-project-${name}`,
    version: '1.0.0',
    scripts: {
      test: 'bun test',
      lint: 'eslint src/**/*.ts',
      build: 'bun build src/index.ts --outdir dist'
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      typescript: '^5.0.0',
      eslint: '^8.0.0',
      prettier: '^3.0.0'
    }
  };

  await fs.writeFile(join(testDir, 'package.json'), JSON.stringify(packageJson, null, 2));
  files.push('package.json');

  // Create tsconfig.json
  const tsConfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'node',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
      outDir: './dist',
      rootDir: './src'
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist']
  };

  await fs.writeFile(join(testDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
  files.push('tsconfig.json');

  // Create source files
  for (let i = 0; i < options.fileCount; i++) {
    const fileType = options.fileTypes[i % options.fileTypes.length];
    const fileName = `file${i}.${fileType}`;
    const content = generateSimpleFileContent(fileName, options.complexity, i);

    await fs.writeFile(join(testDir, 'src', fileName), content);
    files.push(`src/${fileName}`);
  }

  return {
    path: testDir,
    files,
    async modifyFile(relativePath: string, content: string) {
      const fullPath = join(testDir, relativePath);
      await fs.writeFile(fullPath, content);
      if (!files.includes(relativePath)) {
        files.push(relativePath);
      }
    },
    async addFile(relativePath: string, content: string) {
      const fullPath = join(testDir, relativePath);
      const dir = join(testDir, relativePath, '..');
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content);
      files.push(relativePath);
    },
    async removeFile(relativePath: string) {
      const fullPath = join(testDir, relativePath);
      await fs.unlink(fullPath);
      const index = files.indexOf(relativePath);
      if (index > -1) {
        files.splice(index, 1);
      }
    }
  };
}

export async function cleanupTestProject(testProject: TestProject): Promise<void> {
  try {
    await fs.rm(testProject.path, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

export function createTestPlugin(options: TestPluginOptions): AnalysisPlugin {
  return {
    name: options.name,
    version: options.version || '1.0.0',
    dependencies: options.dependencies || [],
    timeout: options.timeout || 30000,

    async initialize(config: any = {}) {
      if (options.initialize) {
        await options.initialize(config);
      }
    },

    async execute(context: any) {
      return options.execute(context);
    },

    async cleanup() {
      if (options.cleanup) {
        await options.cleanup();
      }
    },

    validateConfig(config?: any) {
      if (options.validateConfig) {
        return options.validateConfig(config);
      }
      return { valid: true };
    },

    getDefaultConfig() {
      if (options.getDefaultConfig) {
        return options.getDefaultConfig();
      }
      return {};
    },

    supportsIncremental() {
      if (options.supportsIncremental) {
        return options.supportsIncremental();
      }
      return false;
    },

    supportsCache() {
      if (options.supportsCache) {
        return options.supportsCache();
      }
      return true;
    },

    getMetrics() {
      if (options.getMetrics) {
        return options.getMetrics();
      }
      return {
        executionTime: 0,
        memoryUsage: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    },

    updateConfig(newConfig?: any) {
      if (options.updateConfig) {
        return options.updateConfig(newConfig);
      }
      return Promise.resolve();
    }
  };
}

function generateSimpleFileContent(fileName: string, complexity: 'simple' | 'medium' | 'complex', index: number): string {
  const fileType = fileName.split('.').pop();
  const baseContent = `// File: ${fileName}
// Generated for testing purposes
// Index: ${index}
// Complexity: ${complexity}
`;

  switch (fileType) {
    case 'ts':
    case 'tsx':
      return generateTypeScriptContent(baseContent, complexity, index);
    case 'js':
    case 'jsx':
      return generateJavaScriptContent(baseContent, complexity, index);
    case 'json':
      return generateJsonContent(complexity, index);
    default:
      return baseContent + `Default content for ${fileName}`;
  }
}

function generateTypeScriptContent(baseContent: string, complexity: 'simple' | 'medium' | 'complex', index: number): string {
  let imports = '';
  let interfaces = '';
  let functions = '';

  if (complexity === 'complex') {
    imports = `import { useState, useEffect } from 'react';\n`;
  }

  if (complexity !== 'simple') {
    interfaces = `
interface TestData {
  id: string;
  name: string;
  value: number;
}
`;
  }

  if (complexity === 'medium' || complexity === 'complex') {
    functions = `
export function calculateValue(input: number): number {
  return input * 2;
}

export function validateData(data: TestData): boolean {
  return data.id && data.name && typeof data.value === 'number';
}
`;
  }

  const mainFunction = `
export function main${index}(): string {
  const data: TestData = {
    id: 'test-${index}',
    name: 'Test Item',
    value: ${Math.floor(Math.random() * 100)}
  };

  return \`Processed: \${data.name} with value \${data.value}\`;
}

export default main${index};
`;

  return baseContent + imports + interfaces + functions + mainFunction;
}

function generateJavaScriptContent(baseContent: string, complexity: 'simple' | 'medium' | 'complex', index: number): string {
  let functions = '';

  if (complexity !== 'simple') {
    functions = `
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + (item.value || 0), 0);
}

function validateItem(item) {
  return item.id && item.name && typeof item.value === 'number';
}
`;
  }

  const mainFunction = `
function main${index}() {
  const data = {
    id: 'test-${index}',
    name: 'Test Item',
    value: ${Math.floor(Math.random() * 100)},
    timestamp: new Date().toISOString()
  };

  const isValid = validateItem(data);
  if (!isValid) {
    console.error('Validation failed');
    return null;
  }

  return JSON.stringify(data, null, 2);
}

module.exports = { main${index}, calculateTotal };
`;

  return baseContent + functions + mainFunction;
}

function generateJsonContent(complexity: 'simple' | 'medium' | 'complex', index: number): string {
  const baseData = {
    id: `config-${index}`,
    name: `Configuration ${index}`,
    version: '1.0.0',
    created: new Date().toISOString()
  };

  if (complexity === 'simple') {
    return JSON.stringify(baseData, null, 2);
  }

  const mediumData = {
    ...baseData,
    settings: {
      timeout: 30000,
      retries: 3,
      debug: true
    },
    features: ['analysis', 'reporting', 'validation']
  };

  if (complexity === 'medium') {
    return JSON.stringify(mediumData, null, 2);
  }

  const complexData = {
    ...mediumData,
    plugins: [
      {
        name: 'eslint',
        config: {
          rules: {
            'no-unused-vars': 'error',
            'prefer-const': 'warning'
          }
        }
      }
    ],
    dependencies: {
      '@types/node': '^20.0.0',
      typescript: '^5.0.0'
    }
  };

  return JSON.stringify(complexData, null, 2);
}

export async function createMockTool(toolName: string, result: any): Promise<any> {
  return {
    name: toolName,
    version: '1.0.0',
    async execute() {
      return result;
    }
  };
}

export function createMockAnalysisResult(overrides: any = {}) {
  return {
    id: 'test-analysis-result',
    projectId: 'test-project',
    timestamp: new Date(),
    duration: 1000,
    overallScore: 85,
    status: 'success',
    toolResults: [
      {
        toolName: 'eslint',
        executionTime: 500,
        status: 'success',
        issues: [
          {
            id: 'eslint-1',
            type: 'warning',
            toolName: 'eslint',
            filePath: 'src/file.ts',
            lineNumber: 10,
            message: 'Unused variable',
            fixable: true,
            score: 3
          }
        ],
        metrics: {
          issuesCount: 1,
          warningsCount: 1,
          score: 97
        }
      }
    ],
    summary: {
      totalIssues: 1,
      totalErrors: 0,
      totalWarnings: 1,
      overallScore: 85
    },
    metrics: {
      executionTime: 1000,
      memoryUsage: 50000000,
      cacheHitRatio: 0.8
    },
    ...overrides
  };
}

export function createTestLogger() {
  return {
    error: (msg: string) => {},
    warn: (msg: string) => {},
    info: (msg: string) => {},
    debug: (msg: string) => {}
  };
}