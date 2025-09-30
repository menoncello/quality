import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WizardService } from '../../../src/services/wizard/wizard-service';
import {
  BunTestConfigGenerator,
  ESLintConfigGenerator,
  PrettierConfigGenerator,
  TypeScriptConfigGenerator,
} from '../../../src/services/wizard/config-generator';
import {
  BunTestValidator,
  ESLintValidator,
  PrettierValidator,
  TypeScriptValidator,
} from '../../../src/services/wizard/validator';
import { RollbackService } from '../../../src/services/wizard/rollback';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDir, cleanupTestDir } from '../../test-utils';

describe('Complete Wizard Workflow', () => {
  let testDir: string;
  let wizardService: WizardService;
  let rollbackService: RollbackService;

  beforeEach(() => {
    testDir = createTestDir('wizard-workflow-test');
    wizardService = new WizardService(testDir);
    rollbackService = new RollbackService(testDir);

    // Create a minimal package.json for testing
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project',
      })
    );
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should complete full workflow: generate, validate, no rollback needed', async () => {
    // Step 1: Create backup
    await rollbackService.createBackup(
      ['bunfig.toml', 'eslint.config.js', '.prettierrc.json', 'tsconfig.json'],
      'configuration'
    );

    // Step 2: Generate all configurations
    const bunGenerator = new BunTestConfigGenerator({ projectPath: testDir });
    const eslintGenerator = new ESLintConfigGenerator({ projectPath: testDir });
    const prettierGenerator = new PrettierConfigGenerator({ projectPath: testDir });
    const tsGenerator = new TypeScriptConfigGenerator({ projectPath: testDir });

    const bunResult = await bunGenerator.generate('create');
    const eslintResult = await eslintGenerator.generate('create');
    const prettierResult = await prettierGenerator.generate('create');
    const tsResult = await tsGenerator.generate('create');

    wizardService.addGeneratedFile(bunResult.filePath);
    wizardService.addGeneratedFile(eslintResult.filePath);
    wizardService.addGeneratedFile(prettierResult.filePath);
    wizardService.addGeneratedFile(tsResult.filePath);

    // Step 3: Validate all configurations
    const bunValidator = new BunTestValidator({
      projectPath: testDir,
      configPath: 'bunfig.toml',
    });
    const eslintValidator = new ESLintValidator({
      projectPath: testDir,
      configPath: 'eslint.config.js',
    });
    const prettierValidator = new PrettierValidator({
      projectPath: testDir,
      configPath: '.prettierrc.json',
    });
    const tsValidator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });

    const bunValidation = await bunValidator.validate();
    const eslintValidation = await eslintValidator.validate();
    const prettierValidation = await prettierValidator.validate();
    const tsValidation = await tsValidator.validate();

    // Verify all validations
    expect(bunValidation.isValid).toBe(true);
    expect(eslintValidation.isValid).toBe(true);
    expect(prettierValidation.isValid).toBe(true);
    expect(tsValidation.isValid).toBe(true);

    // Step 4: Verify all files exist
    expect(existsSync(join(testDir, 'bunfig.toml'))).toBe(true);
    expect(existsSync(join(testDir, 'eslint.config.js'))).toBe(true);
    expect(existsSync(join(testDir, '.prettierrc.json'))).toBe(true);
    expect(existsSync(join(testDir, 'tsconfig.json'))).toBe(true);

    // Step 5: Cleanup backup
    await rollbackService.cleanupBackup();

    const generatedFiles = wizardService.getGeneratedFiles();
    expect(generatedFiles).toHaveLength(4);
  });

  it('should handle existing configurations with merge', async () => {
    // Create existing configs
    writeFileSync(join(testDir, 'bunfig.toml'), '[install]\nfrozen = true');
    writeFileSync(join(testDir, '.prettierrc.json'), '{"semi": false}');
    writeFileSync(
      join(testDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { target: 'ES2020' } })
    );

    // Create backup
    await rollbackService.createBackup(
      ['bunfig.toml', '.prettierrc.json', 'tsconfig.json'],
      'merge-test'
    );

    // Generate with merge
    const bunGenerator = new BunTestConfigGenerator({ projectPath: testDir });
    const prettierGenerator = new PrettierConfigGenerator({ projectPath: testDir });
    const tsGenerator = new TypeScriptConfigGenerator({ projectPath: testDir });

    await bunGenerator.generate('merge');
    await prettierGenerator.generate('merge');
    await tsGenerator.generate('merge');

    // Verify merge preserved existing settings
    const bunContent = readFileSync(join(testDir, 'bunfig.toml'), 'utf-8');
    expect(bunContent).toContain('[install]');
    expect(bunContent).toContain('[test]');

    const prettierContent = readFileSync(join(testDir, '.prettierrc.json'), 'utf-8');
    const prettierConfig = JSON.parse(prettierContent);
    expect(prettierConfig.semi).toBe(false); // Preserved

    const tsContent = readFileSync(join(testDir, 'tsconfig.json'), 'utf-8');
    const tsConfig = JSON.parse(tsContent);
    expect(tsConfig.compilerOptions.target).toBe('ES2020'); // Preserved
  });

  it('should rollback on validation failure', async () => {
    // Create existing config
    const originalContent = '{"compilerOptions": {"target": "ES2020"}}';
    writeFileSync(join(testDir, 'tsconfig.json'), originalContent);

    // Create backup
    await rollbackService.createBackup(['tsconfig.json'], 'validation-test');

    // Corrupt the config
    writeFileSync(join(testDir, 'tsconfig.json'), '{invalid json}');

    // Validate (should fail)
    const validator = new TypeScriptValidator({
      projectPath: testDir,
      configPath: 'tsconfig.json',
    });
    const validation = await validator.validate();

    expect(validation.isValid).toBe(false);

    // Rollback
    const rollbackResult = await rollbackService.rollback();
    expect(rollbackResult.success).toBe(true);

    // Verify original content restored
    const restoredContent = readFileSync(join(testDir, 'tsconfig.json'), 'utf-8');
    expect(restoredContent).toBe(originalContent);
  });

  it('should handle wizard cancellation with complete rollback', async () => {
    // Step 1: Generate some configs
    await rollbackService.createBackup(['bunfig.toml', 'tsconfig.json'], 'cancellation-test');

    const bunGenerator = new BunTestConfigGenerator({ projectPath: testDir });
    const tsGenerator = new TypeScriptConfigGenerator({ projectPath: testDir });

    await bunGenerator.generate('create');
    await tsGenerator.generate('create');

    expect(existsSync(join(testDir, 'bunfig.toml'))).toBe(true);
    expect(existsSync(join(testDir, 'tsconfig.json'))).toBe(true);

    // Step 2: User cancels wizard - rollback everything
    const rollbackResult = await rollbackService.rollback();

    expect(rollbackResult.success).toBe(true);
    expect(existsSync(join(testDir, 'bunfig.toml'))).toBe(false);
    expect(existsSync(join(testDir, 'tsconfig.json'))).toBe(false);
  });

  it('should handle JavaScript-only project', async () => {
    // Update package.json to be JavaScript-only
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'js-project',
        version: '1.0.0',
        main: 'index.js',
      })
    );

    // Generate configs (TypeScript optional for JS projects)
    const bunGenerator = new BunTestConfigGenerator({ projectPath: testDir });
    const eslintGenerator = new ESLintConfigGenerator({ projectPath: testDir });
    const prettierGenerator = new PrettierConfigGenerator({ projectPath: testDir });

    await bunGenerator.generate('create');
    await eslintGenerator.generate('create');
    await prettierGenerator.generate('create');

    // Verify configs exist
    expect(existsSync(join(testDir, 'bunfig.toml'))).toBe(true);
    expect(existsSync(join(testDir, 'eslint.config.js'))).toBe(true);
    expect(existsSync(join(testDir, '.prettierrc.json'))).toBe(true);
  });

  it('should persist configuration to context', async () => {
    const bunGenerator = new BunTestConfigGenerator({ projectPath: testDir });
    const result = await bunGenerator.generate('create');

    wizardService.addGeneratedFile(result.filePath);

    const context = wizardService.getContext();
    expect(context.generatedFiles).toContain(result.filePath);
  });
});
