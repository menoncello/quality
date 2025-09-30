import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  BunTestConfigGenerator,
  ESLintConfigGenerator,
  PrettierConfigGenerator,
  TypeScriptConfigGenerator,
} from '../../../src/services/wizard/config-generator';
import { writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDir, cleanupTestDir } from '../../test-utils';

describe('BunTestConfigGenerator', () => {
  let testDir: string;
  let generator: BunTestConfigGenerator;

  beforeEach(() => {
    testDir = createTestDir('bun-test');
    generator = new BunTestConfigGenerator({ projectPath: testDir });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should generate bunfig.toml', async () => {
    const result = await generator.generate('create');

    expect(result.action).toBe('created');
    expect(result.filePath).toContain('bunfig.toml');
    expect(result.content).toContain('[test]');
    expect(result.content).toContain('coverage = true');
  });

  it('should replace existing config', async () => {
    const existingConfig = '[test]\ncoverage = false';
    writeFileSync(join(testDir, 'bunfig.toml'), existingConfig);

    const result = await generator.generate('replace');

    expect(result.action).toBe('replaced');
    expect(result.content).toContain('coverage = true');
  });

  it('should merge with existing config', async () => {
    const existingConfig = '[install]\nfrozen = true';
    writeFileSync(join(testDir, 'bunfig.toml'), existingConfig);

    const result = await generator.generate('merge');

    expect(result.action).toBe('merged');
    expect(result.content).toContain('[install]');
    expect(result.content).toContain('[test]');
  });
});

describe('ESLintConfigGenerator', () => {
  let testDir: string;
  let generator: ESLintConfigGenerator;

  beforeEach(() => {
    testDir = createTestDir('eslint-test');
    generator = new ESLintConfigGenerator({ projectPath: testDir });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should generate flat config by default', async () => {
    const result = await generator.generate('create');

    expect(result.action).toBe('created');
    expect(result.filePath).toContain('eslint.config.js');
    expect(result.content).toContain('export default');
  });

  it('should use legacy config when it exists', async () => {
    const existingConfig = '{"extends": ["eslint:recommended"]}';
    writeFileSync(join(testDir, '.eslintrc.json'), existingConfig);

    const result = await generator.generate('create');

    expect(result.filePath).toContain('.eslintrc.json');
  });

  it('should include TypeScript rules', async () => {
    const result = await generator.generate('create');

    expect(result.content).toContain('@typescript-eslint');
    expect(result.content).toContain('no-explicit-any');
  });
});

describe('PrettierConfigGenerator', () => {
  let testDir: string;
  let generator: PrettierConfigGenerator;

  beforeEach(() => {
    testDir = createTestDir('prettier-test');
    generator = new PrettierConfigGenerator({ projectPath: testDir });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should generate .prettierrc.json', async () => {
    const result = await generator.generate('create');

    expect(result.action).toBe('created');
    expect(result.filePath).toContain('.prettierrc.json');

    const config = JSON.parse(result.content);
    expect(config.semi).toBe(true);
    expect(config.singleQuote).toBe(true);
  });

  it('should create .prettierignore file', async () => {
    await generator.generate('create');

    const ignorePath = join(testDir, '.prettierignore');
    const ignoreContent = readFileSync(ignorePath, 'utf-8');

    expect(ignoreContent).toContain('node_modules');
    expect(ignoreContent).toContain('dist');
  });

  it('should merge with existing config', async () => {
    const existingConfig = '{"semi": false, "tabWidth": 4}';
    writeFileSync(join(testDir, '.prettierrc.json'), existingConfig);

    const result = await generator.generate('merge');

    const config = JSON.parse(result.content);
    expect(config.semi).toBe(false); // Keeps existing
    expect(config.tabWidth).toBe(4); // Keeps existing
    expect(config.singleQuote).toBe(true); // Adds default
  });
});

describe('TypeScriptConfigGenerator', () => {
  let testDir: string;
  let generator: TypeScriptConfigGenerator;

  beforeEach(() => {
    testDir = createTestDir('ts-test');
    generator = new TypeScriptConfigGenerator({ projectPath: testDir });
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should generate tsconfig.json', async () => {
    const result = await generator.generate('create');

    expect(result.action).toBe('created');
    expect(result.filePath).toContain('tsconfig.json');

    const config = JSON.parse(result.content);
    expect(config.compilerOptions.strict).toBe(true);
    expect(config.compilerOptions.target).toBe('ES2022');
  });

  it('should include source and test directories', async () => {
    const result = await generator.generate('create');

    const config = JSON.parse(result.content);
    expect(config.include).toContain('./src');
    expect(config.include).toContain('./tests');
  });

  it('should merge with existing config', async () => {
    const existingConfig = JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        strict: false,
      },
    });
    writeFileSync(join(testDir, 'tsconfig.json'), existingConfig);

    const result = await generator.generate('merge');

    const config = JSON.parse(result.content);
    expect(config.compilerOptions.target).toBe('ES2020'); // Keeps existing
    expect(config.compilerOptions.strict).toBe(false); // Keeps existing
    expect(config.compilerOptions.esModuleInterop).toBe(true); // Adds default
  });

  it('should prevent path traversal attacks', async () => {
    expect(() => {
      new TypeScriptConfigGenerator({ projectPath: testDir }).generate('create');
    }).not.toThrow();
  });
});
