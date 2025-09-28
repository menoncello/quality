import { BaseCommand } from './base-command';
import { AnalysisResult, CommandOptions } from '@dev-quality/types';

export interface AnalyzeOptions {
  tools?: string;
  output?: string;
  format?: string;
  failOnError?: boolean;
  quick?: boolean;
}

export class AnalyzeCommand extends BaseCommand {
  constructor(options: CommandOptions & AnalyzeOptions) {
    super(options);
  }

  async execute(): Promise<void> {
    this.log('Starting code quality analysis...');

    try {
      const config = await this.loadConfig();
      const toolsToRun = this.getToolsToRun(config);

      if (toolsToRun.length === 0) {
        this.log('No tools configured or enabled for analysis.', 'warn');
        return;
      }

      this.log(`Running analysis with tools: ${toolsToRun.join(', ')}`);

      const results: AnalysisResult[] = [];

      for (const toolName of toolsToRun) {
        this.logVerbose(`Running ${toolName} analysis...`);

        try {
          const result = await this.runToolAnalysis(toolName);
          results.push(result);

          if (result.success) {
            this.log(`${toolName} analysis completed successfully`);
          } else {
            this.log(`${toolName} analysis failed`, 'warn');
          }
        } catch (error) {
          this.log(`${toolName} analysis error: ${error}`, 'error');

          results.push({
            tool: toolName,
            success: false,
            data: { error: error instanceof Error ? error.message : String(error) },
            timestamp: new Date().toISOString(),
            duration: 0
          });

          if ((this.options as AnalyzeOptions & CommandOptions).failOnError) {
            throw new Error(`Analysis failed for tool: ${toolName}`);
          }
        }
      }

      await this.outputResults(results);

      const summary = this.generateSummary(results);
      this.log(`Analysis completed: ${summary}`);

    } catch (error) {
      this.log(`Analysis failed: ${error instanceof Error ? error.message : error}`, 'error');
      throw error;
    }
  }

  private getToolsToRun(config: any): string[] {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;
    if (analyzeOptions.tools) {
      return analyzeOptions.tools.split(',').map(tool => tool.trim());
    }

    return config.tools
      ?.filter((tool: any) => tool.enabled)
      ?.map((tool: any) => tool.name)
      ?.sort((a: string, b: string) => {
        const toolA = config.tools.find((t: any) => t.name === a);
        const toolB = config.tools.find((t: any) => t.name === b);
        return (toolA?.priority || 999) - (toolB?.priority || 999);
      }) || [];
  }

  private async runToolAnalysis(toolName: string): Promise<AnalysisResult> {
    const startTime = Date.now();

    this.logVerbose(`Simulating ${toolName} analysis...`);

    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const success = Math.random() > 0.2;

    const result: AnalysisResult = {
      tool: toolName,
      success,
      data: {
        issues: success ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 20) + 10,
        warnings: success ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 15) + 5,
        suggestions: Math.floor(Math.random() * 8),
        filesAnalyzed: Math.floor(Math.random() * 100) + 10
      },
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime
    };

    return result;
  }

  private async outputResults(results: AnalysisResult[]): Promise<void> {
    const analyzeOptions = this.options as AnalyzeOptions & CommandOptions;
    if (analyzeOptions.output) {
      const { writeFileSync } = await import('node:fs');
      const content = this.formatOutput(results);
      writeFileSync(analyzeOptions.output, content, 'utf-8');
      this.log(`Results saved to: ${analyzeOptions.output}`);
    } else {
      console.log(this.formatOutput(results));
    }
  }

  private generateSummary(results: AnalysisResult[]): string {
    const total = results.length;
    const passed = results.filter(r => r.success).length;
    const failed = total - passed;

    return `${passed}/${total} tools passed, ${failed} failed`;
  }

  protected override async loadConfig(configPath?: string): Promise<any> {
    const path = configPath || this.options.config || '.dev-quality.json';

    try {
      const { readFileSync } = await import('node:fs');
      const content = readFileSync(path, 'utf-8');
      const config = JSON.parse(content);
      this.config = config;
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }
}