import { BaseCommand } from './base-command';
import { ProjectConfiguration, CommandOptions } from '@dev-quality/types';
import { fileUtils } from '@dev-quality/utils';

export interface ConfigOptions {
  show?: boolean;
  edit?: boolean;
  reset?: boolean;
}

export class ConfigCommand extends BaseCommand {
  constructor(options: CommandOptions & ConfigOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    const configOptions = this.options as ConfigOptions & CommandOptions;
    if (configOptions.show) {
      await this.showConfig();
    } else if (configOptions.edit) {
      await this.editConfig();
    } else if (configOptions.reset) {
      await this.resetConfig();
    } else {
      await this.showConfig();
    }
  }

  private async showConfig(): Promise<void> {
    try {
      const config = await this.loadConfig();
      this.log('Current configuration:');
      process.stdout.write(this.formatOutput(config));
    } catch {
      this.log(`No configuration found. Run 'dev-quality setup' to create one.`, 'warn');
    }
  }

  private async editConfig(): Promise<void> {
    this.log('Edit configuration - opening in default editor...');
    this.log('This feature will be implemented in a future version.');
  }

  private async resetConfig(): Promise<void> {
    const configPath = this.options.config ?? '.dev-quality.json';

    this.log('Resetting configuration to defaults...');

    const defaultConfig: ProjectConfiguration = {
      name: 'my-project',
      version: '1.0.0',
      description: 'A project analyzed by DevQuality',
      type: 'backend',
      frameworks: [],
      tools: [
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

    try {
      fileUtils.writeJsonSync(configPath, defaultConfig);
      this.log(`Configuration reset and saved to: ${configPath}`);
    } catch (error) {
      throw new Error(`Failed to reset configuration: ${error}`);
    }
  }

  protected override async loadConfig(): Promise<ProjectConfiguration> {
    const path = this.options.config ?? '.dev-quality.json';

    try {
      const config = fileUtils.readJsonSync<ProjectConfiguration>(path);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}
