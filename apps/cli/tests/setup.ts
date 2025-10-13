/**
 * CLI test setup to suppress verbose logging
 */

// Suppress specific noisy outputs during CLI tests
const originalConsoleLog = console.log;
const originalConsoleInfo = console.info;
const originalConsoleWarn = console.warn;

console.log = (...args: unknown[]) => {
  const message = args.join(' ');

  // Suppress performance test output
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
    message.includes('Memory growth after')
  ) {
    return;
  }

  // Suppress task scheduler debug output
  if (
    message.includes('Task object:') ||
    message.includes('Task ID:') ||
    message.includes('TaskScheduler methods:') ||
    message.includes('executeTask method exists:') ||
    message.includes('About to call executeTask') ||
    message.includes('executeTask returned successfully:') ||
    message.includes('Captured events:') ||
    message.includes('Debug events:')
  ) {
    return;
  }

  originalConsoleLog(...args);
};

console.info = (...args: unknown[]) => {
  const message = args.join(' ');

  // Suppress plugin registration messages
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
    message.includes('[WARN] Dependency validation')
  ) {
    return;
  }

  originalConsoleInfo(...args);
};

console.warn = (...args: unknown[]) => {
  const message = args.join(' ');

  // Suppress model accuracy warnings
  if (
    message.includes('Model accuracy') ||
    message.includes('below ideal threshold') ||
    message.includes('proceeding with simple model')
  ) {
    return;
  }

  originalConsoleWarn(...args);
};

export {};