import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { SetupCommand } from '../src/commands/setup';
import { ConfigCommand } from '../src/commands/config';
import { AnalyzeCommand } from '../src/commands/analyze';
import { ReportCommand } from '../src/commands/report';
import { BaseCommand } from '../src/commands/base-command';
import { ProjectConfiguration } from '@dev-quality/types';

describe('CLI Commands', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
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
    let mockStdoutWrite: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    class TestCommand extends BaseCommand {
      async execute(): Promise<void> {
        this.log('test message');
        this.logVerbose('verbose message');
        this.log('error message', 'error');
      }

      protected async loadConfig(): Promise<ProjectConfiguration> {
        return {} as ProjectConfiguration;
      }
    }

    it('should log messages appropriately', async () => {
      const command = new TestCommand({ verbose: false, quiet: false });
      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('INFO: test message'));
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
    });

    it('should respect quiet mode', async () => {
      const command = new TestCommand({ verbose: false, quiet: true });
      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('ERROR: error message'));
      expect(mockStdoutWrite).not.toHaveBeenCalledWith(
        expect.stringContaining('INFO: test message')
      );
    });
  });
});
