import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ToolDetector } from '../../src/detection/tool-detector';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('ToolDetector', () => {
  let detector: ToolDetector;
  let testDir: string;

  beforeEach(() => {
    detector = new ToolDetector();
    testDir = createTestDir('test-tools');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  describe('detectTools', () => {
    it('should detect ESLint configuration', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          eslint: '^8.57.0',
        },
      });

      writeFileSync(
        join(testDir, '.eslintrc.json'),
        JSON.stringify({
          extends: ['eslint:recommended'],
        })
      );

      const tools = await detector.detectTools(testDir);

      const eslintTool = tools.find(t => t.name === 'eslint');
      expect(eslintTool).toBeDefined();
      expect(eslintTool!.enabled).toBe(true);
      expect(eslintTool!.version).toBe('^8.57.0');
      expect(eslintTool!.configFormat).toBe('json');
    });

    it('should detect Prettier configuration', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          prettier: '^3.0.0',
        },
      });

      writeFileSync(
        join(testDir, '.prettierrc'),
        JSON.stringify({
          semi: true,
          singleQuote: true,
        })
      );

      const tools = await detector.detectTools(testDir);

      const prettierTool = tools.find(t => t.name === 'prettier');
      expect(prettierTool).toBeDefined();
      expect(prettierTool!.enabled).toBe(true);
    });

    it('should detect TypeScript configuration', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          typescript: '^5.3.3',
        },
      });

      writeFileSync(
        join(testDir, 'tsconfig.json'),
        JSON.stringify({
          compilerOptions: {
            target: 'es2020',
          },
        })
      );

      const tools = await detector.detectTools(testDir);

      const tsTool = tools.find(t => t.name === 'typescript');
      expect(tsTool).toBeDefined();
      expect(tsTool!.enabled).toBe(true);
    });

    it('should detect Jest configuration', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          jest: '^29.7.0',
        },
      });

      writeFileSync(join(testDir, 'jest.config.js'), 'module.exports = {};');

      const tools = await detector.detectTools(testDir);

      const jestTool = tools.find(t => t.name === 'jest');
      expect(jestTool).toBeDefined();
      expect(jestTool!.enabled).toBe(true);
    });

    it('should detect Vite configuration', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          vite: '^5.0.0',
        },
      });

      writeFileSync(join(testDir, 'vite.config.ts'), 'export default {};');

      const tools = await detector.detectTools(testDir);

      const viteTool = tools.find(t => t.name === 'vite');
      expect(viteTool).toBeDefined();
      expect(viteTool!.enabled).toBe(true);
      expect(viteTool!.configFormat).toBe('ts');
    });

    it('should return tools sorted by priority', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          typescript: '^5.3.3',
          eslint: '^8.57.0',
          prettier: '^3.0.0',
        },
      });

      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      writeFileSync(join(testDir, '.eslintrc.json'), '{}');
      writeFileSync(join(testDir, '.prettierrc'), '{}');

      const tools = await detector.detectTools(testDir);

      expect(tools[0].name).toBe('typescript'); // priority 1
      expect(tools[1].name).toBe('eslint'); // priority 2
      expect(tools[2].name).toBe('prettier'); // priority 3
    });

    it('should not detect tools without configuration files', async () => {
      setupTestProject(testDir, {
        devDependencies: {
          'some-unknown-tool': '^1.0.0',
        },
      });

      const tools = await detector.detectTools(testDir);

      expect(tools.length).toBe(0);
    });
  });

  describe('detectConfigs', () => {
    it('should detect all configuration files', async () => {
      setupTestProject(testDir, {});

      writeFileSync(join(testDir, '.eslintrc.json'), '{}');
      writeFileSync(join(testDir, '.prettierrc'), '{}');
      writeFileSync(join(testDir, 'tsconfig.json'), '{}');
      writeFileSync(join(testDir, 'vite.config.ts'), 'export default {};');

      const configs = await detector.detectConfigs(testDir);

      expect(configs.length).toBeGreaterThanOrEqual(4);
      expect(configs.some(c => c.tool === 'eslint')).toBe(true);
      expect(configs.some(c => c.tool === 'prettier')).toBe(true);
      expect(configs.some(c => c.tool === 'typescript')).toBe(true);
      expect(configs.some(c => c.tool === 'vite')).toBe(true);
    });

    it('should handle missing configuration files gracefully', async () => {
      // Create a completely empty directory with no config files
      const emptyDir = join(testDir, 'empty');
      mkdirSync(emptyDir, { recursive: true });

      const configs = await detector.detectConfigs(emptyDir);

      expect(configs.length).toBe(0);
    });
  });

  describe('getConfigFormat', () => {
    it('should detect JSON format', () => {
      const format = detector['getConfigFormat']('.eslintrc.json');
      expect(format).toBe('json');
    });

    it('should detect JavaScript format', () => {
      const format = detector['getConfigFormat']('vite.config.js');
      expect(format).toBe('js');
    });

    it('should detect TypeScript format', () => {
      const format = detector['getConfigFormat']('vite.config.ts');
      expect(format).toBe('ts');
    });

    it('should detect YAML format', () => {
      const format = detector['getConfigFormat']('.eslintrc.yaml');
      expect(format).toBe('yaml');
    });

    it('should default to JSON for unknown formats', () => {
      const format = detector['getConfigFormat']('.eslintrc');
      expect(format).toBe('json');
    });
  });

  function setupTestProject(dir: string, packageJson: unknown) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(join(dir, 'package.json'), JSON.stringify(packageJson, null, 2));
  }
});
