import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { WizardService } from '../../../src/services/wizard/wizard-service';
import { createTestDir, cleanupTestDir } from '../../test-utils';

describe('WizardService', () => {
  let testDir: string;
  let wizardService: WizardService;

  beforeEach(() => {
    testDir = createTestDir('wizard-test');
    wizardService = new WizardService(testDir);
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should initialize with correct project path', () => {
    const context = wizardService.getContext();
    expect(context.projectPath).toContain('wizard-test-');
    expect(context.generatedFiles).toEqual([]);
  });

  it('should add generated files to context', () => {
    wizardService.addGeneratedFile('test.txt');
    const files = wizardService.getGeneratedFiles();
    expect(files).toHaveLength(1);
    expect(files[0]).toContain('test.txt');
  });

  it('should not duplicate generated files', () => {
    wizardService.addGeneratedFile('test.txt');
    wizardService.addGeneratedFile('test.txt');
    const files = wizardService.getGeneratedFiles();
    expect(files).toHaveLength(1);
  });

  it('should check for existing config files', () => {
    const hasConfig = wizardService.hasExistingConfig('nonexistent.json');
    expect(hasConfig).toBe(false);
  });

  it('should get absolute config path', () => {
    const configPath = wizardService.getConfigPath('test.json');
    expect(configPath).toContain(testDir);
    expect(configPath).toContain('test.json');
  });

  it('should store and retrieve backup metadata', () => {
    const metadata = {
      timestamp: new Date(),
      files: [{ path: '/test/file.txt', originalContent: 'test' }],
      wizardStep: 'step1',
    };

    wizardService.setBackupMetadata(metadata);
    const retrieved = wizardService.getBackupMetadata();

    expect(retrieved).toEqual(metadata);
  });

  it('should reset context', () => {
    wizardService.addGeneratedFile('test.txt');
    wizardService.reset();

    const context = wizardService.getContext();
    expect(context.generatedFiles).toEqual([]);
    expect(context.detectionResult).toBeUndefined();
  });
});
