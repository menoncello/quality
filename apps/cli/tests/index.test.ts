import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { program } from '../src/index';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('CLI Entry Point', () => {
  let mockStdoutWrite: ReturnType<typeof vi.spyOn>;
  let mockStderrWrite: ReturnType<typeof vi.spyOn>;
  let mockProcessExit: ReturnType<typeof vi.spyOn>;
  const testConfigPath = join(process.cwd(), '.test-config-cli.json');

  beforeEach(() => {
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    mockStderrWrite = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const mockConfig = {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      type: 'backend',
      frameworks: [],
      tools: [
        { name: 'typescript', version: '5.3.3', enabled: true, config: {}, priority: 1 },
        { name: 'eslint', version: 'latest', enabled: true, config: {}, priority: 2 },
      ],
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
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('program configuration', () => {
    it('should have correct name', () => {
      expect(program.name()).toBe('dev-quality');
    });

    it('should have description', () => {
      const description = program.description();
      expect(description).toContain('DevQuality');
      expect(description).toContain('CLI');
    });

    it('should have version option', () => {
      const opts = program.opts();
      expect(program.options).toBeDefined();
    });

    it('should have global options defined', () => {
      const optionNames = program.options.map(opt => opt.long);

      expect(optionNames).toContain('--verbose');
      expect(optionNames).toContain('--quiet');
      expect(optionNames).toContain('--json');
      expect(optionNames).toContain('--config');
      expect(optionNames).toContain('--no-cache');
    });
  });

  describe('commands registration', () => {
    it('should have setup command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('setup');
    });

    it('should have config command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('config');
    });

    it('should have analyze command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('analyze');
    });

    it('should have report command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('report');
    });

    it('should have quick command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('quick');
    });

    it('should have watch command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('watch');
    });

    it('should have export command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('export');
    });

    it('should have history command registered', () => {
      const commands = program.commands.map(cmd => cmd.name());
      expect(commands).toContain('history');
    });
  });

  describe('command aliases', () => {
    it('should have "a" alias for analyze command', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      expect(analyzeCmd).toBeDefined();
      expect(analyzeCmd?.aliases()).toContain('a');
    });

    it('should have "r" alias for report command', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      expect(reportCmd).toBeDefined();
      expect(reportCmd?.aliases()).toContain('r');
    });

    it('should have "q" alias for quick command', () => {
      const quickCmd = program.commands.find(cmd => cmd.name() === 'quick');
      expect(quickCmd).toBeDefined();
      expect(quickCmd?.aliases()).toContain('q');
    });

    it('should have "w" alias for watch command', () => {
      const watchCmd = program.commands.find(cmd => cmd.name() === 'watch');
      expect(watchCmd).toBeDefined();
      expect(watchCmd?.aliases()).toContain('w');
    });
  });

  describe('setup command', () => {
    it('should have correct description', () => {
      const setupCmd = program.commands.find(cmd => cmd.name() === 'setup');
      expect(setupCmd?.description()).toContain('Initialize');
    });

    it('should have force option', () => {
      const setupCmd = program.commands.find(cmd => cmd.name() === 'setup');
      const optionNames = setupCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--force');
    });

    it('should have interactive option', () => {
      const setupCmd = program.commands.find(cmd => cmd.name() === 'setup');
      const optionNames = setupCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--interactive');
    });
  });

  describe('config command', () => {
    it('should have correct description', () => {
      const configCmd = program.commands.find(cmd => cmd.name() === 'config');
      expect(configCmd?.description()).toContain('configuration');
    });

    it('should have show option', () => {
      const configCmd = program.commands.find(cmd => cmd.name() === 'config');
      const optionNames = configCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--show');
    });

    it('should have edit option', () => {
      const configCmd = program.commands.find(cmd => cmd.name() === 'config');
      const optionNames = configCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--edit');
    });

    it('should have reset option', () => {
      const configCmd = program.commands.find(cmd => cmd.name() === 'config');
      const optionNames = configCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--reset');
    });
  });

  describe('analyze command', () => {
    it('should have correct description', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      expect(analyzeCmd?.description()).toContain('Analyze');
    });

    it('should have tools option', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      const optionNames = analyzeCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--tools');
    });

    it('should have output option', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      const optionNames = analyzeCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--output');
    });

    it('should have format option', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      const optionNames = analyzeCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--format');
    });

    it('should have fail-on-error option', () => {
      const analyzeCmd = program.commands.find(cmd => cmd.name() === 'analyze');
      const optionNames = analyzeCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--fail-on-error');
    });
  });

  describe('report command', () => {
    it('should have correct description', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      expect(reportCmd?.description()).toContain('report');
    });

    it('should have type option', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      const optionNames = reportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--type');
    });

    it('should have output option', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      const optionNames = reportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--output');
    });

    it('should have format option', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      const optionNames = reportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--format');
    });

    it('should have include-history option', () => {
      const reportCmd = program.commands.find(cmd => cmd.name() === 'report');
      const optionNames = reportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--include-history');
    });
  });

  describe('watch command', () => {
    it('should have correct description', () => {
      const watchCmd = program.commands.find(cmd => cmd.name() === 'watch');
      expect(watchCmd?.description()).toContain('Watch');
    });

    it('should have debounce option', () => {
      const watchCmd = program.commands.find(cmd => cmd.name() === 'watch');
      const optionNames = watchCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--debounce');
    });

    it('should have interval option', () => {
      const watchCmd = program.commands.find(cmd => cmd.name() === 'watch');
      const optionNames = watchCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--interval');
    });
  });

  describe('export command', () => {
    it('should have correct description', () => {
      const exportCmd = program.commands.find(cmd => cmd.name() === 'export');
      expect(exportCmd?.description()).toContain('Export');
    });

    it('should have input option', () => {
      const exportCmd = program.commands.find(cmd => cmd.name() === 'export');
      const optionNames = exportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--input');
    });

    it('should have output option', () => {
      const exportCmd = program.commands.find(cmd => cmd.name() === 'export');
      const optionNames = exportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--output');
    });

    it('should have format option', () => {
      const exportCmd = program.commands.find(cmd => cmd.name() === 'export');
      const optionNames = exportCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--format');
    });
  });

  describe('history command', () => {
    it('should have correct description', () => {
      const historyCmd = program.commands.find(cmd => cmd.name() === 'history');
      expect(historyCmd?.description()).toContain('history');
    });

    it('should have limit option', () => {
      const historyCmd = program.commands.find(cmd => cmd.name() === 'history');
      const optionNames = historyCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--limit');
    });

    it('should have plot option', () => {
      const historyCmd = program.commands.find(cmd => cmd.name() === 'history');
      const optionNames = historyCmd?.options.map(opt => opt.long);
      expect(optionNames).toContain('--plot');
    });
  });

  describe('quick command', () => {
    it('should have correct description', () => {
      const quickCmd = program.commands.find(cmd => cmd.name() === 'quick');
      expect(quickCmd?.description()).toContain('Quick');
    });
  });
});
