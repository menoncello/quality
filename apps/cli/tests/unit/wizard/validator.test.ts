import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import {
  BunTestValidator,
  ESLintValidator,
  PrettierValidator,
  TypeScriptValidator,
} from '../../../src/services/wizard/validator';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDir, cleanupTestDir } from '../../test-utils';

describe('BunTestValidator', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('bun-validator-test');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should fail validation when config file does not exist', async () => {
    const validator = new BunTestValidator({
      projectPath: testDir,
      configPath: 'bunfig.toml',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('not found');
  });

  it('should warn when config missing [test] section', async () => {
    const configPath = join(testDir, 'bunfig.toml');
    writeFileSync(configPath, '[install]\nfrozen = true');

    const validator = new BunTestValidator({
      projectPath: testDir,
      configPath: 'bunfig.toml',
    });

    const result = await validator.validate();

    expect(result.warnings).toContain('Configuration missing [test] section');
  });

  it('should validate config with [test] section', async () => {
    const configPath = join(testDir, 'bunfig.toml');
    writeFileSync(configPath, '[test]\ncoverage = true');

    const validator = new BunTestValidator({
      projectPath: testDir,
      configPath: 'bunfig.toml',
    });

    const result = await validator.validate();

    expect(result.warnings).not.toContain('Configuration missing [test] section');
  });
});

describe('ESLintValidator', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('eslint-validator-test');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should fail validation when config file does not exist', async () => {
    const validator = new ESLintValidator({
      projectPath: testDir,
      configPath: '.eslintrc.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('not found');
  });

  it('should fail validation with invalid JSON', async () => {
    const configPath = join(testDir, '.eslintrc.json');
    writeFileSync(configPath, '{invalid json}');

    const validator = new ESLintValidator({
      projectPath: testDir,
      configPath: '.eslintrc.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid JSON');
  });

  it('should validate valid JSON config', async () => {
    const configPath = join(testDir, '.eslintrc.json');
    writeFileSync(configPath, '{"extends": ["eslint:recommended"]}');

    const validator = new ESLintValidator({
      projectPath: testDir,
      configPath: '.eslintrc.json',
    });

    const result = await validator.validate();

    expect(result.errors).not.toContain('Invalid JSON');
  });
});

describe('PrettierValidator', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('prettier-validator-test');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should fail validation when config file does not exist', async () => {
    const validator = new PrettierValidator({
      projectPath: testDir,
      configPath: '.prettierrc.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('not found');
  });

  it('should fail validation with invalid JSON', async () => {
    const configPath = join(testDir, '.prettierrc.json');
    writeFileSync(configPath, '{invalid}');

    const validator = new PrettierValidator({
      projectPath: testDir,
      configPath: '.prettierrc.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid JSON');
  });

  it('should validate valid JSON config', async () => {
    const configPath = join(testDir, '.prettierrc.json');
    writeFileSync(configPath, '{"semi": true, "singleQuote": true}');

    const validator = new PrettierValidator({
      projectPath: testDir,
      configPath: '.prettierrc.json',
    });

    const result = await validator.validate();

    expect(result.errors).not.toContain('Invalid JSON');
  });
});

describe('TypeScriptValidator', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('ts-validator-test');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should fail validation when config file does not exist', async () => {
    const validator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('not found');
  });

  it('should fail validation with invalid JSON', async () => {
    const configPath = join(testDir, 'tsconfig.json');
    writeFileSync(configPath, '{invalid}');

    const validator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });

    const result = await validator.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Invalid JSON');
  });

  it('should warn when missing compilerOptions', async () => {
    const configPath = join(testDir, 'tsconfig.json');
    writeFileSync(configPath, '{"include": ["src"]}');

    const validator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });

    const result = await validator.validate();

    expect(result.warnings).toContain('Missing compilerOptions in tsconfig.json');
  });

  it('should validate config with compilerOptions', async () => {
    const configPath = join(testDir, 'tsconfig.json');
    writeFileSync(
      configPath,
      JSON.stringify({
        compilerOptions: { target: 'ES2022', strict: true },
      })
    );

    const validator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });

    const result = await validator.validate();

    expect(result.warnings).not.toContain('Missing compilerOptions in tsconfig.json');
  });
});
