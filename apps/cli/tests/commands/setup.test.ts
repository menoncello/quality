import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { SetupCommand } from '../../src/commands/setup';
import { ProjectConfiguration } from '@dev-quality/types';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('SetupCommand', () => {
  let mockStdoutWrite: ReturnType<typeof vi.spyOn>;
  let mockStderrWrite: ReturnType<typeof vi.spyOn>;
  const testConfigPath = join(process.cwd(), '.test-config-setup.json');
  const testPackageJsonPath = join(process.cwd(), 'package.json');

  beforeEach(() => {
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockStderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const command = new SetupCommand({});
      expect(command).toBeDefined();
    });

    it('should create instance with force option', () => {
      const command = new SetupCommand({ force: true });
      expect(command).toBeDefined();
    });

    it('should create instance with interactive option', () => {
      const command = new SetupCommand({ interactive: true });
      expect(command).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should create configuration file successfully', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      expect(existsSync(testConfigPath)).toBe(true);

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;
      expect(config.name).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config.tools).toBeDefined();
      expect(Array.isArray(config.tools)).toBe(true);
    });

    it('should not overwrite existing config without force flag', async () => {
      const existingConfig = {
        name: 'existing-project',
        version: '2.0.0',
      };

      writeFileSync(testConfigPath, JSON.stringify(existingConfig), 'utf-8');

      const command = new SetupCommand({
        config: testConfigPath,
        force: false,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
      expect(config.name).toBe('existing-project');
      expect(config.version).toBe('2.0.0');
    });

    it('should overwrite existing config with force flag', async () => {
      const existingConfig = {
        name: 'existing-project',
        version: '2.0.0',
      };

      writeFileSync(testConfigPath, JSON.stringify(existingConfig), 'utf-8');

      const command = new SetupCommand({
        config: testConfigPath,
        force: true,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;
      expect(config.name).not.toBe('existing-project');
      expect(config.tools).toBeDefined();
    });

    it('should log setup messages', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Setting up'));
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('completed'));
    });

    it('should handle interactive mode', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
        interactive: true,
      });

      await command.execute();

      expect(existsSync(testConfigPath)).toBe(true);
    });
  });

  describe('configuration detection', () => {
    it('should detect project from package.json if available', async () => {
      const hasPackageJson = existsSync(testPackageJsonPath);

      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      if (hasPackageJson) {
        const packageJson = JSON.parse(readFileSync(testPackageJsonPath, 'utf-8'));
        expect(config.name).toBe(packageJson.name);
      } else {
        expect(config.name).toBeDefined();
      }
    });

    it('should include default tools in configuration', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      expect(config.tools.length).toBeGreaterThan(0);

      const toolNames = config.tools.map(tool => tool.name);

      expect(toolNames.some(name => ['typescript', 'eslint', 'prettier'].includes(name))).toBe(
        true
      );
    });

    it('should configure default paths', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      expect(config.paths).toBeDefined();
      expect(config.paths.source).toBeDefined();
      expect(config.paths.tests).toBeDefined();
      expect(config.paths.config).toBeDefined();
      expect(config.paths.output).toBeDefined();
    });

    it('should configure default settings', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      expect(config.settings).toBeDefined();
      expect(typeof config.settings.verbose).toBe('boolean');
      expect(typeof config.settings.quiet).toBe('boolean');
      expect(typeof config.settings.json).toBe('boolean');
      expect(typeof config.settings.cache).toBe('boolean');
    });
  });

  describe('tool configuration', () => {
    it('should enable all default tools', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      config.tools.forEach(tool => {
        expect(tool.enabled).toBe(true);
      });
    });

    it('should assign priorities to tools', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      config.tools.forEach(tool => {
        expect(tool.priority).toBeDefined();
        expect(typeof tool.priority).toBe('number');
      });
    });

    it('should include tool versions', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
      });

      await command.execute();

      const config = JSON.parse(readFileSync(testConfigPath, 'utf-8')) as ProjectConfiguration;

      config.tools.forEach(tool => {
        expect(tool.version).toBeDefined();
        expect(typeof tool.version).toBe('string');
      });
    });
  });

  describe('error handling', () => {
    it('should handle invalid config path gracefully', async () => {
      const command = new SetupCommand({
        config: '/invalid/path/config.json',
      });

      await expect(command.execute()).rejects.toThrow();
    });

    it('should handle write permission errors', async () => {
      const readonlyPath = '/readonly/config.json';

      const command = new SetupCommand({
        config: readonlyPath,
      });

      await expect(command.execute()).rejects.toThrow();
    });
  });

  describe('loadConfig', () => {
    it('should throw error if config file does not exist', async () => {
      const command = new SetupCommand({
        config: './non-existent-config.json',
      });

      await expect(command['loadConfig']()).rejects.toThrow('Configuration file not found');
    });

    it('should load existing configuration successfully', async () => {
      const mockConfig: ProjectConfiguration = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test',
        type: 'backend',
        frameworks: [],
        tools: [],
        paths: {
          source: './src',
          tests: './tests',
          config: './configs',
          output: './output',
        },
        settings: {
          verbose: false,
          quiet: false,
          json: false,
          cache: true,
        },
      };

      writeFileSync(testConfigPath, JSON.stringify(mockConfig), 'utf-8');

      const command = new SetupCommand({
        config: testConfigPath,
      });

      const config = await command['loadConfig']();

      expect(config.name).toBe('test-project');
      expect(config.version).toBe('1.0.0');
    });
  });

  describe('quiet mode', () => {
    it('should suppress info messages in quiet mode', async () => {
      const command = new SetupCommand({
        config: testConfigPath,
        quiet: true,
      });

      await command.execute();

      const infoCalls = mockStdoutWrite.mock.calls.filter(call =>
        call[0]?.toString().includes('INFO')
      );

      expect(infoCalls.length).toBe(0);
    });
  });
});
