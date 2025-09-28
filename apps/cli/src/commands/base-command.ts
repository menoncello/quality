import { CommandOptions, ProjectConfiguration } from '@dev-quality/types';

export abstract class BaseCommand {
  protected options: CommandOptions;
  protected config: ProjectConfiguration | null = null;

  constructor(options: CommandOptions) {
    this.options = options;
  }

  abstract execute(): Promise<void>;

  protected async loadConfig(_configPath?: string): Promise<ProjectConfiguration> {
    throw new Error('loadConfig must be implemented by subclass');
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    if (this.options.quiet && level !== 'error') {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? 'ERROR' : level === 'warn' ? 'WARN' : 'INFO';

    console.log(`[${timestamp}] ${prefix}: ${message}`);
  }

  protected logVerbose(message: string): void {
    if (this.options.verbose) {
      this.log(message);
    }
  }

  protected formatOutput(data: unknown): string {
    if (this.options.json) {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  }
}
