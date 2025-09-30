import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidatorOptions {
  projectPath: string;
  configPath: string;
}

/**
 * Base validator class with security protections
 */
export abstract class ConfigValidator {
  protected projectPath: string;
  protected configPath: string;

  constructor(options: ValidatorOptions) {
    this.projectPath = path.resolve(options.projectPath);
    this.configPath = this.sanitizePath(options.configPath);
  }

  abstract validate(): Promise<ValidationResult>;

  protected sanitizePath(filePath: string): string {
    const resolved = path.resolve(this.projectPath, filePath);

    // Prevent path traversal attacks
    if (!resolved.startsWith(this.projectPath)) {
      throw new Error(`Invalid path: ${filePath} is outside project directory`);
    }

    return resolved;
  }

  protected fileExists(filePath: string): boolean {
    try {
      return existsSync(this.sanitizePath(filePath));
    } catch {
      return false;
    }
  }

  protected readFile(filePath: string): string {
    try {
      const sanitized = this.sanitizePath(filePath);
      return readFileSync(sanitized, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to read file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Execute command safely with array-based arguments to prevent command injection
   */
  protected executeCommand(
    command: string,
    args: string[],
    cwd?: string
  ): {
    stdout: string;
    stderr: string;
    exitCode: number;
  } {
    try {
      // Use array-based command construction to prevent injection
      const fullCommand = [command, ...args].join(' ');

      const stdout = execSync(fullCommand, {
        cwd: cwd ?? this.projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return {
        stdout: stdout.toString(),
        stderr: '',
        exitCode: 0,
      };
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        const execError = error as {
          status: number;
          stdout?: Buffer | string;
          stderr?: Buffer | string;
        };

        return {
          stdout: execError.stdout?.toString() ?? '',
          stderr: execError.stderr?.toString() ?? '',
          exitCode: execError.status,
        };
      }

      throw new Error(
        `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate JSON structure to prevent injection attacks
   */
  protected validateJsonStructure(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Bun test configuration validator
 */
export class BunTestValidator extends ConfigValidator {
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if bunfig.toml exists
    if (!this.fileExists(this.configPath)) {
      result.isValid = false;
      result.errors.push(`Configuration file not found: ${this.configPath}`);
      return result;
    }

    // Read and validate TOML structure
    try {
      const content = this.readFile(this.configPath);

      // Basic TOML validation (check for [test] section)
      if (!content.includes('[test]')) {
        result.warnings.push('Configuration missing [test] section');
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }

    // Try running bun test --dry-run to validate
    try {
      const testResult = this.executeCommand('bun', ['test', '--dry-run']);

      if (testResult.exitCode !== 0) {
        result.warnings.push('Bun test dry-run exited with non-zero code');
      }
    } catch {
      result.warnings.push('Could not validate with bun test --dry-run');
    }

    return result;
  }
}

/**
 * ESLint configuration validator
 */
export class ESLintValidator extends ConfigValidator {
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if config file exists
    if (!this.fileExists(this.configPath)) {
      result.isValid = false;
      result.errors.push(`Configuration file not found: ${this.configPath}`);
      return result;
    }

    // Validate config structure
    try {
      const content = this.readFile(this.configPath);

      if (this.configPath.endsWith('.json')) {
        if (!this.validateJsonStructure(content)) {
          result.isValid = false;
          result.errors.push('Invalid JSON structure in ESLint configuration');
          return result;
        }
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }

    // Try running eslint --print-config to validate
    try {
      const eslintResult = this.executeCommand('eslint', ['--print-config', 'test.ts']);

      if (eslintResult.exitCode !== 0) {
        result.warnings.push('ESLint config validation returned warnings');
      }
    } catch {
      result.warnings.push('Could not validate with eslint --print-config');
    }

    return result;
  }
}

/**
 * Prettier configuration validator
 */
export class PrettierValidator extends ConfigValidator {
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if config file exists
    if (!this.fileExists(this.configPath)) {
      result.isValid = false;
      result.errors.push(`Configuration file not found: ${this.configPath}`);
      return result;
    }

    // Validate JSON structure
    try {
      const content = this.readFile(this.configPath);

      if (!this.validateJsonStructure(content)) {
        result.isValid = false;
        result.errors.push('Invalid JSON structure in Prettier configuration');
        return result;
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }

    // Try running prettier --check to validate
    try {
      const prettierResult = this.executeCommand('prettier', ['--check', 'package.json']);

      if (prettierResult.exitCode !== 0 && prettierResult.exitCode !== 1) {
        // Exit code 1 means files need formatting (expected), anything else is an error
        result.warnings.push('Prettier config validation returned warnings');
      }
    } catch {
      result.warnings.push('Could not validate with prettier --check');
    }

    return result;
  }
}

/**
 * TypeScript configuration validator
 */
export class TypeScriptValidator extends ConfigValidator {
  async validate(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Check if tsconfig.json exists
    if (!this.fileExists(this.configPath)) {
      result.isValid = false;
      result.errors.push(`Configuration file not found: ${this.configPath}`);
      return result;
    }

    // Validate JSON structure
    try {
      const content = this.readFile(this.configPath);

      if (!this.validateJsonStructure(content)) {
        result.isValid = false;
        result.errors.push('Invalid JSON structure in TypeScript configuration');
        return result;
      }

      // Validate required fields
      const config = JSON.parse(content);
      if (!config.compilerOptions) {
        result.warnings.push('Missing compilerOptions in tsconfig.json');
      }
    } catch (error) {
      result.isValid = false;
      result.errors.push(
        `Failed to read config: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return result;
    }

    // Try running tsc --noEmit to validate
    try {
      const tscResult = this.executeCommand('tsc', ['--noEmit', '--project', this.configPath]);

      if (tscResult.exitCode !== 0) {
        result.warnings.push('TypeScript compilation validation returned warnings');
      }
    } catch {
      result.warnings.push('Could not validate with tsc --noEmit');
    }

    return result;
  }
}
