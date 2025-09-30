import { existsSync } from 'node:fs';
import { join, basename, extname } from 'node:path';
import { fileUtils } from '@dev-quality/utils';
import { DetectedTool, ConfigFile } from './types';

export class ToolDetector {
  private readonly TOOL_CONFIGS = [
    // Linting and Formatting
    {
      tool: 'eslint',
      configs: [
        '.eslintrc',
        '.eslintrc.json',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        '.eslintrc.js',
        'eslint.config.js',
      ],
      versionDep: 'eslint',
    },
    {
      tool: 'prettier',
      configs: [
        '.prettierrc',
        '.prettierrc.json',
        '.prettierrc.yaml',
        '.prettierrc.yml',
        '.prettierrc.js',
        '.prettierrc.toml',
      ],
      versionDep: 'prettier',
    },
    // TypeScript
    {
      tool: 'typescript',
      configs: ['tsconfig.json', 'jsconfig.json'],
      versionDep: 'typescript',
    },
    // Testing Frameworks
    {
      tool: 'jest',
      configs: [
        'jest.config.js',
        'jest.config.ts',
        'jest.config.json',
        'jest.config.mjs',
        'jest.config.cjs',
      ],
      versionDep: 'jest',
    },
    {
      tool: 'vitest',
      configs: ['vitest.config.ts', 'vitest.config.js', 'vitest.workspace.ts'],
      versionDep: 'vitest',
    },
    {
      tool: 'cypress',
      configs: ['cypress.config.js', 'cypress.config.ts'],
      versionDep: 'cypress',
    },
    {
      tool: 'playwright',
      configs: ['playwright.config.js', 'playwright.config.ts'],
      versionDep: '@playwright/test',
    },
    // Build Tools and Bundlers
    {
      tool: 'webpack',
      configs: [
        'webpack.config.js',
        'webpack.config.ts',
        'webpack.config.mjs',
        'webpack.config.cjs',
      ],
      versionDep: 'webpack',
    },
    {
      tool: 'vite',
      configs: ['vite.config.js', 'vite.config.ts'],
      versionDep: 'vite',
    },
    {
      tool: 'rollup',
      configs: ['rollup.config.js', 'rollup.config.ts'],
      versionDep: 'rollup',
    },
    {
      tool: 'next',
      configs: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
      versionDep: 'next',
    },
    {
      tool: 'nuxt',
      configs: ['nuxt.config.ts', 'nuxt.config.js'],
      versionDep: 'nuxt',
    },
    // CSS and Styling
    {
      tool: 'tailwind',
      configs: ['tailwind.config.js', 'tailwind.config.ts'],
      versionDep: 'tailwindcss',
    },
    {
      tool: 'postcss',
      configs: ['postcss.config.js', 'postcss.config.ts', 'postcss.config.mjs'],
      versionDep: 'postcss',
    },
    {
      tool: 'babel',
      configs: ['babel.config.js', 'babel.config.json', '.babelrc', '.babelrc.js'],
      versionDep: '@babel/core',
    },
  ];

  async detectTools(rootPath: string): Promise<DetectedTool[]> {
    const detectedTools: DetectedTool[] = [];
    const packageJson = this.loadPackageJson(rootPath);

    for (const toolConfig of this.TOOL_CONFIGS) {
      const tool = await this.detectSingleTool(rootPath, toolConfig, packageJson);
      if (tool) {
        detectedTools.push(tool);
      }
    }

    return detectedTools.sort((a, b) => a.priority - b.priority);
  }

  async detectConfigs(rootPath: string): Promise<ConfigFile[]> {
    const configFiles: ConfigFile[] = [];

    for (const toolConfig of this.TOOL_CONFIGS) {
      for (const configFile of toolConfig.configs) {
        const configPath = join(rootPath, configFile);
        if (existsSync(configPath)) {
          try {
            const configContent = this.parseConfigFile(configPath);
            configFiles.push({
              path: configPath,
              format: this.getConfigFormat(configFile),
              tool: toolConfig.tool,
              config: configContent,
            });
          } catch (error) {
            console.warn(`Failed to parse config file ${configPath}:`, error);
          }
        }
      }
    }

    return configFiles;
  }

  private async detectSingleTool(
    rootPath: string,
    toolConfig: { tool: string; configs: string[]; versionDep: string },
    packageJson: any
  ): Promise<DetectedTool | null> {
    const configPath = this.findConfigPath(rootPath, toolConfig.configs);
    if (!configPath) {
      return null;
    }

    try {
      const version = this.extractVersion(packageJson, toolConfig.versionDep);
      const configContent = this.parseConfigFile(configPath);

      return {
        name: toolConfig.tool,
        version: version || 'unknown',
        configPath,
        configFormat: this.getConfigFormat(basename(configPath)),
        enabled: true,
        priority: this.getToolPriority(toolConfig.tool),
        config: configContent,
      };
    } catch (error) {
      console.warn(`Failed to detect tool ${toolConfig.tool}:`, error);
      return null;
    }
  }

  private findConfigPath(rootPath: string, configFiles: string[]): string | null {
    for (const configFile of configFiles) {
      const configPath = join(rootPath, configFile);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    return null;
  }

  private parseConfigFile(configPath: string): Record<string, unknown> {
    const format = this.getConfigFormat(basename(configPath));

    switch (format) {
      case 'json':
        return fileUtils.readJsonSync(configPath);
      case 'js':
      case 'ts':
        // For JS/TS configs, we'd need to evaluate them
        // For now, return basic info
        return { _type: format, _path: configPath };
      case 'yaml':
        // For YAML configs, we'd need a YAML parser
        // For now, return basic info
        return { _type: format, _path: configPath };
      default:
        return { _type: 'unknown', _path: configPath };
    }
  }

  private getConfigFormat(filename: string): ConfigFile['format'] {
    const ext = extname(filename).toLowerCase();

    switch (ext) {
      case '.json':
        return 'json';
      case '.js':
        return 'js';
      case '.ts':
        return 'ts';
      case '.yaml':
      case '.yml':
        return 'yaml';
      default:
        if (filename.endsWith('.json')) return 'json';
        if (filename.endsWith('.js')) return 'js';
        if (filename.endsWith('.ts')) return 'ts';
        if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml';
        return 'json'; // default
    }
  }

  private extractVersion(packageJson: any, depName: string): string | null {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
      ...packageJson.optionalDependencies,
    };

    return allDeps[depName] || null;
  }

  private getToolPriority(toolName: string): number {
    const priorities: Record<string, number> = {
      typescript: 1,
      eslint: 2,
      prettier: 3,
      jest: 4,
      vitest: 4,
      webpack: 5,
      vite: 5,
      rollup: 5,
      next: 6,
      nuxt: 6,
      tailwind: 7,
      postcss: 7,
      babel: 8,
      cypress: 9,
      playwright: 9,
    };

    return priorities[toolName] || 99;
  }

  private loadPackageJson(rootPath: string): any {
    const packageJsonPath = join(rootPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return {};
    }

    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (error) {
      console.warn(`Failed to load package.json:`, error);
      return {};
    }
  }
}
