/**
 * Ensure temp directory exists
 */
export declare function ensureTempDir(): void;
/**
 * Create a temporary directory for tests in the project's temp folder
 * @param prefix - Prefix for the temporary directory name
 * @returns Absolute path to the created temporary directory
 */
export declare function createTestDir(_prefix: string): string;
/**
 * Clean up a test directory
 * @param testDir - Directory to remove
 */
export declare function cleanupTestDir(_testDir: string): void;
/**
 * Clean up all test directories in temp folder
 */
export declare function cleanupAllTestDirs(): void;
/**
 * Get the temp directory path
 */
export declare function getTempDir(): string;
//# sourceMappingURL=test-utils.d.ts.map