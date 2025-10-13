/**
 * Global test setup to reduce console noise
 * This file runs before all tests to suppress verbose logging
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Mock console methods to reduce noise during tests
const mockConsole = {
  log: (...args: unknown[]) => {
    const message = args.join(' ');

    // Suppress all performance and debug test output
    if (
      message.includes('Processed') && message.includes('issues in') ||
      message.includes('Average time per issue:') ||
      message.includes('Performance consistency for') ||
      message.includes('Memory usage for') ||
      message.includes('Processing time:') ||
      message.includes('Performance comparison for') ||
      message.includes('Concurrent processing:') ||
      message.includes('issues:') && message.includes('ms') ||
      message.includes('Memory optimization test') ||
      message.includes('Complexity comparison') ||
      message.includes('Scalability test results') ||
      message.includes('Coverage analysis:') ||
      message.includes('Trend analysis:') ||
      message.includes('Detection completed in') ||
      message.includes('Memory used:') ||
      message.includes('Concurrent detection') ||
      message.includes('Large monorepo detection') ||
      message.includes('First run:') ||
      message.includes('Memory growth after') ||
      message.includes('Large dataset analysis completed') ||
      message.includes('Concurrent analysis:') ||
      message.includes('Scalability test results:') ||
      message.includes('PASS') ||
      message.includes('Task object:') ||
      message.includes('Task ID:') ||
      message.includes('TaskScheduler methods:') ||
      message.includes('executeTask method exists:') ||
      message.includes('About to call executeTask') ||
      message.includes('executeTask returned successfully:') ||
      message.includes('Captured events:') ||
      message.includes('Debug events:') ||
      message.includes('Task scheduled:') ||
      message.includes('Looking for task') ||
      message.includes('Found queued task:') ||
      message.includes('Found task:') ||
      message.includes('Task execution check:') ||
      message.includes('Executing task') ||
      message.includes('Plugin test-plugin') ||
      message.includes('cleanup-plugin') ||
      message.includes('no-cleanup-plugin') ||
      message.includes('registered') ||
      message.includes('unregistered') ||
      message.includes('Initializing Analysis Engine') ||
      message.includes('Analysis Engine initialized') ||
      message.includes('Added plugin') ||
      message.includes('Plugin registered:') ||
      message.includes('Starting analysis for project') ||
      message.includes('Dependency validation warnings') ||
      message.includes('Resolved execution order') ||
      message.includes('Generated') ||
      message.includes('parallel groups') ||
      message.includes('Starting sandboxed') ||
      message.includes('Plugin') && message.includes('completed in') ||
      message.includes('Plugin') && message.includes('completed successfully') ||
      message.includes('Analysis completed for project') ||
      message.includes('Cleaning up Analysis Engine') ||
      message.includes('Analysis Engine cleaned up')
    ) {
      return;
    }

    // Only show critical failure messages
    if (
      message.includes('✗') ||
      message.includes('FAIL') ||
      message.includes('ERROR') ||
      message.includes('error:') ||
      message.includes('expect(received).toBe(expected)')
    ) {
      originalConsole.log(...args);
    }
  },
  info: (...args: unknown[]) => {
    const message = args.join(' ');

    // Suppress plugin registration and analysis engine messages
    if (
      message.includes('[INFO] Plugin') ||
      message.includes('registered') ||
      message.includes('unregistered') ||
      message.includes('[INFO] Initializing') ||
      message.includes('[INFO] Analysis Engine') ||
      message.includes('[INFO] Analysis completed') ||
      message.includes('[INFO] Starting analysis') ||
      message.includes('[INFO] Cleaning up') ||
      message.includes('[DEBUG] Added plugin') ||
      message.includes('[DEBUG] Resolved execution order') ||
      message.includes('[DEBUG] Generated') ||
      message.includes('[DEBUG] Starting sandboxed') ||
      message.includes('[DEBUG] Plugin') ||
      message.includes('[WARN] Dependency validation') ||
      message.includes('Plugin registered:')
    ) {
      return;
    }
    originalConsole.info(...args);
  },
  warn: (...args: unknown[]) => {
    const message = args.join(' ');

    // Suppress model accuracy warnings
    if (
      message.includes('Model accuracy') ||
      message.includes('below ideal threshold') ||
      message.includes('proceeding with simple model')
    ) {
      return;
    }
    originalConsole.warn(...args);
  },
  error: (...args: unknown[]) => {
    const message = args.join(' ');

    // Suppress expected test errors
    if (
      message.includes('Plugin failing-plugin failed') ||
      message.includes('dependency validation warnings')
    ) {
      return;
    }
    originalConsole.error(...args);
  },
  debug: (...args: unknown[]) => {
    // Suppress all debug messages during tests
    return;
  },
};

// Apply console mocks in test environment
if (process.env.NODE_ENV === 'test' || process.env.CLAUDECODE === '1') {
  Object.assign(console, mockConsole);
}

// Export for potential test-specific overrides
export { originalConsole, mockConsole };