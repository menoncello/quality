import { describe, it, expect } from 'vitest';
import {
  sanitizeSearchQuery,
  sanitizeFilterValue,
  sanitizeInput,
  escapeHtml,
  validateRegexPattern,
  RateLimiter,
  validateCSP
} from '../../../src/utils/input-validation';

describe('2.3-UNIT-004: Input Sanitization Security', () => {
  describe('sanitizeSearchQuery', () => {
    it('should remove XSS attempt patterns', () => {
      const xssPayload = '<script>alert("xss")</script>';
      const sanitized = sanitizeSearchQuery(xssPayload);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove control characters', () => {
      const maliciousInput = 'test\x00\x08\x0B\x0C\x0E\x1F\x7Finput';
      const sanitized = sanitizeSearchQuery(maliciousInput);
      expect(sanitized).toBe('testinput');
    });

    it('should remove dangerous Unicode characters', () => {
      const unicodeInput = 'test\uFFF0\uFFF5\uFFFCinput';
      const sanitized = sanitizeSearchQuery(unicodeInput);
      expect(sanitized).toBe('testinput');
    });

    it('should limit input length to prevent DoS', () => {
      const longInput = 'a'.repeat(2000);
      const sanitized = sanitizeSearchQuery(longInput);
      expect(sanitized.length).toBeLessThanOrEqual(1000);
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeSearchQuery(null as any)).toBe('');
      expect(sanitizeSearchQuery(undefined as any)).toBe('');
      expect(sanitizeSearchQuery(123 as any)).toBe('');
    });

    it('should prevent SQL injection patterns', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = sanitizeSearchQuery(sqlInjection);
      // Should sanitize but not completely remove for legitimate search
      expect(sanitized).not.toContain("DROP TABLE");
    });

    it('should prevent command injection', () => {
      const commandInjection = 'test; rm -rf /';
      const sanitized = sanitizeSearchQuery(commandInjection);
      expect(sanitized).not.toContain('rm'); // rm command should be removed
    });
  });

  describe('sanitizeFilterValue', () => {
    it('should validate severity filter values', () => {
      expect(sanitizeFilterValue('error', 'severity')).toBe('error');
      expect(sanitizeFilterValue('ERROR', 'severity')).toBe('error');
      expect(sanitizeFilterValue('invalid', 'severity')).toBe('');
      expect(sanitizeFilterValue('<script>', 'severity')).toBe('');
    });

    it('should validate priority filter values', () => {
      expect(sanitizeFilterValue('critical', 'priority')).toBe('critical');
      expect(sanitizeFilterValue('CRITICAL', 'priority')).toBe('critical');
      expect(sanitizeFilterValue('invalid', 'priority')).toBe('');
      expect(sanitizeFilterValue('medium; DROP TABLE', 'priority')).toBe('');
    });

    it('should validate tool filter values', () => {
      expect(sanitizeFilterValue('eslint', 'tool')).toBe('eslint');
      expect(sanitizeFilterValue('typescript', 'tool')).toBe('typescript');
      expect(sanitizeFilterValue('tool-with-dash', 'tool')).toBe('tool-with-dash');
      expect(sanitizeFilterValue('tool@invalid', 'tool')).toBe('');
      expect(sanitizeFilterValue('tool/slash', 'tool')).toBe('');
    });

    it('should sanitize file paths', () => {
      expect(sanitizeFilterValue('../../../etc/passwd', 'file')).toBe('//etc/passwd');
      expect(sanitizeFilterValue('/absolute/path', 'file')).toBe('absolute/path');
      expect(sanitizeFilterValue('file<with>dangerous:chars', 'file')).toBe('filewithdangerouschars');
    });

    it('should validate module filter values', () => {
      expect(sanitizeFilterValue('src/components', 'module')).toBe('src/components');
      expect(sanitizeFilterValue('module-with_underscore', 'module')).toBe('module-with_underscore');
      expect(sanitizeFilterValue('module@invalid', 'module')).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML entities', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
      expect(escapeHtml('<img src="x" onerror="alert(1)">')).toBe('&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;');
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml('&')).toBe('&amp;');
    });

    it('should handle null inputs', () => {
      expect(escapeHtml(null as any)).toBe('');
      expect(escapeHtml(undefined as any)).toBe('');
      expect(escapeHtml(123 as any)).toBe('');
    });
  });

  describe('validateCSP', () => {
    it('should detect dangerous script patterns', () => {
      expect(validateCSP('<script>alert("test")</script>')).toBe(false);
      expect(validateCSP('javascript:alert("test")')).toBe(false);
      expect(validateCSP('<img onload="alert(1)">')).toBe(false);
      expect(validateCSP('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(validateCSP('vbscript:msgbox("test")')).toBe(false);
    });

    it('should allow safe content', () => {
      expect(validateCSP('normal search query')).toBe(true);
      expect(validateCSP('filename.ts')).toBe(true);
      expect(validateCSP('error: missing semicolon')).toBe(true);
    });
  });

  describe('RateLimiter', () => {
    it('should limit request frequency', () => {
      const rateLimiter = new RateLimiter(100); // 100ms interval

      expect(rateLimiter.canMakeRequest()).toBe(true);
      expect(rateLimiter.canMakeRequest()).toBe(false);

      // Wait for interval to pass
      const waitTime = rateLimiter.getTimeUntilNextRequest();
      expect(waitTime).toBeGreaterThan(0);
      expect(waitTime).toBeLessThanOrEqual(100);
    });

    it('should allow requests after interval', (done) => {
      const rateLimiter = new RateLimiter(10); // 10ms interval

      expect(rateLimiter.canMakeRequest()).toBe(true);
      expect(rateLimiter.canMakeRequest()).toBe(false);

      setTimeout(() => {
        expect(rateLimiter.canMakeRequest()).toBe(true);
        done();
      }, 15);
    });
  });

  describe('Comprehensive Security Tests', () => {
    it('should handle OWASP XSS test vectors', () => {
      const xssVectors = [
        '<script>alert("XSS")</script>',
        '<IMG SRC="javascript:alert(\'XSS\');">',
        '<IMG SRC=javascript:alert(\'XSS\')>',
        '<IMG SRC=JaVaScRiPt:alert(\'XSS\')>',
        '<IMG SRC=`javascript:alert("RSnake says, \'XSS\'")`>',
        '<A HREF="javascript:document.location=\'http://www.example.com\'">XSS</A>',
        '<iframe src="javascript:alert(\'XSS\');"></iframe>',
        '<BODY ONLOAD=alert(\'XSS\')>',
        '<SCRIPT>alert(\'XSS\');</SCRIPT>',
      ];

      xssVectors.forEach(vector => {
        const sanitized = sanitizeSearchQuery(vector);
        const escaped = escapeHtml(sanitized);
        expect(escaped).not.toContain('<script>');
        // javascript: should be removed during sanitization but may appear in escaped HTML
        expect(sanitized).not.toContain('javascript:');
        expect(escaped).not.toContain('onload=');
        expect(escaped).not.toContain('onerror=');
      });
    });

    it('should handle Unicode and internationalization attacks', () => {
      const unicodeAttacks = [
        'test\ufeffinput', // Zero-width space
        'test\u200binput', // Zero-width non-joiner
        'test\u2060input', // Word joiner
        'test\uff0einput', // Fullwidth full stop
        'test\uff0finput', // Fullwidth solidus
      ];

      unicodeAttacks.forEach(attack => {
        const sanitized = sanitizeSearchQuery(attack);
        expect(sanitized).not.toContain('\ufeff');
        expect(sanitized).not.toContain('\u200b');
        expect(sanitized).not.toContain('\u2060');
      });
    });

    it('should prevent ReDoS through regex validation', () => {
      const redosPatterns = [
        '(a+)+b', // Catastrophic backtracking
        '(a+)*',  // Nested quantifiers
        '(?=(a+))', // Complex lookahead
        '(?<=(a+))', // Complex lookbehind
        '(.+)*(.+)*', // Multiple nested quantifiers
      ];

      redosPatterns.forEach(pattern => {
        const result = validateRegexPattern(pattern);
        expect(result.isValid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });
  });
});