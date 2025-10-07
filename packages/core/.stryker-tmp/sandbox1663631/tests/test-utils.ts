import { mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Test utilities for managing temporary directories
 */

const PROJECT_ROOT = join(__dirname, '../../..');
const TEMP_DIR = join(PROJECT_ROOT, 'temp');

/**
 * Ensure temp directory exists
 */
export function ensureTempDir(): void {
  if (!existsSync(TEMP_DIR)) {
    mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Create a temporary directory for tests in the project's temp folder
 * @param prefix - Prefix for the temporary directory name
 * @returns Absolute path to the created temporary directory
 */
export function createTestDir(prefix: string): string {
  ensureTempDir();
  return mkdtempSync(join(TEMP_DIR, `${prefix}-`));
}

/**
 * Clean up a test directory
 * @param testDir - Directory to remove
 */
export function cleanupTestDir(testDir: string): void {
  try {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors in tests
    console.warn(`Warning: Failed to cleanup test directory ${testDir}:`, error);
  }
}

/**
 * Clean up all test directories in temp folder
 */
export function cleanupAllTestDirs(): void {
  try {
    if (existsSync(TEMP_DIR)) {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    console.warn('Warning: Failed to cleanup temp directory:', error);
  }
}

/**
 * Get the temp directory path
 */
export function getTempDir(): string {
  return TEMP_DIR;
}