/**
 * Basic Unit Tests for Template Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock file system operations
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  existsSync: vi.fn(() => false),
}));

vi.mock('node:path', () => ({
  resolve: vi.fn((...paths) => paths.join('/')),
  join: vi.fn((...paths) => paths.join('/')),
}));

// Import after mocking
import { TemplateService } from '../../../../src/services/reporting/template-service';
import type { TemplateDefinition } from '../../../../src/services/reporting/template-service';

describe('TemplateService (Basic)', () => {
  let templateService: TemplateService;

  beforeEach(() => {
    vi.clearAllMocks();
    templateService = new TemplateService('/tmp/test-templates');
  });

  describe('basic functionality', () => {
    it('should create TemplateService instance', () => {
      expect(templateService).toBeDefined();
      expect(templateService).toBeInstanceOf(TemplateService);
    });

    it('should have built-in templates loaded', () => {
      const templates = templateService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);

      const builtinTemplates = templates.filter(t => t.templateType === 'builtin');
      expect(builtinTemplates.length).toBeGreaterThan(0);

      // Check for expected built-in templates
      const executiveSummary = templates.find(t => t.id === 'executive-summary');
      expect(executiveSummary).toBeDefined();
      expect(executiveSummary?.name).toBe('Executive Summary');
      expect(executiveSummary?.format).toBe('html');
    });

    it('should validate templates correctly', () => {
      const validTemplate: TemplateDefinition = {
        id: 'test-template',
        name: 'Test Template',
        description: 'Test description',
        format: 'html',
        author: 'Test Author',
        version: '1.0.0',
        tags: [],
        category: 'test',
        templateType: 'custom',
        sections: [
          {
            id: 'summary',
            name: 'Summary',
            type: 'summary',
            enabled: true,
            order: 1,
          },
        ],
        variables: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = templateService.validateTemplate(validTemplate);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid templates', () => {
      const invalidTemplate = {
        id: 'invalid-template',
        name: '', // Invalid: empty name
        format: 'html',
        sections: [], // Invalid: no sections
        templateType: 'custom' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const validation = templateService.validateTemplate(invalidTemplate);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should get templates by format', () => {
      const htmlTemplates = templateService.getTemplatesByFormat('html');
      expect(Array.isArray(htmlTemplates)).toBe(true);

      const allHtmlTemplates = htmlTemplates.filter(t => t.format === 'html');
      expect(allHtmlTemplates.length).toBe(htmlTemplates.length);
    });

    it('should get templates by category', () => {
      const categories = templateService.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should check if template exists', () => {
      expect(templateService.hasTemplate('executive-summary')).toBe(true);
      expect(templateService.hasTemplate('non-existent')).toBe(false);
    });

    it('should get template statistics', () => {
      const stats = templateService.getStatistics();
      expect(stats).toBeDefined();
      expect(stats.totalTemplates).toBeGreaterThan(0);
      expect(stats.builtinTemplates).toBeGreaterThan(0);
      expect(typeof stats.formats).toBe('object');
    });

    it('should get template preview', () => {
      const preview = templateService.getTemplatePreview('executive-summary');
      expect(typeof preview).toBe('string');
      expect(preview).toContain('Executive Summary');
      expect(preview).toContain('Format: html');
    });

    it('should refresh cache', () => {
      expect(() => templateService.refreshCache()).not.toThrow();

      const templates = templateService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('template creation', () => {
    it('should create a new custom template', () => {
      const templateData = {
        name: 'Test Custom Template',
        description: 'A test custom template',
        format: 'markdown' as const,
        author: 'Test Author',
        version: '1.0.0',
        tags: ['test'],
        category: 'custom',
        templateType: 'custom' as const,
        sections: [
          {
            id: 'test-section',
            name: 'Test Section',
            type: 'summary' as const,
            enabled: true,
            order: 1,
          },
        ],
        variables: [],
        metadata: {},
      };

      const template = templateService.createTemplate(templateData);

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe('Test Custom Template');
      expect(template.templateType).toBe('custom');
      expect(template.createdAt).toBeInstanceOf(Date);
      expect(template.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error for invalid template creation', () => {
      const invalidTemplateData = {
        name: '', // Invalid
        format: 'html' as const,
        sections: [], // Invalid
        templateType: 'custom' as const,
      };

      expect(() => templateService.createTemplate(invalidTemplateData))
        .toThrow('Template validation failed');
    });
  });

  describe('template updates', () => {
    it('should update existing template', () => {
      // First create a template
      const templateData = {
        name: 'Template to Update',
        format: 'html' as const,
        author: 'Test Author',
        version: '1.0.0',
        templateType: 'custom' as const,
        sections: [
          {
            id: 'section1',
            name: 'Section 1',
            type: 'summary' as const,
            enabled: true,
            order: 1,
          },
        ],
        variables: [],
      };

      const template = templateService.createTemplate(templateData);
      const templateId = template.id;

      // Update the template
      const updatedTemplate = templateService.updateTemplate(templateId, {
        name: 'Updated Template Name',
        description: 'Updated description',
      });

      expect(updatedTemplate.name).toBe('Updated Template Name');
      expect(updatedTemplate.description).toBe('Updated description');
      expect(updatedTemplate.id).toBe(templateId);
    });

    it('should throw error when updating non-existent template', () => {
      expect(() => templateService.updateTemplate('non-existent-id', { name: 'New Name' }))
        .toThrow('Template not found: non-existent-id');
    });
  });

  describe('template deletion', () => {
    it('should delete existing template', () => {
      // First create a template
      const templateData = {
        name: 'Template to Delete',
        format: 'html' as const,
        author: 'Test Author',
        version: '1.0.0',
        templateType: 'custom' as const,
        sections: [
          {
            id: 'section1',
            name: 'Section 1',
            type: 'summary' as const,
            enabled: true,
            order: 1,
          },
        ],
        variables: [],
      };

      const template = templateService.createTemplate(templateData);
      const templateId = template.id;

      // Verify template exists
      expect(templateService.hasTemplate(templateId)).toBe(true);

      // Delete the template
      const deleted = templateService.deleteTemplate(templateId);
      expect(deleted).toBe(true);

      // Verify template no longer exists
      expect(templateService.hasTemplate(templateId)).toBe(false);
    });

    it('should return false when deleting non-existent template', () => {
      const deleted = templateService.deleteTemplate('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('template cloning', () => {
    it('should clone existing template', () => {
      const originalTemplate = templateService.getTemplate('executive-summary');
      expect(originalTemplate).toBeDefined();

      const clonedTemplate = templateService.cloneTemplate('executive-summary', 'Cloned Executive Summary');

      expect(clonedTemplate).toBeDefined();
      expect(clonedTemplate.id).not.toBe(originalTemplate?.id);
      expect(clonedTemplate.name).toBe('Cloned Executive Summary');
      expect(clonedTemplate.templateType).toBe('custom');
      expect(clonedTemplate.sections).toHaveLength(originalTemplate?.sections.length || 0);
      expect(clonedTemplate.sections.map(s => ({ ...s, id: undefined }))).toEqual(
        originalTemplate?.sections.map(s => ({ ...s, id: undefined }))
      );
    });

    it('should throw error when cloning non-existent template', () => {
      expect(() => templateService.cloneTemplate('non-existent-id'))
        .toThrow('Template not found: non-existent-id');
    });
  });
});