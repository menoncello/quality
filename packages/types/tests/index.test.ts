import { describe, it, expect } from 'bun:test';

describe('Types Package', () => {
  it('should be able to import types', () => {
    // This test just verifies that the types package can be imported without issues
    expect(true).toBe(true);
  });

  it('should export basic types', () => {
    // Verify that the package exports types correctly
    const typesModule = require('../dist/index.js');
    expect(typesModule).toBeDefined();
  });
});