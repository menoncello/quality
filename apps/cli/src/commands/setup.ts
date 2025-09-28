import { BaseCommand } from './base-command';
import { ProjectConfiguration, ToolConfiguration, CommandOptions } from '@dev-quality/types';
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

    const configPath = this.options.config || '.dev-quality.json';

    if (existsSync(configPath) && !this.setupOptions.force) {
      this.log('Configuration file already exists. Use --force to overwrite.');
      return;
    }

    const config = await this.createConfiguration();

    if (this.setupOptions.interactive) {
      await this.interactiveSetup(config);
    }

    this.saveConfiguration(config, configPath);
    this.log('DevQuality CLI setup completed successfully!');
  }

  private async createConfiguration(): Promise<ProjectConfiguration> {
    const packageJsonPath = pathUtils.getConfigPath('package.json');

    let projectName = 'my-project';
    let projectVersion = '1.0.0';
    let projectDescription = 'A project analyzed by DevQuality';
    let projectType: ProjectConfiguration['type'] = 'backend';

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = fileUtils.readJsonSync<any>(packageJsonPath);
        projectName = packageJson.name || projectName;
        projectVersion = packageJson.version || projectVersion;
        projectDescription = packageJson.description || projectDescription;

        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
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

  private async interactiveSetup(_config: ProjectConfiguration): Promise<void> {
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

  protected override async loadConfig(configPath?: string): Promise<ProjectConfiguration> {
    const path = configPath || this.options.config || '.dev-quality.json';

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
