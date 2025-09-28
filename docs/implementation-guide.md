# DevQuality CLI Implementation Guide

## Overview

This guide provides comprehensive implementation instructions for building the DevQuality CLI MVP. It includes setup instructions, coding standards, development workflow, and deployment procedures.

---

## Prerequisites

### Required Tools

- **Bun**: >= 1.0.0 (JavaScript runtime and package manager)
- **Node.js**: >= 18.0.0 (fallback runtime)
- **Git**: >= 2.0.0 (version control)

### Optional Development Tools

- **VS Code**: Code editor with TypeScript support
- **Docker**: >= 20.0.0 (for testing environments)
- **GitHub CLI**: For repository management

---

## Project Setup

### 1. Repository Initialization

```bash
# Create project directory
mkdir dev-quality-cli
cd dev-quality-cli

# Initialize git repository
git init
git commit --allow-empty -m "Initial commit"

# Create basic structure
mkdir -p src/{cli,config,analysis,tools,reporting,utils,types}
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs
```

### 2. Package Configuration

**package.json:**

```json
{
  "name": "dev-quality-cli",
  "version": "1.0.0",
  "description": "CLI tool for unified code quality analysis",
  "main": "dist/index.js",
  "bin": {
    "dev-quality": "dist/index.js"
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir=dist --target=node",
    "dev": "bun run src/index.ts",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "lint": "bunx eslint src/ --fix",
    "format": "bunx prettier --write src/",
    "typecheck": "bunx tsc --noEmit",
    "prepare": "husky install"
  },
  "keywords": ["cli", "quality", "eslint", "prettier", "testing"],
  "author": "DevQuality Team",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0",
    "bun": ">=1.0.0"
  },
  "files": ["dist/", "README.md", "LICENSE"],
  "devDependencies": {
    "@types/node": "^20.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "ink": "^4.0.0",
    "sqlite": "^5.1.0",
    "chalk": "^5.3.0"
  }
}
```

### 3. TypeScript Configuration

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### 4. ESLint Configuration

**eslint.config.js:**

```javascript
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-console": "warn",
      "prefer-const": "error"
    }
  },
  {
    ignores: ["dist/", "node_modules/", "coverage/"]
  }
];
```

### 5. Prettier Configuration

**.prettierrc:**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

---

## Core Implementation

### 1. Main Entry Point

**src/index.ts:**

```typescript
#!/usr/bin/env node

import { program } from "commander";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

// ESM compatibility
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CLI setup
program
  .name("dev-quality")
  .description("CLI tool for unified code quality analysis")
  .version("1.0.0");

// Import commands
import setupCommand from "./cli/commands/setup.js";
import analyzeCommand from "./cli/commands/analyze.js";
import configCommand from "./cli/commands/config.js";
import reportCommand from "./cli/commands/report.js";

// Register commands
program.addCommand(setupCommand);
program.addCommand(analyzeCommand);
program.addCommand(configCommand);
program.addCommand(reportCommand);

// Default command
program.action(() => {
  program.outputHelp();
});

// Error handling
program.on("command:*", operands => {
  console.error(`Unknown command: ${operands[0]}`);
  program.outputHelp();
  process.exit(1);
});

// Execute
program.parse();
```

### 2. Type Definitions

**src/types/index.ts:**

```typescript
// Core types
export interface ProjectConfig {
  project: {
    type: "javascript" | "typescript" | "react" | "node";
    path: string;
  };
  tools: {
    eslint: {
      enabled: boolean;
      configPath?: string;
      rules?: Record<string, any>;
    };
    prettier: {
      enabled: boolean;
      configPath?: string;
      rules?: Record<string, any>;
    };
    bunTest: {
      enabled: boolean;
      configPath?: string;
      coverage?: {
        enabled: boolean;
        threshold: number;
      };
    };
  };
  analysis: {
    includePatterns: string[];
    excludePatterns: string[];
    cacheEnabled: boolean;
  };
  reporting: {
    format: "json" | "markdown" | "html";
    outputPath?: string;
  };
}

export interface AnalysisResult {
  id: string;
  timestamp: Date;
  duration: number;
  projectPath: string;
  overallScore: number;
  toolResults: ToolResult[];
  summary: {
    totalIssues: number;
    errorCount: number;
    warningCount: number;
    infoCount: number;
    coverage?: {
      line: number;
      branch: number;
      function: number;
    };
  };
}

export interface ToolResult {
  toolName: string;
  executionTime: number;
  status: "success" | "error" | "warning";
  issues: Issue[];
  metrics: Record<string, any>;
  coverage?: CoverageData;
}

export interface Issue {
  id: string;
  type: "error" | "warning" | "info";
  toolName: string;
  filePath: string;
  lineNumber: number;
  message: string;
  ruleId?: string;
  fixable: boolean;
  suggestion?: string;
  severity: number; // 1-10 score
}

export interface CoverageData {
  line: number;
  branch: number;
  function: number;
  files: {
    [filePath: string]: {
      line: number;
      branch: number;
      function: number;
    };
  };
}

export interface AnalysisOptions {
  quickMode?: boolean;
  jsonOutput?: boolean;
  outputPath?: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  cacheEnabled?: boolean;
}
```

### 3. Configuration Manager

**src/config/manager.ts:**

```typescript
import fs from "fs/promises";
import path from "path";
import { validate } from "./validator.js";
import { getDefaultConfig } from "./defaults.js";
import { ProjectConfig } from "@/types/index.js";
import { ProjectDetector } from "./detector.js";

export class ConfigManager {
  private configPath: string;
  private config: ProjectConfig | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.configPath = path.join(projectPath, "dev-quality.config.json");
  }

  async loadConfig(): Promise<ProjectConfig> {
    try {
      // Try to load existing config
      const configData = await fs.readFile(this.configPath, "utf-8");
      const parsedConfig = JSON.parse(configData);

      // Validate configuration
      const isValid = validate(parsedConfig);
      if (!isValid) {
        throw new Error("Invalid configuration file");
      }

      this.config = parsedConfig;
      return this.config;
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        // Config doesn't exist, create default
        return await this.createDefaultConfig();
      }
      throw error;
    }
  }

  async saveConfig(config: ProjectConfig): Promise<void> {
    const isValid = validate(config);
    if (!isValid) {
      throw new Error("Invalid configuration");
    }

    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    this.config = config;
  }

  private async createDefaultConfig(): Promise<ProjectConfig> {
    const detector = new ProjectDetector();
    const projectType = await detector.detectProjectType();
    const defaultConfig = getDefaultConfig(projectType);

    await this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  getConfig(): ProjectConfig | null {
    return this.config;
  }

  async updateConfig(updates: Partial<ProjectConfig>): Promise<ProjectConfig> {
    const currentConfig = await this.loadConfig();
    const updatedConfig = { ...currentConfig, ...updates };

    await this.saveConfig(updatedConfig);
    return updatedConfig;
  }
}
```

### 4. Analysis Engine

**src/analysis/engine.ts:**

```typescript
import { EventEmitter } from "events";
import { SimpleCache } from "./cache.js";
import { ESLintRunner } from "../tools/eslint.js";
import { PrettierRunner } from "../tools/prettier.js";
import { BunTestRunner } from "../tools/bun-test.js";
import {
  AnalysisResult,
  ToolResult,
  AnalysisOptions,
  ProjectConfig
} from "@/types/index.js";

export class AnalysisEngine extends EventEmitter {
  private cache: SimpleCache;
  private eslintRunner: ESLintRunner;
  private prettierRunner: PrettierRunner;
  private bunTestRunner: BunTestRunner;

  constructor() {
    super();
    this.cache = new SimpleCache();
    this.eslintRunner = new ESLintRunner();
    this.prettierRunner = new PrettierRunner();
    this.bunTestRunner = new BunTestRunner();
  }

  async analyze(
    config: ProjectConfig,
    options: AnalysisOptions = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    this.emit("analysis:start", { analysisId, config, options });

    const results: ToolResult[] = [];

    try {
      // Execute tools sequentially
      if (config.tools.eslint.enabled) {
        const result = await this.runTool("eslint", () =>
          this.eslintRunner.execute(config, options)
        );
        results.push(result);
      }

      if (config.tools.prettier.enabled) {
        const result = await this.runTool("prettier", () =>
          this.prettierRunner.execute(config, options)
        );
        results.push(result);
      }

      if (config.tools.bunTest.enabled) {
        const result = await this.runTool("bun-test", () =>
          this.bunTestRunner.execute(config, options)
        );
        results.push(result);
      }

      // Aggregate results
      const analysisResult = this.aggregateResults(
        analysisId,
        results,
        Date.now() - startTime,
        config.project.path
      );

      this.emit("analysis:complete", analysisResult);
      return analysisResult;
    } catch (error) {
      this.emit("analysis:error", { analysisId, error });
      throw error;
    }
  }

  private async runTool(
    toolName: string,
    execute: () => Promise<ToolResult>
  ): Promise<ToolResult> {
    const cacheKey = `${toolName}:${Date.now()}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Execute tool
    this.emit("tool:start", { toolName });
    const result = await execute();
    this.emit("tool:complete", { toolName, result });

    // Cache result
    await this.cache.set(cacheKey, result, 300000); // 5 minutes

    return result;
  }

  private aggregateResults(
    analysisId: string,
    toolResults: ToolResult[],
    duration: number,
    projectPath: string
  ): AnalysisResult {
    const summary = this.calculateSummary(toolResults);
    const overallScore = this.calculateOverallScore(toolResults);

    return {
      id: analysisId,
      timestamp: new Date(),
      duration,
      projectPath,
      overallScore,
      toolResults,
      summary
    };
  }

  private calculateSummary(toolResults: ToolResult[]) {
    let totalIssues = 0;
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let coverage: any = undefined;

    for (const result of toolResults) {
      totalIssues += result.issues.length;
      errorCount += result.issues.filter(i => i.type === "error").length;
      warningCount += result.issues.filter(i => i.type === "warning").length;
      infoCount += result.issues.filter(i => i.type === "info").length;

      if (result.coverage) {
        coverage = result.coverage;
      }
    }

    return {
      totalIssues,
      errorCount,
      warningCount,
      infoCount,
      coverage
    };
  }

  private calculateOverallScore(toolResults: ToolResult[]): number {
    // Simple scoring based on issues and tool status
    let score = 100;

    for (const result of toolResults) {
      // Deduct points for errors and warnings
      score -= result.issues.filter(i => i.type === "error").length * 5;
      score -= result.issues.filter(i => i.type === "warning").length * 2;
      score -= result.issues.filter(i => i.type === "info").length * 1;

      // Deduct for failed tools
      if (result.status === "error") score -= 20;
      if (result.status === "warning") score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private generateAnalysisId(): string {
    return `analysis_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }
}
```

### 5. Tool Runner Example

**src/tools/eslint.ts:**

```typescript
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import {
  ToolResult,
  AnalysisOptions,
  ProjectConfig,
  Issue
} from "@/types/index.js";

const execAsync = promisify(exec);

export class ESLintRunner {
  async execute(
    config: ProjectConfig,
    options: AnalysisOptions = {}
  ): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const eslintConfig = config.tools.eslint;
      const projectPath = config.project.path;

      // Build ESLint command
      const eslintArgs = ["npx eslint", "--format=json", "--max-warnings=0"];

      // Add config file if specified
      if (eslintConfig.configPath) {
        eslintArgs.push(`--config ${eslintConfig.configPath}`);
      }

      // Add file patterns
      const patterns = options.includePatterns || ["src/**/*.{js,ts,jsx,tsx}"];
      eslintArgs.push(patterns.join(" "));

      // Execute ESLint
      const { stdout, stderr } = await execAsync(eslintArgs.join(" "), {
        cwd: projectPath,
        timeout: 30000 // 30 seconds timeout
      });

      // Parse results
      const issues = this.parseESLintOutput(stdout);

      return {
        toolName: "eslint",
        executionTime: Date.now() - startTime,
        status: issues.length > 0 ? "warning" : "success",
        issues,
        metrics: {
          filesChecked: this.extractFileCount(stdout),
          rulesExecuted: this.extractRuleCount(stdout)
        }
      };
    } catch (error) {
      return {
        toolName: "eslint",
        executionTime: Date.now() - startTime,
        status: "error",
        issues: [
          {
            id: "eslint-execution-error",
            type: "error",
            toolName: "eslint",
            filePath: "",
            lineNumber: 0,
            message: error.message,
            fixable: false,
            severity: 10
          }
        ],
        metrics: {}
      };
    }
  }

  private parseESLintOutput(output: string): Issue[] {
    try {
      const results = JSON.parse(output);
      const issues: Issue[] = [];

      for (const result of results) {
        const filePath = result.filePath;

        for (const message of result.messages) {
          issues.push({
            id: `eslint_${filePath}_${message.line}_${message.column}`,
            type: message.severity === 2 ? "error" : "warning",
            toolName: "eslint",
            filePath,
            lineNumber: message.line,
            message: message.message,
            ruleId: message.ruleId,
            fixable: message.fix !== undefined,
            suggestion: message.fix
              ? this.generateSuggestion(message)
              : undefined,
            severity: message.severity === 2 ? 8 : 4
          });
        }
      }

      return issues;
    } catch {
      return [];
    }
  }

  private generateSuggestion(message: any): string {
    if (message.fix && message.fix.text) {
      return `Consider: ${message.fix.text}`;
    }
    return undefined;
  }

  private extractFileCount(output: string): number {
    try {
      const results = JSON.parse(output);
      return results.length;
    } catch {
      return 0;
    }
  }

  private extractRuleCount(output: string): number {
    try {
      const results = JSON.parse(output);
      const rules = new Set<string>();

      for (const result of results) {
        for (const message of result.messages) {
          if (message.ruleId) {
            rules.add(message.ruleId);
          }
        }
      }

      return rules.size;
    } catch {
      return 0;
    }
  }
}
```

---

## CLI Commands Implementation

### 1. Setup Command

**src/cli/commands/setup.ts:**

```typescript
import { Command } from "commander";
import { ConfigManager } from "@/config/manager.js";
import { ProjectDetector } from "@/config/detector.js";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default new Command("setup")
  .description("Interactive setup wizard for DevQuality CLI")
  .option("-y, --yes", "Accept all defaults")
  .option("-f, --force", "Force overwrite existing configuration")
  .action(async options => {
    console.log("🚀 DevQuality CLI Setup");
    console.log("============================\n");

    try {
      const configManager = new ConfigManager();
      const detector = new ProjectDetector();

      // Detect project type
      console.log("🔍 Detecting project type...");
      const projectType = await detector.detectProjectType();
      console.log(`✅ Detected: ${projectType}\n`);

      // Check for existing config
      try {
        await configManager.loadConfig();
        if (!options.force) {
          console.log("⚠️  Configuration already exists.");
          console.log("   Use --force to overwrite.");
          return;
        }
      } catch {
        // No existing config, continue
      }

      // Create default configuration
      console.log("⚙️  Creating configuration...");
      await configManager.createDefaultConfig();
      console.log("✅ Configuration created successfully\n");

      // Verify tools availability
      console.log("🔧 Verifying tools...");
      await verifyTools();
      console.log("✅ All tools verified\n");

      // Success message
      console.log("🎉 Setup complete!");
      console.log("\nNext steps:");
      console.log('  • Run "dev-quality" to start analysis');
      console.log('  • Run "dev-quality --help" for all commands');
      console.log("  • Edit dev-quality.config.json to customize settings");
    } catch (error) {
      console.error("❌ Setup failed:", error.message);
      process.exit(1);
    }
  });

async function verifyTools(): Promise<void> {
  const tools = [
    { name: "ESLint", command: "npx eslint --version" },
    { name: "Prettier", command: "npx prettier --version" },
    { name: "Bun", command: "bun --version" }
  ];

  for (const tool of tools) {
    try {
      const { exec } = require("child_process");
      const { promisify } = require("util");
      const execAsync = promisify(exec);

      await execAsync(tool.command, { timeout: 5000 });
      console.log(`  ✅ ${tool.name} available`);
    } catch {
      console.log(`  ⚠️  ${tool.name} not available`);
    }
  }
}
```

### 2. Analyze Command

**src/cli/commands/analyze.ts:**

```typescript
import { Command } from "commander";
import { ConfigManager } from "@/config/manager.js";
import { AnalysisEngine } from "@/analysis/engine.js";
import { ReportGenerator } from "@/reporting/generator.js";
import chalk from "chalk";

export default new Command("analyze")
  .description("Run comprehensive code quality analysis")
  .option("-q, --quick", "Quick analysis mode")
  .option("-j, --json", "Output results as JSON")
  .option("-o, --output <path>", "Save results to file")
  .option("--include <patterns>", "File patterns to include", val =>
    val.split(",")
  )
  .option("--exclude <patterns>", "File patterns to exclude", val =>
    val.split(",")
  )
  .option("--no-cache", "Disable caching")
  .action(async options => {
    try {
      const configManager = new ConfigManager();
      const config = await configManager.loadConfig();
      const engine = new AnalysisEngine();

      console.log(chalk.blue("🔍 Running analysis...\n"));

      // Progress tracking
      engine.on("tool:start", ({ toolName }) => {
        console.log(chalk.gray(`  Running ${toolName}...`));
      });

      engine.on("analysis:complete", result => {
        console.log(chalk.green("✅ Analysis complete!\n"));
        displayResults(result, options);
      });

      // Run analysis
      const analysisOptions = {
        quickMode: options.quick,
        jsonOutput: options.json,
        outputPath: options.output,
        includePatterns: options.include,
        excludePatterns: options.exclude,
        cacheEnabled: options.cache !== false
      };

      const result = await engine.analyze(config, analysisOptions);

      // Save results if requested
      if (options.output) {
        const generator = new ReportGenerator();
        await generator.saveReport(
          result,
          options.output,
          options.json ? "json" : "markdown"
        );
        console.log(chalk.blue(`📄 Report saved to: ${options.output}`));
      }

      // Set exit code based on results
      process.exit(result.summary.errorCount > 0 ? 2 : 0);
    } catch (error) {
      console.error(chalk.red("❌ Analysis failed:"), error.message);
      process.exit(1);
    }
  });

function displayResults(result: any, options: any): void {
  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  const { summary, toolResults } = result;

  // Summary
  console.log(chalk.bold("📊 Summary:"));
  console.log(`  Duration: ${result.duration}ms`);
  console.log(
    `  Overall Score: ${getScoreColor(result.overallScore)}${
      result.overallScore
    }/100`
  );
  console.log(
    `  Issues: ${summary.errorCount} errors, ${
      summary.warningCount
    } warnings, ${summary.infoCount} info`
  );

  if (summary.coverage) {
    console.log(
      `  Coverage: ${getCoverageColor(summary.coverage.line)}${
        summary.coverage.line
      }% line`
    );
  }

  // Tool results
  console.log(chalk.bold("\n🔧 Tool Results:"));
  for (const toolResult of toolResults) {
    const statusColor =
      toolResult.status === "success"
        ? chalk.green
        : toolResult.status === "warning"
        ? chalk.yellow
        : chalk.red;

    console.log(
      `  ${statusColor("●")} ${toolResult.toolName}: ${
        toolResult.issues.length
      } issues (${toolResult.executionTime}ms)`
    );
  }

  // Top issues
  if (summary.totalIssues > 0) {
    console.log(chalk.bold("\n⚠️  Top Issues:"));
    const topIssues = result.toolResults
      .flatMap((tr: any) => tr.issues)
      .sort((a: any, b: any) => b.severity - a.severity)
      .slice(0, 5);

    for (const issue of topIssues) {
      const typeColor =
        issue.type === "error"
          ? chalk.red
          : issue.type === "warning"
          ? chalk.yellow
          : chalk.blue;

      console.log(
        `  ${typeColor("•")} ${issue.filePath}:${issue.lineNumber} - ${
          issue.message
        }`
      );
    }

    if (summary.totalIssues > 5) {
      console.log(`  ... and ${summary.totalIssues - 5} more issues`);
    }
  }
}

function getScoreColor(score: number): chalk.Chalk {
  if (score >= 80) return chalk.green;
  if (score >= 60) return chalk.yellow;
  return chalk.red;
}

function getCoverageColor(coverage: number): chalk.Chalk {
  if (coverage >= 80) return chalk.green;
  if (coverage >= 60) return chalk.yellow;
  return chalk.red;
}
```

---

## Testing Implementation

### 1. Unit Test Example

**tests/unit/analysis/engine.test.ts:**

```typescript
import { describe, it, expect, beforeEach, vi } from "bun:test";
import { AnalysisEngine } from "@/analysis/engine.js";
import { SimpleCache } from "@/analysis/cache.js";
import { ESLintRunner } from "@/tools/eslint.js";
import { PrettierRunner } from "@/tools/prettier.js";
import { BunTestRunner } from "@/tools/bun-test.js";

// Mock the tool runners
vi.mock("@/tools/eslint.js");
vi.mock("@/tools/prettier.js");
vi.mock("@/tools/bun-test.js");

describe("AnalysisEngine", () => {
  let engine: AnalysisEngine;
  let mockConfig: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create engine instance
    engine = new AnalysisEngine();

    // Mock configuration
    mockConfig = {
      project: {
        type: "typescript",
        path: "/test/project"
      },
      tools: {
        eslint: { enabled: true },
        prettier: { enabled: true },
        bunTest: { enabled: true }
      },
      analysis: {
        includePatterns: ["src/**/*"],
        excludePatterns: [],
        cacheEnabled: true
      },
      reporting: {
        format: "json"
      }
    };
  });

  describe("analyze", () => {
    it("should execute all enabled tools sequentially", async () => {
      // Mock tool results
      const mockESLintResult = {
        toolName: "eslint",
        executionTime: 100,
        status: "success" as const,
        issues: [],
        metrics: {}
      };

      const mockPrettierResult = {
        toolName: "prettier",
        executionTime: 50,
        status: "success" as const,
        issues: [],
        metrics: {}
      };

      const mockBunTestResult = {
        toolName: "bun-test",
        executionTime: 200,
        status: "success" as const,
        issues: [],
        metrics: {},
        coverage: {
          line: 85,
          branch: 80,
          function: 90,
          files: {}
        }
      };

      // Setup mock implementations
      vi.mocked(ESLintRunner.prototype.execute).mockResolvedValue(
        mockESLintResult
      );
      vi.mocked(PrettierRunner.prototype.execute).mockResolvedValue(
        mockPrettierResult
      );
      vi.mocked(BunTestRunner.prototype.execute).mockResolvedValue(
        mockBunTestResult
      );

      // Execute analysis
      const result = await engine.analyze(mockConfig);

      // Verify results
      expect(result.toolResults).toHaveLength(3);
      expect(result.toolResults[0]).toEqual(mockESLintResult);
      expect(result.toolResults[1]).toEqual(mockPrettierResult);
      expect(result.toolResults[2]).toEqual(mockBunTestResult);

      expect(result.summary.totalIssues).toBe(0);
      expect(result.summary.errorCount).toBe(0);
      expect(result.overallScore).toBeGreaterThan(0);
    });

    it("should handle tool errors gracefully", async () => {
      // Mock ESLint to fail
      vi.mocked(ESLintRunner.prototype.execute).mockRejectedValue(
        new Error("ESLint failed")
      );

      // Mock other tools to succeed
      vi.mocked(PrettierRunner.prototype.execute).mockResolvedValue({
        toolName: "prettier",
        executionTime: 50,
        status: "success" as const,
        issues: [],
        metrics: {}
      });

      vi.mocked(BunTestRunner.prototype.execute).mockResolvedValue({
        toolName: "bun-test",
        executionTime: 200,
        status: "success" as const,
        issues: [],
        metrics: {}
      });

      // Execute analysis
      const result = await engine.analyze(mockConfig);

      // Verify error handling
      expect(result.toolResults).toHaveLength(3);
      expect(result.toolResults[0].status).toBe("error");
      expect(result.toolResults[0].issues[0].message).toBe("ESLint failed");

      expect(result.toolResults[1].status).toBe("success");
      expect(result.toolResults[2].status).toBe("success");
    });

    it("should only execute enabled tools", async () => {
      // Disable ESLint
      mockConfig.tools.eslint.enabled = false;

      vi.mocked(PrettierRunner.prototype.execute).mockResolvedValue({
        toolName: "prettier",
        executionTime: 50,
        status: "success" as const,
        issues: [],
        metrics: {}
      });

      vi.mocked(BunTestRunner.prototype.execute).mockResolvedValue({
        toolName: "bun-test",
        executionTime: 200,
        status: "success" as const,
        issues: [],
        metrics: {}
      });

      // Execute analysis
      const result = await engine.analyze(mockConfig);

      // Verify only enabled tools were executed
      expect(result.toolResults).toHaveLength(2);
      expect(result.toolResults[0].toolName).toBe("prettier");
      expect(result.toolResults[1].toolName).toBe("bun-test");

      // Verify ESLint was not called
      expect(ESLintRunner.prototype.execute).not.toHaveBeenCalled();
    });
  });

  describe("overall score calculation", () => {
    it("should calculate score based on issues and tool status", async () => {
      // Mock results with issues
      vi.mocked(ESLintRunner.prototype.execute).mockResolvedValue({
        toolName: "eslint",
        executionTime: 100,
        status: "warning" as const,
        issues: [
          { type: "error", severity: 8 },
          { type: "warning", severity: 4 }
        ],
        metrics: {}
      });

      vi.mocked(PrettierRunner.prototype.execute).mockResolvedValue({
        toolName: "prettier",
        executionTime: 50,
        status: "success" as const,
        issues: [{ type: "info", severity: 1 }],
        metrics: {}
      });

      vi.mocked(BunTestRunner.prototype.execute).mockResolvedValue({
        toolName: "bun-test",
        executionTime: 200,
        status: "error" as const,
        issues: [],
        metrics: {}
      });

      const result = await engine.analyze(mockConfig);

      // Expected score calculation:
      // Start with 100
      // Subtract 8 for error, 4 for warning, 1 for info = 87
      // Subtract 10 for warning status, 20 for error status = 57
      expect(result.overallScore).toBe(57);
    });
  });
});
```

### 2. Integration Test Example

**tests/integration/cli-workflow.test.ts:**

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

describe("CLI Workflow Integration", () => {
  const testProject = path.join(__dirname, "../fixtures/test-project");

  beforeAll(async () => {
    // Create test project
    await fs.mkdir(testProject, { recursive: true });

    // Create package.json
    await fs.writeFile(
      path.join(testProject, "package.json"),
      JSON.stringify({
        name: "test-project",
        version: "1.0.0",
        scripts: {
          test: "bun test"
        }
      })
    );

    // Create test files
    await fs.writeFile(
      path.join(testProject, "src", "test.js"),
      `function add(a, b) {
  return a + b;
}

// Unused variable
const unused = 'test';

// Semicolon missing
console.log('hello world')
`
    );
  });

  afterAll(async () => {
    // Clean up test project
    await fs.rm(testProject, { recursive: true, force: true });
  });

  it("should setup configuration successfully", () => {
    process.chdir(testProject);

    // Run setup command
    const result = execSync("node ../../../dist/index.js setup --yes", {
      encoding: "utf8",
      cwd: testProject
    });

    expect(result).toContain("Setup complete");

    // Verify config file exists
    const configExists = await fs
      .access(path.join(testProject, "dev-quality.config.json"))
      .then(() => true)
      .catch(() => false);

    expect(configExists).toBe(true);
  });

  it("should run analysis and generate results", () => {
    process.chdir(testProject);

    // Run analysis command
    const result = execSync("node ../../../dist/index.js analyze --json", {
      encoding: "utf8",
      cwd: testProject
    });

    const analysisResult = JSON.parse(result);

    expect(analysisResult).toHaveProperty("id");
    expect(analysisResult).toHaveProperty("timestamp");
    expect(analysisResult).toHaveProperty("duration");
    expect(analysisResult).toHaveProperty("overallScore");
    expect(analysisResult).toHaveProperty("toolResults");
    expect(analysisResult).toHaveProperty("summary");

    expect(analysisResult.toolResults).toBeInstanceOf(Array);
    expect(analysisResult.summary).toHaveProperty("totalIssues");
    expect(analysisResult.summary).toHaveProperty("errorCount");
    expect(analysisResult.summary).toHaveProperty("warningCount");
  });

  it("should handle quick analysis mode", () => {
    process.chdir(testProject);

    const result = execSync("node ../../../dist/index.js analyze --quick", {
      encoding: "utf8",
      cwd: testProject
    });

    expect(result).toContain("Analysis complete");
    expect(result).toContain("Summary");

    // Quick analysis should be faster
    const analysisResult = JSON.parse(
      execSync("node ../../../dist/index.js analyze --quick --json", {
        encoding: "utf8",
        cwd: testProject
      })
    );

    expect(analysisResult.duration).toBeGreaterThan(0);
    expect(analysisResult.duration).toBeLessThan(10000); // Should be fast
  });
});
```

---

## Build and Deployment

### 1. Build Script

**scripts/build.ts:**

```typescript
import { build } from "bun";
import fs from "fs/promises";
import path from "path";

async function buildProject() {
  console.log("🔨 Building DevQuality CLI...\n");

  try {
    // Clean dist directory
    await fs.rm("dist", { recursive: true, force: true }).catch(() => {});
    await fs.mkdir("dist", { recursive: true });

    // Build main bundle
    console.log("📦 Building main bundle...");
    await build({
      entrypoints: ["./src/index.ts"],
      outdir: "./dist",
      target: "node",
      format: "esm",
      splitting: false,
      sourcemap: "external",
      minify: true
    });

    // Copy package.json and modify for distribution
    console.log("📋 Preparing package.json...");
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));

    // Remove dev dependencies and scripts for distribution
    delete packageJson.devDependencies;
    delete packageJson.scripts;

    await fs.writeFile(
      path.join("dist", "package.json"),
      JSON.stringify(packageJson, null, 2)
    );

    // Copy README and LICENSE
    console.log("📄 Copying documentation...");
    try {
      await fs.copyFile("README.md", path.join("dist", "README.md"));
      await fs.copyFile("LICENSE", path.join("dist", "LICENSE"));
    } catch (error) {
      console.log("⚠️  Some documentation files not found");
    }

    // Generate TypeScript types
    console.log("📝 Generating TypeScript types...");
    await build({
      entrypoints: ["./src/index.ts"],
      outdir: "./dist",
      target: "node",
      format: "esm",
      declaration: true,
      declarationMap: true,
      sourcemap: "external"
    });

    console.log("\n✅ Build complete!");
    console.log("📁 Output directory: ./dist");
    console.log("📦 Package ready for distribution");
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

// Run build
buildProject();
```

### 2. Deployment Script

**scripts/deploy.ts:**

```typescript
import { execSync } from "child_process";
import fs from "fs/promises";
import path from "path";

async function deploy() {
  console.log("🚀 Deploying DevQuality CLI...\n");

  try {
    // Run tests
    console.log("🧪 Running tests...");
    execSync("bun test", { stdio: "inherit" });

    // Run build
    console.log("🔨 Building project...");
    execSync("bun run build", { stdio: "inherit" });

    // Check version
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
    const version = packageJson.version;

    console.log(`📦 Version: ${version}`);

    // Tag release
    console.log("🏷️  Creating git tag...");
    execSync(`git tag -a v${version} -m "Release v${version}"`, {
      stdio: "inherit"
    });

    // Push to npm
    console.log("📤 Publishing to npm...");
    execSync("cd dist && npm publish", { stdio: "inherit" });

    // Push tags
    console.log("📤 Pushing tags...");
    execSync("git push origin --tags", { stdio: "inherit" });

    console.log("\n✅ Deployment complete!");
    console.log(`🎉 DevQuality CLI v${version} is now live!`);
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    process.exit(1);
  }
}

// Run deployment
deploy();
```

---

## Development Workflow

### 1. Local Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Run tests
bun test

# Run tests with coverage
bun run test:coverage

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run typecheck

# Build for production
bun run build
```

### 2. Pre-commit Hooks

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname -- "$0")/_/husky.sh"

bun run lint
bun run typecheck
bun test
```

### 3. Continuous Integration

**.github/workflows/ci.yml:**

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test:coverage

      - name: Run linting
        run: bun run lint

      - name: Type check
        run: bun run typecheck

      - name: Build packages
        run: bun run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  release:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build packages
        run: bun run build

      - name: Publish to npm
        run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
          cd dist && npm publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Contributing Guidelines

### 1. Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write meaningful commit messages
- Include tests for new features

### 2. Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### 3. Issue Reporting

- Use GitHub issues for bug reports
- Include steps to reproduce
- Provide expected vs actual behavior
- Include environment information

---

This implementation guide provides everything needed to build, test, and deploy the DevQuality CLI MVP. The focus is on simplicity, quality, and maintainability while delivering core functionality.
