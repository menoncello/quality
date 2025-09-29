import { BaseCommand } from './base-command';
import { ProjectConfiguration, ToolConfiguration, CommandOptions } from '@dev-quality/types';
import { AutoConfigurationDetectionEngine, type DetectedTool } from '@dev-quality/core';
import { fileUtils, pathUtils } from '@dev-quality/utils';
import { writeFileSync, existsSync } from 'node:fs';

export interface SetupOptions {
  force?: boolean;
  interactive?: boolean;
}

export class SetupCommand extends BaseCommand {
  constructor(options: SetupOptions & CommandOptions) {
    super(options);
  }

  private get setupOptions(): SetupOptions {
    return this.options as SetupOptions & CommandOptions;
  }

  async execute(): Promise<void> {
    this.log('Setting up DevQuality CLI...');

    const configPath = this.options.config ?? '.dev-quality.json';

    if (existsSync(configPath) && !this.setupOptions.force) {
      this.log('Configuration file already exists. Use --force to overwrite.');
      return;
    }

    const config = await this.createConfiguration();

    if (this.setupOptions.interactive) {
      await this.interactiveSetup();
    }

    this.saveConfiguration(config, configPath);
    this.log('DevQuality CLI setup completed successfully!');
  }

  private async createConfiguration(): Promise<ProjectConfiguration> {
    const detectionEngine = new AutoConfigurationDetectionEngine();
    const rootPath = process.cwd();

    try {
      this.log('Auto-detecting project configuration...');

      const detectionResult = await detectionEngine.detectAll(rootPath);

      this.log(
        `Detected project: ${detectionResult.project.name} (${detectionResult.project.type})`
      );
      this.log(
        `Found ${detectionResult.tools.length} tools and ${detectionResult.dependencies.length} dependencies`
      );

      // Convert detected tools to tool configurations
      const tools: ToolConfiguration[] = detectionResult.tools.map((tool: DetectedTool) => ({
        name: tool.name,
        version: tool.version,
        enabled: tool.enabled,
        config: tool.config,
        priority: tool.priority,
      }));

      // Add default tools if none detected
      if (tools.length === 0) {
        tools.push(...this.getDefaultTools());
      }

      return {
        name: detectionResult.project.name,
        version: detectionResult.project.version,
        description: detectionResult.project.description,
        type: detectionResult.project.type,
        frameworks: detectionResult.project.frameworks,
        tools,
        paths: {
          source: detectionResult.structure.sourceDirectories[0] ?? './src',
          tests: detectionResult.structure.testDirectories[0] ?? './tests',
          config: detectionResult.structure.configDirectories[0] ?? './configs',
          output: './output',
        },
        settings: {
          verbose: false,
          quiet: false,
          json: false,
          cache: true,
        },
      };
    } catch (error) {
      this.log(`Auto-detection failed: ${error}. Using default configuration.`);
      return this.createDefaultConfiguration();
    }
  }

  private createDefaultConfiguration(): ProjectConfiguration {
    const packageJsonPath = pathUtils.getConfigPath('package.json');

    let projectName = 'my-project';
    let projectVersion = '1.0.0';
    let projectDescription = 'A project analyzed by DevQuality';
    let projectType: ProjectConfiguration['type'] = 'backend';

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = fileUtils.readJsonSync<{
          name?: string;
          version?: string;
          description?: string;
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
          workspaces?: string[] | { packages: string[] };
        }>(packageJsonPath);
        projectName = packageJson.name ?? projectName;
        projectVersion = packageJson.version ?? projectVersion;
        projectDescription = packageJson.description ?? projectDescription;

        if (packageJson.dependencies?.['react'] || packageJson.devDependencies?.['react']) {
          projectType = 'frontend';
        } else if (packageJson.workspaces) {
          projectType = 'monorepo';
        }
      } catch (error) {
        this.logVerbose(`Could not read package.json: ${error}`);
      }
    }

    return {
      name: projectName,
      version: projectVersion,
      description: projectDescription,
      type: projectType,
      frameworks: [],
      tools: this.getDefaultTools(),
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
  }

  private getDefaultTools(): ToolConfiguration[] {
    return [
      {
        name: 'typescript',
        version: '5.3.3',
        enabled: true,
        config: {},
        priority: 1,
      },
      {
        name: 'eslint',
        version: 'latest',
        enabled: true,
        config: {},
        priority: 2,
      },
      {
        name: 'prettier',
        version: 'latest',
        enabled: true,
        config: {},
        priority: 3,
      },
    ];
  }

  private async interactiveSetup(): Promise<void> {
    this.log('Interactive setup mode - coming soon!');
    this.log('For now, using default configuration.');
  }

  private saveConfiguration(config: ProjectConfiguration, configPath: string): void {
    try {
      const content = JSON.stringify(config, null, 2);
      writeFileSync(configPath, content, 'utf-8');
      this.log(`Configuration saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  protected override async loadConfig(): Promise<ProjectConfiguration> {
    const path = this.options.config ?? '.dev-quality.json';

    if (!existsSync(path)) {
      throw new Error(`Configuration file not found: ${path}`);
    }

    try {
      const config = fileUtils.readJsonSync<ProjectConfiguration>(path);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}
