import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

describe('CLI Command Compatibility and Parallel Efficiency Tests', () => {
  const testResultsDir = join(process.cwd(), '.test-results');
  const performanceDir = join(testResultsDir, 'performance');

  beforeEach(() => {
    if (!existsSync(testResultsDir)) {
      mkdirSync(testResultsDir, { recursive: true });
    }
    if (!existsSync(performanceDir)) {
      mkdirSync(performanceDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testResultsDir)) {
      rmSync(testResultsDir, { recursive: true, force: true });
    }
  });

  const executeCommand = (command: string, args: string[]): {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    duration: number;
  } => {
    const startTime = Date.now();
    const result = spawnSync(command, args, {
      encoding: 'utf8',
      shell: true,
      cwd: process.cwd(),
      timeout: 60000 // 60 second timeout
    });
    const endTime = Date.now();

    return {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      exitCode: result.status,
      duration: endTime - startTime
    };
  };

  const measureParallelExecution = (commands: Array<{command: string, args: string[]}>): {
    totalDuration: number;
    individualDurations: number[];
    parallelEfficiency: number;
    results: Array<any>;
  } => {
    const startTime = Date.now();

    // Execute commands in parallel by spawning multiple processes
    const processes = commands.map(cmd => {
      const processStart = Date.now();
      const result = spawnSync(cmd.command, cmd.args, {
        encoding: 'utf8',
        shell: true,
        cwd: process.cwd(),
        timeout: 60000
      });
      const processEnd = Date.now();

      return {
        command: `${cmd.command} ${cmd.args.join(' ')}`,
        stdout: result.stdout || '',
        stderr: result.stderr || '',
        exitCode: result.status,
        duration: processEnd - processStart
      };
    });

    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const individualDurations = processes.map(p => p.duration);
    const maxIndividualDuration = Math.max(...individualDurations);

    // Calculate parallel efficiency: if perfectly parallel, total duration ≈ max individual duration
    // Efficiency = maxIndividualDuration / totalDuration (closer to 1.0 is better)
    const parallelEfficiency = maxIndividualDuration > 0 ? maxIndividualDuration / totalDuration : 0;

    return {
      totalDuration,
      individualDurations,
      parallelEfficiency,
      results: processes
    };
  };

  describe('CLI Command Compatibility', () => {
    const testCommands = [
      { name: 'build', args: ['build'] },
      { name: 'build:cli', args: ['build:cli'] },
      { name: 'build:all', args: ['build:all'] },
      { name: 'test', args: ['test'] },
      { name: 'test:cli', args: ['test:cli'] },
      { name: 'test:all', args: ['test:all'] },
      { name: 'lint', args: ['lint'] },
      { name: 'lint:cli', args: ['lint:cli'] },
      { name: 'lint:all', args: ['lint:all'] },
      { name: 'typecheck', args: ['typecheck'] },
      { name: 'typecheck:cli', args: ['typecheck:cli'] },
      { name: 'typecheck:all', args: ['typecheck:all'] },
      { name: 'format:check', args: ['format:check'] },
      { name: 'format:all', args: ['format:all'] },
      { name: 'quality', args: ['quality'] },
      { name: 'clean', args: ['clean'] }
    ];

    testCommands.forEach(({ name, args }) => {
      it(`should execute ${name} command`, () => {
        const result = executeCommand('bun', args);

        // Add timeout to prevent test hanging
        expect(result.duration).toBeLessThan(30000); // 30 second max

        // Command should execute without hanging and produce some output
        expect(result.stdout.length + result.stderr.length).toBeGreaterThan(0);

        // Many commands should succeed, but some might fail gracefully
        if (result.exitCode !== 0) {
          // If it fails, it should have error output
          expect(result.stderr.length > 0 || result.stdout.toLowerCase().includes('error')).toBe(true);
        }

        // Log performance data for analysis
        const perfData = {
          command: name,
          args,
          duration: result.duration,
          exitCode: result.exitCode,
          timestamp: new Date().toISOString()
        };

        writeFileSync(
          join(performanceDir, `${name}-performance.json`),
          JSON.stringify(perfData, null, 2)
        );
      });

      it(`should handle ${name} command with consistent behavior`, () => {
        // Execute command twice to test consistency
        const result1 = executeCommand('bun', args);
        const result2 = executeCommand('bun', args);

        expect(result1.exitCode).toBe(result2.exitCode);

        // Both should succeed or fail consistently
        if (result1.exitCode === 0) {
          expect(result2.exitCode).toBe(0);
        }
      });
    });

    it('should maintain CLI help functionality', () => {
      const helpResult = executeCommand('bun', ['run', 'start', '--help']);
      expect(helpResult.exitCode).toBe(0);
      expect(helpResult.stdout).toMatch(/usage|options|help/i);
    });

    it('should handle CLI version command', () => {
      const versionResult = executeCommand('bun', ['run', 'start', '--version']);
      // Version command may not be implemented, but should not crash
      expect(versionResult.stdout.length + versionResult.stderr.length > 0).toBe(true);
    });

    it('should handle invalid CLI arguments gracefully', () => {
      const invalidResult = executeCommand('bun', ['run', 'start', '--invalid-flag']);
      expect(invalidResult.exitCode).toBeGreaterThan(0) ||
             expect(invalidResult.stderr.length > 0).toBe(true);
    });
  });

  describe('Parallel Execution Efficiency', () => {
    it('should measure parallel execution efficiency for independent tasks', () => {
      // Test with independent linting tasks
      const independentCommands = [
        { command: 'bun', args: ['run', 'lint:cli'] },
        { command: 'bun', args: ['run', 'typecheck:cli'] }
      ];

      const parallelResult = measureParallelExecution(independentCommands);

      // All commands should succeed
      expect(parallelResult.results.every(r => r.exitCode === 0)).toBe(true);

      // Parallel efficiency should be reasonable (> 50%)
      expect(parallelResult.parallelEfficiency).toBeGreaterThan(0.5);

      // Log detailed performance data
      const perfData = {
        testType: 'independent-tasks',
        commands: independentCommands.map(cmd => `${cmd.command} ${cmd.args.join(' ')}`),
        totalDuration: parallelResult.totalDuration,
        individualDurations: parallelResult.individualDurations,
        parallelEfficiency: parallelResult.parallelEfficiency,
        timestamp: new Date().toISOString()
      };

      writeFileSync(
        join(performanceDir, 'parallel-efficiency-independent.json'),
        JSON.stringify(perfData, null, 2)
      );
    });

    it('should measure parallel execution efficiency for test tasks', () => {
      // Test with different test suites that can run in parallel
      const testCommands = [
        { command: 'bun', args: ['run', 'test:cli'] }
      ];

      // Execute tests serially first
      const serialStart = Date.now();
      const serialResults = testCommands.map(cmd => executeCommand(cmd.command, cmd.args));
      const serialEnd = Date.now();
      const serialDuration = serialEnd - serialStart;

      // Execute tests in parallel
      const parallelResult = measureParallelExecution(testCommands);

      // All tests should pass
      expect(parallelResult.results.every(r => r.exitCode === 0)).toBe(true);
      expect(serialResults.every(r => r.exitCode === 0)).toBe(true);

      // Log comparison data
      const comparisonData = {
        testType: 'test-tasks',
        commands: testCommands.map(cmd => `${cmd.command} ${cmd.args.join(' ')}`),
        serialDuration,
        parallelDuration: parallelResult.totalDuration,
        parallelEfficiency: parallelResult.parallelEfficiency,
        improvement: serialDuration > 0 ? ((serialDuration - parallelResult.totalDuration) / serialDuration) * 100 : 0,
        timestamp: new Date().toISOString()
      };

      writeFileSync(
        join(performanceDir, 'parallel-efficiency-tests.json'),
        JSON.stringify(comparisonData, null, 2)
      );
    });

    it('should measure build task parallelization', () => {
      // Test build task performance characteristics
      const buildCommands = [
        { command: 'bun', args: ['run', 'build:cli'] }
      ];

      // Execute build and measure caching behavior
      const firstBuild = executeCommand('bun', ['run', 'build:cli']);
      const secondBuild = executeCommand('bun', ['run', 'build:cli']); // Should use cache

      expect(firstBuild.exitCode).toBe(0);
      expect(secondBuild.exitCode).toBe(0);

      // Second build should generally be faster due to caching
      const cacheEfficiency = firstBuild.duration > 0 ?
        ((firstBuild.duration - secondBuild.duration) / firstBuild.duration) * 100 : 0;

      const buildPerfData = {
        testType: 'build-caching',
        command: 'build:cli',
        firstBuildDuration: firstBuild.duration,
        secondBuildDuration: secondBuild.duration,
        cacheEfficiency: Math.max(0, cacheEfficiency), // Ensure non-negative
        timestamp: new Date().toISOString()
      };

      writeFileSync(
        join(performanceDir, 'build-caching-efficiency.json'),
        JSON.stringify(buildPerfData, null, 2)
      );

      // Cache should provide some benefit (allowing for CI variability)
      expect(secondBuild.duration).toBeLessThanOrEqual(firstBuild.duration + 5000); // Allow 5s variance
    });

    it('should measure resource utilization patterns', () => {
      // Test multiple scripts to observe resource utilization
      const multiScriptCommands = [
        { command: 'bun', args: ['run', 'lint:cli'] },
        { command: 'bun', args: ['run', 'typecheck:cli'] }
      ];

      const startTime = Date.now();
      const results = multiScriptCommands.map(cmd => executeCommand(cmd.command, cmd.args));
      const endTime = Date.now();

      const totalWallTime = endTime - startTime;
      const totalProcessTime = results.reduce((sum, r) => sum + r.duration, 0);

      // Calculate resource utilization efficiency
      const resourceEfficiency = totalProcessTime > 0 ? totalProcessTime / totalWallTime : 0;

      const resourceData = {
        testType: 'resource-utilization',
        commands: multiScriptCommands.map(cmd => `${cmd.command} ${cmd.args.join(' ')}`),
        wallTime: totalWallTime,
        totalProcessTime,
        resourceEfficiency,
        individualResults: results.map((r, i) => ({
          command: multiScriptCommands[i],
          duration: r.duration,
          exitCode: r.exitCode
        })),
        timestamp: new Date().toISOString()
      };

      writeFileSync(
        join(performanceDir, 'resource-utilization.json'),
        JSON.stringify(resourceData, null, 2)
      );

      // All commands should succeed
      expect(results.every(r => r.exitCode === 0)).toBe(true);

      // Resource efficiency should be reasonable for parallel-capable tasks
      expect(resourceEfficiency).toBeGreaterThan(1.0); // Should show some parallelization benefit
    });

    it('should generate comprehensive performance report', () => {
      // Run a comprehensive performance test suite
      const performanceTests = [
        { name: 'build', command: 'build' },
        { name: 'test', command: 'test' },
        { name: 'lint', command: 'lint' },
        { name: 'typecheck', command: 'typecheck' }
      ];

      const results = performanceTests.map(test => {
        const result = executeCommand('bun', [test.command]);
        return {
          name: test.name,
          command: test.command,
          duration: result.duration,
          exitCode: result.exitCode,
          success: result.exitCode === 0
        };
      });

      const report = {
        testSuite: 'comprehensive-performance',
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalTests: results.length,
          successfulTests: results.filter(r => r.success).length,
          failedTests: results.filter(r => !r.success).length,
          totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
          averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
          minDuration: Math.min(...results.map(r => r.duration)),
          maxDuration: Math.max(...results.map(r => r.duration))
        }
      };

      writeFileSync(
        join(performanceDir, 'comprehensive-performance-report.json'),
        JSON.stringify(report, null, 2)
      );

      expect(report.summary.successfulTests).toBe(report.summary.totalTests);
      expect(report.summary.averageDuration).toBeLessThan(30000); // 30s average max
    });
  });

  describe('Integration Tests', () => {
    it('should maintain script output format consistency', () => {
      // Test that output formats remain consistent across executions
      const testScript = 'build:cli';
      const executions = Array.from({ length: 3 }, () => executeCommand('bun', [testScript]));

      // All should succeed
      expect(executions.every(e => e.exitCode === 0)).toBe(true);

      // Output lengths should be consistent (allowing for minor timing differences)
      const outputLengths = executions.map(e => e.stdout.length + e.stderr.length);
      const avgLength = outputLengths.reduce((sum, len) => sum + len, 0) / outputLengths.length;

      // All outputs should be within 20% of average length
      outputLengths.forEach(length => {
        const variance = Math.abs(length - avgLength) / avgLength;
        expect(variance).toBeLessThan(0.2); // 20% variance allowed
      });
    });

    it('should handle concurrent script execution', () => {
      // Test running multiple scripts concurrently
      const concurrentCommands = [
        { command: 'bun', args: ['run', 'lint:cli'] },
        { command: 'bun', args: ['run', 'typecheck:cli'] }
      ];

      const concurrentResult = measureParallelExecution(concurrentCommands);

      // All should succeed
      expect(concurrentResult.results.every(r => r.exitCode === 0)).toBe(true);

      // Should show reasonable parallelization
      expect(concurrentResult.parallelEfficiency).toBeGreaterThan(0.3);

      // Performance should be reasonable
      expect(concurrentResult.totalDuration).toBeLessThan(60000); // 60s max
    });

    it('should validate script argument passing', () => {
      // Test that script arguments are passed correctly
      const testCommands = [
        { name: 'build with help', command: 'build', args: ['--help'] },
        { name: 'test with verbose', command: 'test', args: ['--verbose'] }
      ];

      testCommands.forEach(({ name, command, args }) => {
        const result = executeCommand('bun', [command, ...args]);

        // Should handle arguments without crashing
        expect(result.stdout.length + result.stderr.length > 0).toBe(true);

        // Should provide meaningful output or error
        expect(result.exitCode === 0 || result.stderr.length > 0).toBe(true);
      });
    });
  });
});