#!/usr/bin/env node

import { program, startInteractiveMode } from './index';

// Only start interactive mode if not in test environment
if (process.argv.length === 2 && !process.env['CLAUDECODE'] && !process.env['NODE_TEST']) {
  startInteractiveMode();
} else {
  program.parse();
}
