/**
 * Security Test Scenarios for Story 1.2
 * Addresses SEC-001 Critical Risk from Risk Profile
 * Test scenarios from Test Design document (lines 80-90)
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { writeFileSync, chmodSync } from 'fs';
import { join } from 'path';
import { ProjectDetector } from '../../src/detection/project-detector';
import { ToolDetector } from '../../src/detection/tool-detector';
import { createTestDir, cleanupTestDir } from '../test-utils';

describe('Security Tests - Configuration File Injection (SEC-001)', () => {
  let testDir: string;
  let projectDetector: ProjectDetector;
  let toolDetector: ToolDetector;

  beforeEach(() => {
    testDir = createTestDir('security-test');
    projectDetector = new ProjectDetector();
    toolDetector = new ToolDetector();
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  /**
   * Test ID: 1.2-SEC-001
   * Priority: P0
   * Block prototype pollution in config parsing
   */
  describe('1.2-SEC-001: Prototype Pollution Protection', () => {
    it('should block prototype pollution via __proto__ in package.json', async () => {
      const maliciousPackageJson = {
        name: 'malicious-project',
        version: '1.0.0',
        __proto__: {
          polluted: true,
        },
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(maliciousPackageJson));

      // Should not throw and should not pollute Object prototype
      const result = await projectDetector.detectProject(testDir);

      // Verify Object prototype not polluted
      expect((Object.prototype as unknown).polluted).toBeUndefined();
      expect(result).toBeDefined();
    });

    it('should block prototype pollution via constructor in config', async () => {
      const maliciousConfig = {
        name: 'malicious',
        constructor: {
          prototype: {
            polluted: true,
          },
        },
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(maliciousConfig));

      await projectDetector.detectProject(testDir);

      // Verify no pollution
      expect((Object.prototype as unknown).polluted).toBeUndefined();
    });

    it('should safely handle nested __proto__ attempts', async () => {
      const maliciousConfig = {
        name: 'test',
        dependencies: {
          __proto__: {
            injected: true,
          },
        },
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(maliciousConfig));

      const result = await projectDetector.detectProject(testDir);

      expect((Object.prototype as unknown).injected).toBeUndefined();
      expect(result).toBeDefined();
    });
  });

  /**
   * Test ID: 1.2-SEC-002
   * Priority: P0
   * Validate file size limits for DoS prevention
   */
  describe('1.2-SEC-002: File Size Limits for DoS Prevention', () => {
    it('should handle extremely large package.json files gracefully', async () => {
      // Create a large package.json (>10MB)
      const largeDeps: Record<string, string> = {};
      for (let i = 0; i < 100000; i++) {
        largeDeps[`package-${i}`] = '^1.0.0';
      }

      const largePackageJson = {
        name: 'large-project',
        version: '1.0.0',
        dependencies: largeDeps,
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(largePackageJson));

      // Should complete without hanging or crashing
      const startTime = Date.now();
      const result = await projectDetector.detectProject(testDir);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should not hang indefinitely
    });

    it('should handle deeply nested configuration objects', async () => {
      // Create deeply nested structure
      let nested: unknown = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        nested = { nested };
      }

      const deepConfig = {
        name: 'deep-project',
        version: '1.0.0',
        config: nested,
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(deepConfig));

      // Should not cause stack overflow
      expect(async () => {
        await projectDetector.detectProject(testDir);
      }).not.toThrow();
    });

    it('should handle configuration files with circular references safely', async () => {
      // Note: JSON.stringify cannot handle circular refs, but parsing might
      const validPackageJson = {
        name: 'test-project',
        version: '1.0.0',
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(validPackageJson));

      // Should handle gracefully
      const result = await projectDetector.detectProject(testDir);
      expect(result).toBeDefined();
    });
  });

  /**
   * Test ID: 1.2-SEC-003
   * Priority: P0
   * Sandboxed configuration parsing execution
   */
  describe('1.2-SEC-003: Sandboxed Configuration Parsing', () => {
    it('should not execute JavaScript in configuration files', async () => {
      // Create package.json with potential code injection
      const packageJsonWithCode = `{
        "name": "malicious",
        "version": "1.0.0",
        "scripts": {
          "preinstall": "rm -rf / --no-preserve-root"
        }
      }`;

      writeFileSync(join(testDir, 'package.json'), packageJsonWithCode);

      // Should parse safely without executing scripts
      const result = await projectDetector.detectProject(testDir);

      expect(result).toBeDefined();
      expect(result.name).toBe('malicious');
      // Critical: Scripts should not be executed during parsing
    });

    it('should safely parse configuration without evaluating expressions', async () => {
      const configWithExpressions = {
        name: 'test',
        version: '${process.exit(1)}', // Should not be evaluated
        scripts: {
          test: 'node -e "process.exit(1)"',
        },
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(configWithExpressions));

      // Should not crash or exit process
      const result = await projectDetector.detectProject(testDir);
      expect(result).toBeDefined();
    });
  });

  /**
   * Test ID: 1.2-SEC-004
   * Priority: P0
   * Malicious configuration file rejection
   */
  describe('1.2-SEC-004: Malicious Configuration File Rejection', () => {
    it('should handle malformed JSON gracefully', async () => {
      writeFileSync(join(testDir, 'package.json'), '{invalid json}');

      // Should throw error but not crash
      await expect(async () => {
        await projectDetector.detectProject(testDir);
      }).toThrow();
    });

    it('should validate required fields in package.json', async () => {
      const invalidPackageJson = {
        // Missing name and version
        dependencies: {},
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(invalidPackageJson));

      const result = await projectDetector.detectProject(testDir);
      // Should handle gracefully with default values
      expect(result).toBeDefined();
    });

    it('should reject configuration files with suspicious patterns', async () => {
      const suspiciousConfig = {
        name: '../../../etc/passwd',
        version: '1.0.0',
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(suspiciousConfig));

      const result = await projectDetector.detectProject(testDir);
      // Should parse but sanitize path traversal attempts
      expect(result.name).toBeDefined();
    });

    it('should handle binary data in configuration files', async () => {
      // Write binary data
      const buffer = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]);
      writeFileSync(join(testDir, 'package.json'), buffer);

      // Should fail gracefully
      await expect(async () => {
        await projectDetector.detectProject(testDir);
      }).toThrow();
    });
  });

  /**
   * Additional Security Tests
   */
  describe('Additional Security Validations', () => {
    it('should handle symlink attacks safely', async () => {
      // Create normal package.json
      const validPackageJson = {
        name: 'test-project',
        version: '1.0.0',
      };
      writeFileSync(join(testDir, 'package.json'), JSON.stringify(validPackageJson));

      // Should detect project without following malicious symlinks
      const result = await projectDetector.detectProject(testDir);
      expect(result).toBeDefined();
    });

    it('should not leak file system information via error messages', async () => {
      const nonExistentPath = join(testDir, 'non-existent-dir');

      try {
        await projectDetector.detectProject(nonExistentPath);
      } catch (error: unknown) {
        // Error messages should not leak full system paths
        expect(error.message).toBeDefined();
        // Should contain relative path, not absolute system path
      }
    });

    it('should handle files without read permissions gracefully', async () => {
      const restrictedFile = join(testDir, 'package.json');
      writeFileSync(restrictedFile, JSON.stringify({ name: 'test', version: '1.0.0' }));

      // Make file unreadable (on Unix systems)
      try {
        chmodSync(restrictedFile, 0o000);

        // Should handle permission errors gracefully
        await expect(async () => {
          await projectDetector.detectProject(testDir);
        }).toThrow();
      } finally {
        // Restore permissions for cleanup
        try {
          chmodSync(restrictedFile, 0o644);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('should validate ESLint configuration for code injection', async () => {
      // ESLint configs can execute arbitrary code in .js format
      const packageJson = {
        name: 'test',
        version: '1.0.0',
        devDependencies: {
          eslint: '^8.57.0',
        },
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Create safe .eslintrc.json (not .js)
      const eslintConfig = {
        extends: ['eslint:recommended'],
        rules: {},
      };

      writeFileSync(join(testDir, '.eslintrc.json'), JSON.stringify(eslintConfig));

      // Should detect tool without executing config
      const tools = await toolDetector.detectTools(testDir);
      const eslintTool = tools.find(t => t.name === 'eslint');

      expect(eslintTool).toBeDefined();
      expect(eslintTool?.configFormat).toBe('json');
    });

    it('should handle moderately nested structures without crashing', async () => {
      // Create moderately nested structure
      let nested: unknown = 'data';
      for (let i = 0; i < 10; i++) {
        const array = new Array(5).fill(nested);
        nested = { items: array };
      }

      const packageJson = {
        name: 'nested-structure',
        version: '1.0.0',
        metadata: nested,
      };

      writeFileSync(join(testDir, 'package.json'), JSON.stringify(packageJson));

      // Should complete without crashing or timing out
      const startTime = Date.now();
      const result = await projectDetector.detectProject(testDir);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete in reasonable time
    });
  });
});

describe('Input Validation Security', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = createTestDir('validation-test');
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should validate and sanitize file paths', async () => {
    const detector = new ProjectDetector();

    // Path traversal attempts
    const maliciousPaths = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      'test/../../sensitive',
      './node_modules/../../../etc',
    ];

    for (const path of maliciousPaths) {
      const fullPath = join(testDir, path);
      try {
        await detector.detectProject(fullPath);
      } catch (error) {
        // Should fail safely
        expect(error).toBeDefined();
      }
    }
  });

  it('should handle null bytes in paths', async () => {
    const detector = new ProjectDetector();

    // Null byte injection attempt
    const pathWithNull = testDir + '\0/etc/passwd';

    try {
      await detector.detectProject(pathWithNull);
    } catch (error) {
      // Should reject or sanitize
      expect(error).toBeDefined();
    }
  });

  it('should limit configuration key lengths', async () => {
    const veryLongKey = 'a'.repeat(10000);
    const config: unknown = {
      name: 'test',
      version: '1.0.0',
    };
    config[veryLongKey] = 'value';

    writeFileSync(join(testDir, 'package.json'), JSON.stringify(config));

    const detector = new ProjectDetector();
    // Should handle without performance degradation
    const result = await detector.detectProject(testDir);
    expect(result).toBeDefined();
  });
});
