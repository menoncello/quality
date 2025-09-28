import { BaseCommand } from './base-command';
import { CommandOptions } from '@dev-quality/types';

export interface ExportOptions {
  input?: string;
  output?: string;
  format?: string;
}

export class ExportCommand extends BaseCommand {
  constructor(options: ExportOptions & CommandOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    this.log('Export functionality will be implemented in a future version.');
  }

  protected override async loadConfig(_configPath?: string): Promise<any> {
    throw new Error('Export command does not load configuration');
  }
}
