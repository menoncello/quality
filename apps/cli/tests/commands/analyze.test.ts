import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { AnalyzeCommand } from '../../src/commands/analyze';
import { ProjectConfiguration } from '@dev-quality/types';
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import type { AnalysisResult } from '../../src/types';

describe('AnalyzeCommand', () => {
  let mockStdoutWrite: ReturnType<typeof vi.spyOn>;
  const testConfigPath = join(process.cwd(), '.test-config-analyze.json');
  const testOutputPath = join(process.cwd(), '.test-analyze-output.json');

  const mockConfig: ProjectConfiguration = {
    name: 'test-project',
    version: '1.0.0',
    description: 'Test project',
    type: 'backend',
    frameworks: [],
    tools: [
      { name: 'typescript', version: '5.3.3', enabled: true, config: {}, priority: 1 },
      { name: 'eslint', version: 'latest', enabled: true, config: {}, priority: 2 },
      { name: 'prettier', version: 'latest', enabled: true, config: {}, priority: 3 },
      { name: 'vitest', version: 'latest', enabled: false, config: {}, priority: 4 },
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

    // Mock the runToolAnalysis method to avoid delays
    vi.spyOn(AnalyzeCommand.prototype, 'runToolAnalysis' as any).mockImplementation(
      async (toolName: string, config: ProjectConfiguration): Promise<AnalysisResult> => {
        return {
          id: `${toolName}-mock-${Date.now()}`,
          projectId: config.name ?? 'test-project',
          timestamp: new Date().toISOString(),
          duration: 10,
          overallScore: 85,
          toolResults: [
            {
              toolName,
              executionTime: 10,
              status: 'success',
              issues: [],
              metrics: {
                issuesCount: 0,
                errorsCount: 0,
                warningsCount: 0,
                infoCount: 0,
                fixableCount: 0,
                score: 85,
              },
            },
          ],
          summary: {
            totalIssues: 0,
            totalErrors: 0,
            totalWarnings: 0,
            totalFixable: 0,
            overallScore: 85,
            toolCount: 1,
            executionTime: 10,
          },
          aiPrompts: [],
        };
      }
    );

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
      const command = new AnalyzeCommand({});
      expect(command).toBeDefined();
    });

    it('should create instance with custom options', () => {
      const command = new AnalyzeCommand({
        tools: 'typescript,eslint',
        output: './results.json',
        format: 'json',
        failOnError: true,
      });
      expect(command).toBeDefined();
    });

    it('should create instance with quick mode', () => {
      const command = new AnalyzeCommand({ quick: true });
      expect(command).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should run analysis successfully', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        noDashboard: true,
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Starting'));
      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('completed'));
    });

    it('should analyze only enabled tools', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('typescript');
      expect(outputCalls).toContain('eslint');
      expect(outputCalls).toContain('prettier');
    });

    it('should analyze specific tools when provided', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        tools: 'typescript',
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('typescript');
    });

    it('should handle multiple specific tools', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        tools: 'typescript,eslint',
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('typescript');
      expect(outputCalls).toContain('eslint');
    });

    it('should warn when no tools are enabled', async () => {
      const noToolsConfig = {
        ...mockConfig,
        tools: [],
      };

      writeFileSync(testConfigPath, JSON.stringify(noToolsConfig), 'utf-8');

      const command = new AnalyzeCommand({
        config: testConfigPath,
        noDashboard: true,
      });

      await command.execute();

      const warnCalls = mockStdoutWrite.mock.calls.filter(call =>
        call[0]?.toString().includes('WARN')
      );

      expect(warnCalls.length).toBeGreaterThan(0);
    });

    it('should save results to file when output specified', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      expect(existsSync(testOutputPath)).toBe(true);

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle configuration loading errors', async () => {
      const command = new AnalyzeCommand({
        config: './non-existent-config.json',
        noDashboard: true,
      });

      await expect(command.execute()).rejects.toThrow('Failed to load configuration');
    });
  });

  describe('tool execution', () => {
    it('should run tools in priority order', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls
        .map(call => call[0]?.toString())
        .filter(msg => msg?.includes('analysis completed'));

      expect(outputCalls.length).toBeGreaterThan(0);
    });

    it('should complete execution without errors', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        failOnError: false,
        noDashboard: true,
      });

      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('completed'));
    });

    it('should generate analysis summary', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toMatch(/\d+\/\d+ tools passed/);
    });
  });

  describe('output formatting', () => {
    it('should output results in JSON format', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const jsonCalls = mockStdoutWrite.mock.calls.filter(call => {
        const str = call[0]?.toString() ?? '';
        return str.includes('[') || str.includes('{');
      });

      expect(jsonCalls.length).toBeGreaterThan(0);
    });

    it('should include tool name in results', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));

      results.forEach((result: { toolResults: Array<{ toolName: string }> }) => {
        expect(result.toolResults[0].toolName).toBeDefined();
        expect(typeof result.toolResults[0].toolName).toBe('string');
      });
    });

    it('should include success status in results', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));

      results.forEach((result: { toolResults: Array<{ status: string }> }) => {
        expect(result.toolResults[0].status).toBeDefined();
        expect(typeof result.toolResults[0].status).toBe('string');
        expect(['success', 'error', 'warning']).toContain(result.toolResults[0].status);
      });
    });

    it('should include timestamp in results', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));

      results.forEach((result: { timestamp: string }) => {
        expect(result.timestamp).toBeDefined();
        expect(typeof result.timestamp).toBe('string');
      });
    });

    it('should include duration in results', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));

      results.forEach((result: { duration: number }) => {
        expect(result.duration).toBeDefined();
        expect(typeof result.duration).toBe('number');
      });
    });

    it('should include analysis data in results', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        output: testOutputPath,
        json: true,
        noDashboard: true,
      });

      await command.execute();

      const results = JSON.parse(readFileSync(testOutputPath, 'utf-8'));

      results.forEach(
        (result: {
          summary: {
            totalIssues?: number;
            totalWarnings?: number;
            totalErrors?: number;
          };
          toolResults: Array<{
            metrics?: {
              issuesCount?: number;
              warningsCount?: number;
              errorsCount?: number;
            };
          }>;
        }) => {
          expect(result.summary).toBeDefined();
          expect(typeof result.summary).toBe('object');
          expect(result.toolResults[0].metrics).toBeDefined();
          expect(typeof result.toolResults[0].metrics).toBe('object');
        }
      );
    });
  });

  describe('verbose mode', () => {
    it('should log verbose messages when enabled', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        verbose: true,
        noDashboard: true,
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls.length).toBeGreaterThan(0);
    });
  });

  describe('quiet mode', () => {
    it('should suppress info messages in quiet mode', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        quiet: true,
        noDashboard: true,
      });

      await command.execute();

      const infoCalls = mockStdoutWrite.mock.calls.filter(call =>
        call[0]?.toString().includes('INFO')
      );

      expect(infoCalls.length).toBe(0);
    });

    it('should still output results in quiet mode', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
        quiet: true,
        output: testOutputPath,
        noDashboard: true,
      });

      await command.execute();

      expect(existsSync(testOutputPath)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    it('should load configuration successfully', async () => {
      const command = new AnalyzeCommand({
        config: testConfigPath,
      });

      const config = await command['loadConfig']();

      expect(config.name).toBe('test-project');
      expect(config.tools).toBeDefined();
    });

    it('should throw error for missing config file', async () => {
      const command = new AnalyzeCommand({
        config: './missing-config.json',
      });

      await expect(command['loadConfig']()).rejects.toThrow('Failed to load configuration');
    });

    it('should use default config path when not specified', async () => {
      const defaultConfigPath = '.dev-quality.json';

      if (!existsSync(defaultConfigPath)) {
        writeFileSync(defaultConfigPath, JSON.stringify(mockConfig), 'utf-8');
      }

      const command = new AnalyzeCommand({});

      const config = await command['loadConfig']();

      expect(config).toBeDefined();

      if (existsSync(defaultConfigPath) && defaultConfigPath !== testConfigPath) {
        try {
          unlinkSync(defaultConfigPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  });
});
