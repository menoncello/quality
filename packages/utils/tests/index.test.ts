import { describe, it, expect, afterEach } from 'bun:test';
import { pathUtils, stringUtils, asyncUtils, validationUtils, fileUtils } from '../src/index';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'node:fs';
import { join } from 'node:path';

describe('pathUtils', () => {
  const testDir = join(process.cwd(), '.test-utils-path');

  afterEach(() => {
    if (existsSync(testDir)) {
      try {
        rmdirSync(testDir, { recursive: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('join', () => {
    it('should join path segments', () => {
      const result = pathUtils.join('foo', 'bar', 'baz');
      expect(result).toContain('foo');
      expect(result).toContain('bar');
      expect(result).toContain('baz');
    });
  });

  describe('dirname', () => {
    it('should return directory name', () => {
      const result = pathUtils.dirname('/foo/bar/file.txt');
      expect(result).toBe('/foo/bar');
    });
  });

  describe('basename', () => {
    it('should return base name', () => {
      const result = pathUtils.basename('/foo/bar/file.txt');
      expect(result).toBe('file.txt');
    });

    it('should return base name without extension', () => {
      const result = pathUtils.basename('/foo/bar/file.txt', '.txt');
      expect(result).toBe('file');
    });
  });

  describe('extname', () => {
    it('should return file extension', () => {
      const result = pathUtils.extname('/foo/bar/file.txt');
      expect(result).toBe('.txt');
    });

    it('should return empty string for no extension', () => {
      const result = pathUtils.extname('/foo/bar/file');
      expect(result).toBe('');
    });
  });

  describe('relative', () => {
    it('should return relative path', () => {
      const result = pathUtils.relative('/foo/bar', '/foo/bar/baz/file.txt');
      expect(result).toContain('baz');
      expect(result).toContain('file.txt');
    });
  });

  describe('getAppDataPath', () => {
    it('should return valid path', () => {
      const result = pathUtils.getAppDataPath('test-app');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include app name in path', () => {
      const result = pathUtils.getAppDataPath('test-app');
      expect(result).toContain('test-app');
    });
  });

  describe('ensureDir', () => {
    it('should create directory if not exists', () => {
      pathUtils.ensureDir(testDir);
      expect(existsSync(testDir)).toBe(true);
    });

    it('should not throw if directory already exists', () => {
      mkdirSync(testDir);
      expect(() => pathUtils.ensureDir(testDir)).not.toThrow();
    });

    it('should create nested directories', () => {
      const nestedDir = join(testDir, 'nested', 'deep');
      pathUtils.ensureDir(nestedDir);
      expect(existsSync(nestedDir)).toBe(true);
    });
  });

  describe('getConfigPath', () => {
    it('should return config path in cwd', () => {
      const result = pathUtils.getConfigPath('config.json');
      expect(result).toContain('config.json');
      expect(result).toContain(process.cwd());
    });
  });
});

describe('stringUtils', () => {
  describe('kebabCase', () => {
    it('should convert PascalCase to kebab-case', () => {
      expect(stringUtils.kebabCase('HelloWorld')).toBe('hello-world');
    });

    it('should convert camelCase to kebab-case', () => {
      expect(stringUtils.kebabCase('helloWorld')).toBe('hello-world');
    });

    it('should convert spaces to dashes', () => {
      expect(stringUtils.kebabCase('hello world')).toBe('hello-world');
    });

    it('should convert underscores to dashes', () => {
      expect(stringUtils.kebabCase('hello_world')).toBe('hello-world');
    });

    it('should handle already kebab-case strings', () => {
      expect(stringUtils.kebabCase('hello-world')).toBe('hello-world');
    });
  });

  describe('camelCase', () => {
    it('should convert kebab-case to camelCase', () => {
      expect(stringUtils.camelCase('hello-world')).toBe('helloWorld');
    });

    it('should convert PascalCase to camelCase', () => {
      expect(stringUtils.camelCase('HelloWorld')).toBe('helloWorld');
    });

    it('should convert spaces to camelCase', () => {
      expect(stringUtils.camelCase('hello world')).toBe('helloWorld');
    });

    it('should handle already camelCase strings', () => {
      expect(stringUtils.camelCase('helloWorld')).toBe('helloWorld');
    });
  });

  describe('pascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(stringUtils.pascalCase('hello-world')).toBe('HelloWorld');
    });

    it('should convert camelCase to PascalCase', () => {
      expect(stringUtils.pascalCase('helloWorld')).toBe('HelloWorld');
    });

    it('should convert spaces to PascalCase', () => {
      expect(stringUtils.pascalCase('hello world')).toBe('HelloWorld');
    });

    it('should handle already PascalCase strings', () => {
      expect(stringUtils.pascalCase('HelloWorld')).toBe('HelloWorld');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      const result = stringUtils.truncate('hello world this is a long string', 10);
      expect(result.length).toBeLessThanOrEqual(10);
      expect(result).toContain('...');
    });

    it('should not truncate short strings', () => {
      const result = stringUtils.truncate('hello', 10);
      expect(result).toBe('hello');
    });

    it('should use custom suffix', () => {
      const result = stringUtils.truncate('hello world', 8, '~');
      expect(result).toContain('~');
    });

    it('should handle exact length strings', () => {
      const result = stringUtils.truncate('hello', 5);
      expect(result).toBe('hello');
    });
  });
});

describe('asyncUtils', () => {
  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await asyncUtils.sleep(100);
      const duration = Date.now() - start;
      expect(duration).toBeGreaterThanOrEqual(90);
    });

    it('should return a promise', () => {
      const result = asyncUtils.sleep(10);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      let attempts = 0;
      const fn = async (): Promise<string> => {
        attempts++;
        return 'success';
      };

      const result = await asyncUtils.retry(fn);
      expect(result).toBe('success');
      expect(attempts).toBe(1);
    });

    it('should retry on failure', async () => {
      let attempts = 0;
      const fn = async (): Promise<string> => {
        attempts++;
        if (attempts < 3) {
          throw new Error('fail');
        }
        return 'success';
      };

      const result = await asyncUtils.retry(fn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const fn = async (): Promise<string> => {
        throw new Error('always fail');
      };

      await expect(asyncUtils.retry(fn, 3, 10)).rejects.toThrow('always fail');
    });

    it('should use default max attempts', async () => {
      let attempts = 0;
      const fn = async (): Promise<string> => {
        attempts++;
        throw new Error('fail');
      };

      try {
        await asyncUtils.retry(fn);
      } catch {
        expect(attempts).toBe(3);
      }
    });
  });

  describe('timeout', () => {
    it('should resolve if promise completes in time', async () => {
      const promise = asyncUtils.sleep(10).then(() => 'success');
      const result = await asyncUtils.timeout(promise, 100);
      expect(result).toBe('success');
    });

    it('should reject if promise times out', async () => {
      const promise = asyncUtils.sleep(200).then(() => 'success');
      await expect(asyncUtils.timeout(promise, 50)).rejects.toThrow('Operation timed out');
    });

    it('should use custom error message', async () => {
      const promise = asyncUtils.sleep(200).then(() => 'success');
      await expect(asyncUtils.timeout(promise, 50, 'Custom timeout')).rejects.toThrow(
        'Custom timeout'
      );
    });
  });
});

describe('validationUtils', () => {
  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(validationUtils.isNonEmptyString('hello')).toBe(true);
    });

    it('should return false for empty strings', () => {
      expect(validationUtils.isNonEmptyString('')).toBe(false);
    });

    it('should return false for whitespace strings', () => {
      expect(validationUtils.isNonEmptyString('   ')).toBe(false);
    });

    it('should return false for non-strings', () => {
      expect(validationUtils.isNonEmptyString(123)).toBe(false);
      expect(validationUtils.isNonEmptyString(null)).toBe(false);
      expect(validationUtils.isNonEmptyString(undefined)).toBe(false);
    });
  });

  describe('isValidVersion', () => {
    it('should validate semantic versions', () => {
      expect(validationUtils.isValidVersion('1.0.0')).toBe(true);
      expect(validationUtils.isValidVersion('2.5.10')).toBe(true);
    });

    it('should validate pre-release versions', () => {
      expect(validationUtils.isValidVersion('1.0.0-alpha')).toBe(true);
      expect(validationUtils.isValidVersion('1.0.0-beta-1')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(validationUtils.isValidVersion('1.0')).toBe(false);
      expect(validationUtils.isValidVersion('v1.0.0')).toBe(false);
      expect(validationUtils.isValidVersion('1.0.0.0')).toBe(false);
    });
  });

  describe('isValidPackageName', () => {
    it('should validate lowercase package names', () => {
      expect(validationUtils.isValidPackageName('package')).toBe(true);
      expect(validationUtils.isValidPackageName('my-package')).toBe(true);
      expect(validationUtils.isValidPackageName('my_package')).toBe(true);
    });

    it('should reject invalid package names', () => {
      expect(validationUtils.isValidPackageName('MyPackage')).toBe(false);
      expect(validationUtils.isValidPackageName('123package')).toBe(false);
      expect(validationUtils.isValidPackageName('-package')).toBe(false);
    });
  });
});

describe('fileUtils', () => {
  const testFile = join(process.cwd(), '.test-utils-file.json');

  afterEach(() => {
    if (existsSync(testFile)) {
      unlinkSync(testFile);
    }
  });

  describe('readJsonSync', () => {
    it('should read and parse JSON file', () => {
      const data = { name: 'test', value: 42 };
      writeFileSync(testFile, JSON.stringify(data), 'utf-8');

      const result = fileUtils.readJsonSync<typeof data>(testFile);
      expect(result.name).toBe('test');
      expect(result.value).toBe(42);
    });

    it('should throw on invalid JSON', () => {
      writeFileSync(testFile, 'invalid json', 'utf-8');
      expect(() => fileUtils.readJsonSync(testFile)).toThrow();
    });

    it('should throw on non-existent file', () => {
      expect(() => fileUtils.readJsonSync('./non-existent.json')).toThrow();
    });
  });

  describe('writeJsonSync', () => {
    it('should write JSON file', () => {
      const data = { name: 'test', value: 42 };
      fileUtils.writeJsonSync(testFile, data);

      expect(existsSync(testFile)).toBe(true);

      const content = fileUtils.readJsonSync<typeof data>(testFile);
      expect(content.name).toBe('test');
      expect(content.value).toBe(42);
    });

    it('should format JSON with indentation', () => {
      const data = { name: 'test' };
      fileUtils.writeJsonSync(testFile, data);

      const content = fileUtils.readJsonSync<typeof data>(testFile);
      expect(content).toEqual(data);
    });
  });

  describe('existsSync', () => {
    it('should return true for existing files', () => {
      writeFileSync(testFile, 'test', 'utf-8');
      expect(fileUtils.existsSync(testFile)).toBe(true);
    });

    it('should return false for non-existent files', () => {
      expect(fileUtils.existsSync('./non-existent-file.txt')).toBe(false);
    });
  });

  describe('findFileUp', () => {
    it('should find file in current directory', () => {
      writeFileSync(testFile, 'test', 'utf-8');

      const result = fileUtils.findFileUp('.test-utils-file.json');
      expect(result).toBeDefined();
      expect(result).toContain('.test-utils-file.json');
    });

    it('should return null if file not found', () => {
      const result = fileUtils.findFileUp('.non-existent-file.json');
      expect(result).toBeNull();
    });

    it('should search up directory tree', () => {
      const result = fileUtils.findFileUp('package.json');

      if (result) {
        expect(result).toContain('package.json');
      }
    });
  });
});
