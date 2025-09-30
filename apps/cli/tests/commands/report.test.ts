import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { ReportCommand } from '../../src/commands/report';
import { ProjectConfiguration } from '@dev-quality/types';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('ReportCommand', () => {
  let mockStdoutWrite: ReturnType<typeof vi.spyOn>;
  const testConfigPath = join(process.cwd(), '.test-config-report.json');
  const testOutputPath = join(process.cwd(), '.test-report-output.html');

  const mockConfig: ProjectConfiguration = {
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

  beforeEach(() => {
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    writeFileSync(testConfigPath, JSON.stringify(mockConfig), 'utf-8');
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    if (existsSync(testOutputPath)) {
      unlinkSync(testOutputPath);
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const command = new ReportCommand({});
      expect(command).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const command = new ReportCommand({
        type: 'detailed',
        format: 'json',
        output: './custom-report.json',
      });
      expect(command).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should generate HTML report successfully', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        type: 'summary',
        format: 'html',
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Generating'));
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
    });

    it('should generate markdown report successfully', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        type: 'summary',
        format: 'md',
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('# DevQuality Report'));
    });

    it('should generate JSON report successfully', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        type: 'summary',
        format: 'json',
      });

      await command.execute();

      const jsonOutput = mockStdoutWrite.mock.calls.find(call =>
        call[0]?.toString().includes('project')
      );
      expect(jsonOutput).toBeDefined();
    });

    it('should save report to file when output path provided', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        format: 'html',
        output: testOutputPath,
      });

      await command.execute();

      expect(existsSync(testOutputPath)).toBe(true);
      const content = readFileSync(testOutputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('test-project');
    });

    it('should throw error for unsupported format', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        format: 'xml',
      });

      await expect(command.execute()).rejects.toThrow('Unsupported report format');
    });

    it('should handle configuration loading errors', async () => {
      const command = new ReportCommand({
        config: './non-existent-config.json',
      });

      await expect(command.execute()).rejects.toThrow('Failed to load configuration');
    });

    it('should use default format when not specified', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
    });
  });

  describe('report generation', () => {
    it('should include project information in HTML report', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        format: 'html',
      });

      await command.execute();

      const htmlOutput = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(htmlOutput).toContain('test-project');
      expect(htmlOutput).toContain('Generated:');
    });

    it('should include summary metrics in report', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        format: 'md',
      });

      await command.execute();

      const mdOutput = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(mdOutput).toContain('Total Tools:');
      expect(mdOutput).toContain('Passed:');
      expect(mdOutput).toContain('Failed:');
      expect(mdOutput).toContain('Warnings:');
    });

    it('should include tool results in report', async () => {
      const jsonOutputPath = join(process.cwd(), '.test-report-json.json');

      const command = new ReportCommand({
        config: testConfigPath,
        format: 'json',
        output: jsonOutputPath,
      });

      await command.execute();

      expect(existsSync(jsonOutputPath)).toBe(true);

      const report = JSON.parse(readFileSync(jsonOutputPath, 'utf-8'));

      expect(report.results).toBeDefined();
      expect(Array.isArray(report.results)).toBe(true);
      expect(report.results.length).toBeGreaterThan(0);

      if (existsSync(jsonOutputPath)) {
        unlinkSync(jsonOutputPath);
      }
    });
  });

  describe('quiet mode', () => {
    it('should suppress info messages in quiet mode', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        quiet: true,
      });

      await command.execute();

      const infoCalls = mockStdoutWrite.mock.calls.filter(call =>
        call[0]?.toString().includes('INFO')
      );

      expect(infoCalls.length).toBe(0);
    });

    it('should still show HTML output in quiet mode', async () => {
      const command = new ReportCommand({
        config: testConfigPath,
        format: 'html',
        quiet: true,
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('<!DOCTYPE html>'));
    });
  });
});
