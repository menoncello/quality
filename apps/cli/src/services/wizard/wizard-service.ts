import { AutoConfigurationDetectionEngine, DetectionResult } from '@dev-quality/core';
import { ProjectConfiguration } from '@dev-quality/types';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export interface WizardContext {
  projectPath: string;
  detectionResult?: DetectionResult;
  configuration?: ProjectConfiguration;
  generatedFiles: string[];
  backupMetadata?: BackupMetadata;
}

export interface BackupMetadata {
  timestamp: Date;
  files: Array<{ path: string; originalContent: string }>;
  wizardStep: string;
}

export class WizardService {
  private context: WizardContext;
  private detectionEngine: AutoConfigurationDetectionEngine;

  constructor(projectPath: string) {
    this.context = {
      projectPath: path.resolve(projectPath),
      generatedFiles: [],
    };
    this.detectionEngine = new AutoConfigurationDetectionEngine();
  }

  async detectProject(): Promise<DetectionResult> {
    try {
      const detectionResult = await this.detectionEngine.detectAll(this.context.projectPath);
      this.context.detectionResult = detectionResult;
      return detectionResult;
    } catch (error) {
      throw new Error(
        `Failed to detect project configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getDetectionResult(): DetectionResult | undefined {
    return this.context.detectionResult;
  }

  getContext(): WizardContext {
    return { ...this.context };
  }

  addGeneratedFile(filePath: string): void {
    const absolutePath = path.resolve(this.context.projectPath, filePath);
    if (!this.context.generatedFiles.includes(absolutePath)) {
      this.context.generatedFiles.push(absolutePath);
    }
  }

  getGeneratedFiles(): string[] {
    return [...this.context.generatedFiles];
  }

  setBackupMetadata(metadata: BackupMetadata): void {
    this.context.backupMetadata = metadata;
  }

  getBackupMetadata(): BackupMetadata | undefined {
    return this.context.backupMetadata;
  }

  hasExistingConfig(configFileName: string): boolean {
    const configPath = path.resolve(this.context.projectPath, configFileName);
    return existsSync(configPath);
  }

  getConfigPath(configFileName: string): string {
    return path.resolve(this.context.projectPath, configFileName);
  }

  createProjectConfiguration(): ProjectConfiguration {
    const detectionResult = this.context.detectionResult;

    if (!detectionResult) {
      throw new Error('Detection result not available. Run detectProject() first.');
    }

    const configuration: ProjectConfiguration = {
      name: detectionResult.project.name,
      version: detectionResult.project.version,
      description: detectionResult.project.description,
      type: detectionResult.project.type,
      frameworks: detectionResult.project.frameworks,
      tools: detectionResult.tools.map(tool => ({
        name: tool.name,
        version: tool.version,
        enabled: tool.enabled,
        config: tool.config,
        priority: tool.priority,
      })),
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

    this.context.configuration = configuration;
    return configuration;
  }

  getProjectConfiguration(): ProjectConfiguration | undefined {
    return this.context.configuration;
  }

  reset(): void {
    this.context = {
      projectPath: this.context.projectPath,
      generatedFiles: [],
    };
  }
}
