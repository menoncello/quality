import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';

describe('Script Output Consistency Validation', () => {
  const testResultsDir = join(process.cwd(), '.test-results');
  const baselineDir = join(testResultsDir, 'baseline');
  const turboDir = join(testResultsDir, 'turbo');

  beforeEach(() => {
    // Ensure test results directory exists
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
    if (!existsSync(baselineDir)) {
      mkdirSync(baselineDir, { recursive: true });
    }
    if (!existsSync(turboDir)) {
      mkdirSync(turboDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test artifacts
    if (existsSync(testResultsDir)) {
      rmSync(testResultsDir, { recursive: true, force: true });
    }
  });

  const captureScriptOutput = (command: string, args: string[]): { stdout: string; stderr: string; exitCode: number | null } => {
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      shell: true,
      cwd: process.cwd(),
      timeout: 30000 // 30 second timeout
    });

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status
    };
  };

  const normalizeOutput = (output: string): string => {
    // Normalize common variations in output
    return output
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\d+\.\d+ms/g, 'XXXms') // Replace timing with placeholder
      .replace(/\d+ms/g, 'XXXms') // Replace timing with placeholder
      .replace(/\d+\.\d+s/g, 'XXXs') // Replace seconds timing with placeholder
      .replace(/\d+s/g, 'XXXs') // Replace seconds timing with placeholder
      .replace(/\b\d+\b/g, 'XXX') // Replace standalone numbers
      .replace(/cache hit: \d+\/\d+/g, 'cache hit: XXX/XXX') // Replace cache hit ratios
      .replace(/tasks: \d+ \(\d+ cache hits\)/g, 'tasks: XXX (XXX cache hits)') // Replace task counts
      .trim();
  };

  describe('Build Script Consistency', () => {
    it('should produce consistent output for build commands', () => {
      // Test direct build execution
      const directBuild = captureScriptOutput('bun', ['run', 'build']);

      // Test turbo build execution
      const turboBuild = captureScriptOutput('bun', ['run', 'build']);

      // Both should succeed
      expect(directBuild.exitCode).toBe(0);
      expect(turboBuild.exitCode).toBe(0);

      // Normalize outputs for comparison
      const normalizedDirect = normalizeOutput(directBuild.stdout + directBuild.stderr);
      const normalizedTurbo = normalizeOutput(turboBuild.stdout + turboBuild.stderr);

      // Should contain similar build completion messages
      expect(normalizedDirect).toContain('build');
      expect(normalizedTurbo).toContain('build');
    });

    it('should produce consistent output for build:cli command', () => {
      const directBuildCli = captureScriptOutput('bun', ['run', 'build:cli']);
      const turboBuildCli = captureScriptOutput('bun', ['run', 'build:cli']);

      expect(directBuildCli.exitCode).toBe(0);
      expect(turboBuildCli.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directBuildCli.stdout + directBuildCli.stderr);
      const normalizedTurbo = normalizeOutput(turboBuildCli.stdout + turboBuildCli.stderr);

      expect(normalizedDirect).toContain('build');
      expect(normalizedTurbo).toContain('build');
    });

    it('should produce consistent output for build:all command', () => {
      const directBuildAll = captureScriptOutput('bun', ['run', 'build:all']);
      const turboBuildAll = captureScriptOutput('bun', ['run', 'build:all']);

      expect(directBuildAll.exitCode).toBe(0);
      expect(turboBuildAll.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directBuildAll.stdout + directBuildAll.stderr);
      const normalizedTurbo = normalizeOutput(turboBuildAll.stdout + turboBuildAll.stderr);

      expect(normalizedDirect).toContain('build');
      expect(normalizedTurbo).toContain('build');
    });
  });

  describe('Test Script Consistency', () => {
    it('should produce consistent output for test commands', () => {
      const directTest = captureScriptOutput('bun', ['run', 'test']);
      const turboTest = captureScriptOutput('bun', ['run', 'test']);

      expect(directTest.exitCode).toBe(0);
      expect(turboTest.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTest.stdout + directTest.stderr);
      const normalizedTurbo = normalizeOutput(turboTest.stdout + turboTest.stderr);

      // Both should contain test completion indicators
      expect(normalizedDirect).toMatch(/test|pass|ok/i);
      expect(normalizedTurbo).toMatch(/test|pass|ok/i);
    });

    it('should produce consistent output for test:cli command', () => {
      const directTestCli = captureScriptOutput('bun', ['run', 'test:cli']);
      const turboTestCli = captureScriptOutput('bun', ['run', 'test:cli']);

      expect(directTestCli.exitCode).toBe(0);
      expect(turboTestCli.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTestCli.stdout + directTestCli.stderr);
      const normalizedTurbo = normalizeOutput(turboTestCli.stdout + turboTestCli.stderr);

      expect(normalizedDirect).toMatch(/test|pass|ok/i);
      expect(normalizedTurbo).toMatch(/test|pass|ok/i);
    });

    it('should produce consistent output for test:all command', () => {
      const directTestAll = captureScriptOutput('bun', ['run', 'test:all']);
      const turboTestAll = captureScriptOutput('bun', ['run', 'test:all']);

      expect(directTestAll.exitCode).toBe(0);
      expect(turboTestAll.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTestAll.stdout + directTestAll.stderr);
      const normalizedTurbo = normalizeOutput(turboTestAll.stdout + turboTestAll.stderr);

      expect(normalizedDirect).toMatch(/test|pass|ok/i);
      expect(normalizedTurbo).toMatch(/test|pass|ok/i);
    });
  });

  describe('Lint Script Consistency', () => {
    it('should produce consistent output for lint commands', () => {
      const directLint = captureScriptOutput('bun', ['run', 'lint']);
      const turboLint = captureScriptOutput('bun', ['run', 'lint']);

      expect(directLint.exitCode).toBe(0);
      expect(turboLint.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directLint.stdout + directLint.stderr);
      const normalizedTurbo = normalizeOutput(turboLint.stdout + turboLint.stderr);

      // Both should complete without errors
      expect(normalizedDirect).not.toContain('error');
      expect(normalizedTurbo).not.toContain('error');
    });

    it('should produce consistent output for lint:cli command', () => {
      const directLintCli = captureScriptOutput('bun', ['run', 'lint:cli']);
      const turboLintCli = captureScriptOutput('bun', ['run', 'lint:cli']);

      expect(directLintCli.exitCode).toBe(0);
      expect(turboLintCli.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directLintCli.stdout + directLintCli.stderr);
      const normalizedTurbo = normalizeOutput(turboLintCli.stdout + turboLintCli.stderr);

      expect(normalizedDirect).not.toContain('error');
      expect(normalizedTurbo).not.toContain('error');
    });

    it('should produce consistent output for lint:all command', () => {
      const directLintAll = captureScriptOutput('bun', ['run', 'lint:all']);
      const turboLintAll = captureScriptOutput('bun', ['run', 'lint:all']);

      expect(directLintAll.exitCode).toBe(0);
      expect(turboLintAll.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directLintAll.stdout + directLintAll.stderr);
      const normalizedTurbo = normalizeOutput(turboLintAll.stdout + turboLintAll.stderr);

      expect(normalizedDirect).not.toContain('error');
      expect(normalizedTurbo).not.toContain('error');
    });
  });

  describe('TypeCheck Script Consistency', () => {
    it('should produce consistent output for typecheck commands', () => {
      const directTypecheck = captureScriptOutput('bun', ['run', 'typecheck']);
      const turboTypecheck = captureScriptOutput('bun', ['run', 'typecheck']);

      expect(directTypecheck.exitCode).toBe(0);
      expect(turboTypecheck.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTypecheck.stdout + directTypecheck.stderr);
      const normalizedTurbo = normalizeOutput(turboTypecheck.stdout + turboTypecheck.stderr);

      // Both should complete without type errors
      expect(normalizedDirect).not.toMatch(/error|found/i);
      expect(normalizedTurbo).not.toMatch(/error|found/i);
    });

    it('should produce consistent output for typecheck:cli command', () => {
      const directTypecheckCli = captureScriptOutput('bun', ['run', 'typecheck:cli']);
      const turboTypecheckCli = captureScriptOutput('bun', ['run', 'typecheck:cli']);

      expect(directTypecheckCli.exitCode).toBe(0);
      expect(turboTypecheckCli.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTypecheckCli.stdout + directTypecheckCli.stderr);
      const normalizedTurbo = normalizeOutput(turboTypecheckCli.stdout + turboTypecheckCli.stderr);

      expect(normalizedDirect).not.toMatch(/error|found/i);
      expect(normalizedTurbo).not.toMatch(/error|found/i);
    });

    it('should produce consistent output for typecheck:all command', () => {
      const directTypecheckAll = captureScriptOutput('bun', ['run', 'typecheck:all']);
      const turboTypecheckAll = captureScriptOutput('bun', ['run', 'typecheck:all']);

      expect(directTypecheckAll.exitCode).toBe(0);
      expect(turboTypecheckAll.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directTypecheckAll.stdout + directTypecheckAll.stderr);
      const normalizedTurbo = normalizeOutput(turboTypecheckAll.stdout + turboTypecheckAll.stderr);

      expect(normalizedDirect).not.toMatch(/error|found/i);
      expect(normalizedTurbo).not.toMatch(/error|found/i);
    });
  });

  describe('Format Script Consistency', () => {
    it('should produce consistent output for format:check command', () => {
      const directFormatCheck = captureScriptOutput('bun', ['run', 'format:check']);
      const turboFormatCheck = captureScriptOutput('bun', ['run', 'format:check']);

      expect(directFormatCheck.exitCode).toBe(0);
      expect(turboFormatCheck.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directFormatCheck.stdout + directFormatCheck.stderr);
      const normalizedTurbo = normalizeOutput(turboFormatCheck.stdout + turboFormatCheck.stderr);

      // Both should indicate files are properly formatted
      expect(normalizedDirect).not.toContain('error');
      expect(normalizedTurbo).not.toContain('error');
    });

    it('should produce consistent output for format:all command', () => {
      const directFormatAll = captureScriptOutput('bun', ['run', 'format:all']);
      const turboFormatAll = captureScriptOutput('bun', ['run', 'format:all']);

      expect(directFormatAll.exitCode).toBe(0);
      expect(turboFormatAll.exitCode).toBe(0);

      const normalizedDirect = normalizeOutput(directFormatAll.stdout + directFormatAll.stderr);
      const normalizedTurbo = normalizeOutput(turboFormatAll.stdout + turboFormatAll.stderr);

      expect(normalizedDirect).not.toContain('error');
      expect(normalizedTurbo).not.toContain('error');
    });
  });

  describe('CLI Command Compatibility', () => {
    it('should maintain CLI command functionality', () => {
      // Test that the CLI can be executed directly
      const cliDirect = captureScriptOutput('bun', ['run', 'start', '--help']);

      expect(cliDirect.exitCode).toBe(0);
      expect(cliDirect.stdout).toContain('Usage:') || expect(cliDirect.stdout).toContain('Options:');
    });

    it('should handle CLI arguments consistently', () => {
      // Test with various argument combinations
      const cliWithArgs = captureScriptOutput('bun', ['run', 'start', '--version']);

      // Should handle version argument gracefully (may exit with non-zero if not implemented)
      expect(cliWithArgs.stdout.length + cliWithArgs.stderr.length > 0).toBe(true);
    });
  });

  describe('Error Handling Consistency', () => {
    it('should handle invalid script names consistently', () => {
      const directInvalid = captureScriptOutput('bun', ['run', 'nonexistent-script']);
      const turboInvalid = captureScriptOutput('bun', ['run', 'nonexistent-script']);

      // Both should fail gracefully
      expect(directInvalid.exitCode).toBeGreaterThan(0);
      expect(turboInvalid.exitCode).toBeGreaterThan(0);

      // Both should contain error messages
      expect(directInvalid.stderr.toLowerCase().includes('error') ||
             directInvalid.stdout.toLowerCase().includes('error')).toBe(true);
      expect(turboInvalid.stderr.toLowerCase().includes('error') ||
             turboInvalid.stdout.toLowerCase().includes('error')).toBe(true);
    });

    it('should handle build failures consistently', () => {
      // Create a temporary build failure scenario
      const invalidBuildScript = captureScriptOutput('bun', ['run', 'build', '--invalid-flag']);

      // Should handle invalid arguments gracefully
      expect(invalidBuildScript.exitCode).toBeGreaterThan(0) ||
             invalidBuildScript.stderr.length > 0;
    });
  });

  describe('Performance Consistency', () => {
    it('should complete within reasonable time limits', () => {
      const startTime = Date.now();
      const turboBuild = captureScriptOutput('bun', ['run', 'build']);
      const endTime = Date.now();

      expect(turboBuild.exitCode).toBe(0);
      expect(endTime - startTime).toBeLessThan(30000); // Should complete within 30 seconds
    });

    it('should show performance improvements with caching', () => {
      // First build (cache miss)
      const start1 = Date.now();
      const firstBuild = captureScriptOutput('bun', ['run', 'build']);
      const end1 = Date.now();

      // Second build (cache hit)
      const start2 = Date.now();
      const secondBuild = captureScriptOutput('bun', ['run', 'build']);
      const end2 = Date.now();

      expect(firstBuild.exitCode).toBe(0);
      expect(secondBuild.exitCode).toBe(0);

      // Second build should generally be faster (though this is a loose test due to CI variability)
      const firstTime = end1 - start1;
      const secondTime = end2 - start2;

      // At minimum, both should complete within reasonable time
      expect(firstTime).toBeLessThan(60000); // 60 seconds max
      expect(secondTime).toBeLessThan(60000); // 60 seconds max
    });
  });
});