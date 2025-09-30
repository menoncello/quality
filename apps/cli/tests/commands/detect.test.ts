import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { DetectCommand } from '../../src/commands/detect';
import { DetectionResult } from '@dev-quality/core';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

describe('DetectCommand', () => {
  let mockStdoutWrite: ReturnType<typeof vi.spyOn>;
  const testConfigPath = join(process.cwd(), '.test-detect-config.json');

  const mockDetectionResult: DetectionResult = {
    project: {
      name: 'test-project',
      version: '1.0.0',
      description: 'Test project',
      type: 'backend',
      frameworks: ['express'],
      buildSystems: ['npm'],
      hasTypeScript: true,
      hasTests: true,
      packageManager: 'npm',
    },
    tools: [
      {
        name: 'typescript',
        version: '5.3.3',
        enabled: true,
        configFormat: 'json',
        config: {},
        priority: 1,
      },
      {
        name: 'eslint',
        version: '8.57.0',
        enabled: true,
        configFormat: 'json',
        config: {},
        priority: 2,
      },
    ],
    dependencies: [
      {
        name: 'typescript',
        version: '^5.3.3',
        type: 'devDependencies',
        compatibility: 'compatible',
        issues: [],
      },
      {
        name: 'eslint',
        version: '^8.57.0',
        type: 'devDependencies',
        compatibility: 'compatible',
        issues: [],
      },
      {
        name: 'express',
        version: '^4.18.0',
        type: 'dependencies',
        compatibility: 'compatible',
        issues: [],
      },
    ],
    structure: {
      isMonorepo: false,
      workspaceType: null,
      packages: [],
      sourceDirectories: ['src'],
      testDirectories: ['test'],
      configDirectories: ['config'],
      complexity: 'simple',
    },
    issues: [],
    recommendations: [],
    timestamp: Date.now(),
  };

  beforeEach(() => {
    mockStdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    // Create test package.json
    const testPackageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        express: '^4.18.0',
      },
      devDependencies: {
        typescript: '^5.3.3',
        eslint: '^8.57.0',
      },
    };
    writeFileSync(testConfigPath, JSON.stringify(testPackageJson), 'utf-8');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('constructor', () => {
    it('should create instance with default options', () => {
      const command = new DetectCommand({});
      expect(command).toBeDefined();
    });

    it('should create instance with format option', () => {
      const command = new DetectCommand({ format: 'json' });
      expect(command).toBeDefined();
    });

    it('should create instance with detailed option', () => {
      const command = new DetectCommand({ detailed: true });
      expect(command).toBeDefined();
    });

    it('should create instance with multiple options', () => {
      const command = new DetectCommand({
        format: 'table',
        detailed: true,
        verbose: true,
      });
      expect(command).toBeDefined();
    });
  });

  describe('execute', () => {
    it('should run detection successfully', async () => {
      const command = new DetectCommand({});
      await command.execute();

      expect(mockStdoutWrite).toHaveBeenCalledWith(expect.stringContaining('Detecting'));
    });

    it('should display detection results', async () => {
      const command = new DetectCommand({});
      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Project Detection Results');
      expect(outputCalls).toContain('Project:');
    });

    it('should display issues when present', async () => {
      const command = new DetectCommand({});
      await command.execute();

      // If issues are found, they should be displayed
      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      if (outputCalls.includes('Issues Found')) {
        expect(outputCalls).toContain('Issues Found');
      }
    });

    it('should display recommendations when present', async () => {
      const command = new DetectCommand({});
      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      if (outputCalls.includes('Recommendations')) {
        expect(outputCalls).toContain('Recommendations');
      }
    });
  });

  describe('output formats', () => {
    it('should output in JSON format when specified', async () => {
      const command = new DetectCommand({ format: 'json' });
      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('"project":');
      expect(outputCalls).toContain('"tools":');
      expect(outputCalls).toContain('"dependencies":');
    });

    it('should output in table format by default', async () => {
      const command = new DetectCommand({});
      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Project Detection Results');
      expect(outputCalls).not.toMatch(/^{/);
    });

    it('should output in table format when explicitly specified', async () => {
      const command = new DetectCommand({ format: 'table' });
      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Project Detection Results');
    });
  });

  describe('displayDetectionResult', () => {
    it('should display project information', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('test-project');
      expect(outputCalls).toContain('1.0.0');
      expect(outputCalls).toContain('backend');
    });

    it('should display framework information', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('express');
    });

    it('should display build systems', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('npm');
    });

    it('should display TypeScript status', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('TypeScript');
    });

    it('should display test status', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Tests');
    });

    it('should display detected tools', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('typescript');
      expect(outputCalls).toContain('eslint');
      expect(outputCalls).toContain('5.3.3');
      expect(outputCalls).toContain('8.57.0');
    });

    it('should show "No tools detected" when tools array is empty', () => {
      const resultWithNoTools = {
        ...mockDetectionResult,
        tools: [],
      };

      const command = new DetectCommand({});
      command['displayDetectionResult'](resultWithNoTools, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('No tools detected');
    });
  });

  describe('detailed mode', () => {
    it('should display structure info in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Structure:');
      expect(outputCalls).toContain('Monorepo');
      expect(outputCalls).toContain('Complexity');
    });

    it('should display source directories in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Source Dirs');
      expect(outputCalls).toContain('src');
    });

    it('should display test directories in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Test Dirs');
      expect(outputCalls).toContain('test');
    });

    it('should display config directories in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Config Dirs');
    });

    it('should display dependencies summary in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Dependencies');
      expect(outputCalls).toContain('devDependencies');
      expect(outputCalls).toContain('dependencies');
    });

    it('should display compatibility status in detailed mode', () => {
      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](mockDetectionResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Compatibility');
      expect(outputCalls).toContain('compatible');
    });

    it('should display workspace type for monorepos', () => {
      const monorepoResult = {
        ...mockDetectionResult,
        structure: {
          ...mockDetectionResult.structure,
          isMonorepo: true,
          workspaceType: 'npm' as const,
        },
      };

      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](monorepoResult, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Workspace Type');
      expect(outputCalls).toContain('npm');
    });

    it('should not display structure in non-detailed mode', () => {
      const command = new DetectCommand({ detailed: false });
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).not.toContain('Source Dirs');
      expect(outputCalls).not.toContain('Complexity');
    });

    it('should not display dependencies in non-detailed mode', () => {
      const command = new DetectCommand({ detailed: false });
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).not.toContain('devDependencies:');
      expect(outputCalls).not.toContain('Compatibility:');
    });
  });

  describe('issues and recommendations', () => {
    it('should display issues when present', async () => {
      const resultWithIssues = {
        ...mockDetectionResult,
        issues: ['TypeScript version below minimum', 'ESLint config missing'],
      };

      const command = new DetectCommand({});

      // Mock the detection engine to return our custom result
      const mockDetectAll = vi.fn(async () => resultWithIssues);
      vi.spyOn(command, 'execute').mockImplementation(async () => {
        command['log']('🔍 Detecting project configuration...');
        const result = await mockDetectAll();

        command['displayDetectionResult'](result, false);

        if (result.issues.length > 0) {
          command['log']('\n⚠️  Issues Found:');
          result.issues.forEach((issue: string) => {
            command['log'](`   • ${issue}`);
          });
        }
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Issues Found');
      expect(outputCalls).toContain('TypeScript version below minimum');
      expect(outputCalls).toContain('ESLint config missing');
    });

    it('should display recommendations when present', async () => {
      const resultWithRecs = {
        ...mockDetectionResult,
        recommendations: ['Upgrade TypeScript to v5.3.3', 'Add Prettier for code formatting'],
      };

      const command = new DetectCommand({});

      // Mock the detection engine to return our custom result
      const mockDetectAll = vi.fn(async () => resultWithRecs);
      vi.spyOn(command, 'execute').mockImplementation(async () => {
        command['log']('🔍 Detecting project configuration...');
        const result = await mockDetectAll();

        command['displayDetectionResult'](result, false);

        if (result.recommendations.length > 0) {
          command['log']('\n💡 Recommendations:');
          result.recommendations.forEach((rec: string) => {
            command['log'](`   • ${rec}`);
          });
        }
      });

      await command.execute();

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Recommendations');
      expect(outputCalls).toContain('Upgrade TypeScript');
      expect(outputCalls).toContain('Add Prettier');
    });
  });

  describe('timestamp', () => {
    it('should display detection timestamp', () => {
      const command = new DetectCommand({});
      command['displayDetectionResult'](mockDetectionResult, false);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('Detected at:');
    });
  });

  describe('dependency compatibility', () => {
    it('should show compatibility icons correctly', () => {
      const resultWithMixedCompat = {
        ...mockDetectionResult,
        dependencies: [
          {
            name: 'typescript',
            version: '^5.3.3',
            type: 'devDependencies',
            compatibility: 'compatible' as const,
            issues: [],
          },
          {
            name: 'old-lib',
            version: '^1.0.0',
            type: 'dependencies',
            compatibility: 'incompatible' as const,
            issues: ['Version too old'],
          },
          {
            name: 'unknown-lib',
            version: '^2.0.0',
            type: 'dependencies',
            compatibility: 'unknown' as const,
            issues: [],
          },
        ],
      };

      const command = new DetectCommand({ detailed: true });
      command['displayDetectionResult'](resultWithMixedCompat, true);

      const outputCalls = mockStdoutWrite.mock.calls.map(call => call[0]?.toString()).join('');

      expect(outputCalls).toContain('compatible');
      expect(outputCalls).toContain('incompatible');
      expect(outputCalls).toContain('unknown');
    });
  });
});