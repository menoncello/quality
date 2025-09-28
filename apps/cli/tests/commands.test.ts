import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { SetupCommand } from '../src/commands/setup';
import { ConfigCommand } from '../src/commands/config';
import { AnalyzeCommand } from '../src/commands/analyze';
import { ReportCommand } from '../src/commands/report';
import { BaseCommand } from '../src/commands/base-command';

describe('CLI Commands', () => {
  let mockConsoleLog: any;
  let mockConsoleError: any;

  beforeEach(() => {
    mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SetupCommand', () => {
    it('should be instantiable with options', () => {
      const command = new SetupCommand({ force: false, interactive: true });
      expect(command).toBeInstanceOf(BaseCommand);
      expect(command).toBeInstanceOf(SetupCommand);
    });
  });

  describe('ConfigCommand', () => {
    it('should be instantiable with options', () => {
      const command = new ConfigCommand({ show: true, edit: false, reset: false });
      expect(command).toBeInstanceOf(BaseCommand);
      expect(command).toBeInstanceOf(ConfigCommand);
    });
  });

  describe('AnalyzeCommand', () => {
    it('should be instantiable with options', () => {
      const command = new AnalyzeCommand({ tools: 'typescript,eslint' });
      expect(command).toBeInstanceOf(BaseCommand);
      expect(command).toBeInstanceOf(AnalyzeCommand);
    });
  });

  describe('ReportCommand', () => {
    it('should be instantiable with options', () => {
      const command = new ReportCommand({ type: 'summary', format: 'html' });
      expect(command).toBeInstanceOf(BaseCommand);
      expect(command).toBeInstanceOf(ReportCommand);
    });
  });

  describe('BaseCommand logging', () => {
    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        this.log('test message');
        this.logVerbose('verbose message');
        this.log('error message', 'error');
      }

      protected async loadConfig(configPath?: string): Promise<any> {
        return {};
      }
    }

    it('should log messages appropriately', async () => {
      const command = new TestCommand({ verbose: false, quiet: false });
      await command.execute();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('INFO: test message'));
      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
    });

    it('should respect quiet mode', async () => {
      const command = new TestCommand({ verbose: false, quiet: true });
      await command.execute();

      expect(mockConsoleLog).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
      expect(mockConsoleLog).not.toHaveBeenCalledWith(
        expect.stringContaining('INFO: test message')
      );
    });
  });
});
