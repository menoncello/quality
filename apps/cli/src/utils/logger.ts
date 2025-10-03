/**
 * Logging utility for CLI applications
 */

export interface Logger {
  info: (message: string, ...args: unknown[]) => void;
  success: (message: string, ...args: unknown[]) => void;
  warning: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

/**
 * CLI Logger implementation
 */
export class CliLogger implements Logger {
  info(message: string, ...args: unknown[]): void {
    process.stdout.write(`${message} ${args.map(String).join(' ')}\n`);
  }

  success(message: string, ...args: unknown[]): void {
    process.stdout.write(`${message} ${args.map(String).join(' ')}\n`);
  }

  warning(message: string, ...args: unknown[]): void {
    process.stderr.write(`${message} ${args.map(String).join(' ')}\n`);
  }

  error(message: string, ...args: unknown[]): void {
    process.stderr.write(`${message} ${args.map(String).join(' ')}\n`);
  }
}

/**
 * Default logger instance
 */
export const logger = new CliLogger();
