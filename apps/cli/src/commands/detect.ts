import { BaseCommand } from './base-command';
import { CommandOptions } from '@dev-quality/types';
import {
  AutoConfigurationDetectionEngine,
  type DetectionResult,
  type DetectedTool,
  type DependencyInfo,
} from '@dev-quality/core';

export interface DetectOptions extends CommandOptions {
  format?: 'json' | 'table';
  detailed?: boolean;
}

export class DetectCommand extends BaseCommand {
  constructor(options: DetectOptions) {
    super(options);
  }

  private get detectOptions(): DetectOptions {
    return this.options as DetectOptions;
  }

  async execute(): Promise<void> {
    const detectionEngine = new AutoConfigurationDetectionEngine();
    const rootPath = process.cwd();

    try {
      this.log('🔍 Detecting project configuration...');

      const result = await detectionEngine.detectAll(rootPath);

      if (this.detectOptions.format === 'json') {
        this.log(JSON.stringify(result, null, 2));
      } else {
        this.displayDetectionResult(result, this.detectOptions.detailed);
      }

      if (result.issues.length > 0) {
        this.log('\n⚠️  Issues Found:');
        result.issues.forEach((issue: string) => {
          this.log(`   • ${issue}`);
        });
      }

      if (result.recommendations.length > 0) {
        this.log('\n💡 Recommendations:');
        result.recommendations.forEach((rec: string) => {
          this.log(`   • ${rec}`);
        });
      }
    } catch (error) {
      this.log(`❌ Detection failed: ${error}`);
      process.exit(1);
    }
  }

  private displayDetectionResult(result: DetectionResult, detailed: boolean = false) {
    this.log('\n📊 Project Detection Results');
    this.log('═'.repeat(50));

    // Project Info
    this.log(`\n🏗️  Project: ${result.project.name} v${result.project.version}`);
    this.log(`   Type: ${result.project.type}`);
    this.log(`   Frameworks: ${result.project.frameworks.join(', ') ?? 'None detected'}`);
    this.log(`   Build Systems: ${result.project.buildSystems.join(', ') ?? 'None detected'}`);
    this.log(`   Package Manager: ${result.project.packageManager}`);
    this.log(`   TypeScript: ${result.project.hasTypeScript ? '✅' : '❌'}`);
    this.log(`   Tests: ${result.project.hasTests ? '✅' : '❌'}`);

    // Structure Info
    if (detailed) {
      this.log(`\n📁 Structure:`);
      this.log(`   Monorepo: ${result.structure.isMonorepo ? '✅' : '❌'}`);
      if (result.structure.workspaceType) {
        this.log(`   Workspace Type: ${result.structure.workspaceType}`);
      }
      this.log(`   Complexity: ${result.structure.complexity}`);
      this.log(`   Source Dirs: ${result.structure.sourceDirectories.join(', ')}`);
      this.log(`   Test Dirs: ${result.structure.testDirectories.join(', ')}`);
      this.log(`   Config Dirs: ${result.structure.configDirectories.join(', ')}`);
    }

    // Tools
    this.log(`\n🛠️  Detected Tools (${result.tools.length}):`);
    if (result.tools.length > 0) {
      result.tools.forEach((tool: DetectedTool) => {
        this.log(`   • ${tool.name} v${tool.version} (${tool.configFormat})`);
      });
    } else {
      this.log('   No tools detected');
    }

    // Dependencies Summary
    if (detailed) {
      this.log(`\n📦 Dependencies (${result.dependencies.length}):`);
      const depTypes = result.dependencies.reduce(
        (acc: Record<string, number>, dep: DependencyInfo) => {
          acc[dep.type] = (acc[dep.type] ?? 0) + 1;
          return acc;
        },
        {}
      );

      Object.entries(depTypes).forEach(([type, count]) => {
        this.log(`   ${type}: ${count}`);
      });

      // Compatibility
      const compatibility = result.dependencies.reduce(
        (acc: Record<string, number>, dep: DependencyInfo) => {
          acc[dep.compatibility] = (acc[dep.compatibility] ?? 0) + 1;
          return acc;
        },
        {}
      );

      this.log(`\n🔍 Compatibility:`);
      Object.entries(compatibility).forEach(([status, count]) => {
        const icon = status === 'compatible' ? '✅' : status === 'incompatible' ? '❌' : '❓';
        this.log(`   ${icon} ${status}: ${count}`);
      });
    }

    this.log(`\n⏰  Detected at: ${new Date(result.timestamp).toLocaleString()}`);
  }
}
