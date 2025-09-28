import { describe, it, expect } from 'bun:test';
import { stringUtils, asyncUtils, validationUtils } from '@dev-quality/utils';

describe('String Utilities', () => {
  it('should convert to kebab-case', () => {
    expect(stringUtils.kebabCase('helloWorld')).toBe('hello-world');
    expect(stringUtils.kebabCase('HelloWorld')).toBe('hello-world');
    expect(stringUtils.kebabCase('hello_world')).toBe('hello-world');
  });

  it('should convert to camelCase', () => {
    expect(stringUtils.camelCase('hello-world')).toBe('helloWorld');
    expect(stringUtils.camelCase('Hello World')).toBe('helloWorld');
  });

  it('should convert to PascalCase', () => {
    expect(stringUtils.pascalCase('hello-world')).toBe('HelloWorld');
    expect(stringUtils.pascalCase('hello world')).toBe('HelloWorld');
  });

  it('should truncate strings', () => {
    expect(stringUtils.truncate('hello world', 5)).toBe('he...');
    expect(stringUtils.truncate('hello', 10)).toBe('hello');
  });
});

describe('Async Utilities', () => {
  it('should sleep for specified time', async () => {
    const start = Date.now();
    await asyncUtils.sleep(100);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(95);
  });

  it('should retry failed operations', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Failed');
      }
      return 'success';
    };

    const result = await asyncUtils.retry(fn, 3);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});

describe('Validation Utilities', () => {
  it('should validate non-empty strings', () => {
    expect(validationUtils.isNonEmptyString('hello')).toBe(true);
    expect(validationUtils.isNonEmptyString('')).toBe(false);
    expect(validationUtils.isNonEmptyString(123)).toBe(false);
    expect(validationUtils.isNonEmptyString(null)).toBe(false);
  });

  it('should validate versions', () => {
    expect(validationUtils.isValidVersion('1.0.0')).toBe(true);
    expect(validationUtils.isValidVersion('1.0.0-beta')).toBe(true);
    expect(validationUtils.isValidVersion('1.0')).toBe(false);
    expect(validationUtils.isValidVersion('v1.0.0')).toBe(false);
  });

  it('should validate package names', () => {
    expect(validationUtils.isValidPackageName('my-package')).toBe(true);
    expect(validationUtils.isValidPackageName('my_package')).toBe(true);
    expect(validationUtils.isValidPackageName('mypackage')).toBe(true);
    expect(validationUtils.isValidPackageName('MyPackage')).toBe(false);
    expect(validationUtils.isValidPackageName('123package')).toBe(false);
  });
});
