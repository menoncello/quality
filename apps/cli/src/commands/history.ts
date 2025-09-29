import { BaseCommand } from './base-command';
import { CommandOptions, ProjectConfiguration } from '@dev-quality/types';

export interface HistoryOptions {
  limit?: string;
  plot?: boolean;
}

export class HistoryCommand extends BaseCommand {
  constructor(options: HistoryOptions & CommandOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    this.log('History functionality will be implemented in a future version.');
  }

  protected override async loadConfig(): Promise<ProjectConfiguration> {
    throw new Error('History command does not load configuration');
  }
}
