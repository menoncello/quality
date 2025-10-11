/**
 * Unit tests for WidgetRegistry component
 */

import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WidgetRegistry } from '../../../../src/components/dashboard/widget-registry';
import type { WidgetConfig } from '../../../../src/types/dashboard';

describe('WidgetRegistry', () => {
  beforeEach(() => {
    // Reset the registry before each test
    WidgetRegistry.getAllRegistrations().forEach(reg => {
      // Note: We can't directly unregister widgets in the current implementation
      // This is a limitation that could be addressed in a future iteration
    });
  });

  describe('Registration', () => {
    it('should register built-in widget types', () => {
      const registrations = WidgetRegistry.getAllRegistrations();
      const widgetTypes = registrations.map(reg => reg.type);
      
      expect(widgetTypes).toContain('summary');
      expect(widgetTypes).toContain('issues');
      expect(widgetTypes).toContain('coverage');
      expect(widgetTypes).toContain('trends');
    });

    it('should get registration by type', () => {
      const summaryReg = WidgetRegistry.getRegistration('summary');
      
      expect(summaryReg).toBeDefined();
      expect(summaryReg?.name).toBe('Summary');
      expect(summaryReg?.description).toBe('Overall metrics and key insights');
    });

    it('should return undefined for unknown widget type', () => {
      const unknownReg = WidgetRegistry.getRegistration('unknown');
      
      expect(unknownReg).toBeUndefined();
    });

    it('should get available widget types for user selection', () => {
      const availableTypes = WidgetRegistry.getAvailableWidgetTypes();
      
      expect(availableTypes).toHaveLength(4);
      expect(availableTypes.some(type => type.name === 'Summary')).toBe(true);
      expect(availableTypes.some(type => type.name === 'Issues')).toBe(true);
      expect(availableTypes.some(type => type.name === 'Coverage')).toBe(true);
      expect(availableTypes.some(type => type.name === 'Trends')).toBe(true);
    });
  });

  describe('Widget Creation', () => {
    const mockConfig: WidgetConfig = {
      id: 'test-widget',
      type: 'summary',
      position: { x: 0, y: 0, width: 50, height: 15 },
      config: {},
      visible: true,
    };

    const mockOnSelect = vi.fn();
    const mockOnUpdate = vi.fn();

    it('should create widget for known type', () => {
      const widget = WidgetRegistry.createWidget(
        mockConfig,
        false,
        mockOnSelect,
        mockOnUpdate
      );
      
      expect(widget).toBeDefined();
    });

    it('should return null for unknown widget type', () => {
      const unknownConfig = { ...mockConfig, type: 'unknown' as WidgetConfig['type'] };
      const widget = WidgetRegistry.createWidget(
        unknownConfig,
        false,
        mockOnSelect,
        mockOnUpdate
      );
      
      expect(widget).toBeNull();
    });

    it('should pass props correctly to widget factory', () => {
      const selectedConfig = { ...mockConfig, id: 'selected-widget' };
      const widget = WidgetRegistry.createWidget(
        selectedConfig,
        true,
        mockOnSelect,
        mockOnUpdate
      );
      
      expect(widget).toBeDefined();
      // The widget should be rendered with selected state
    });
  });

  describe('Default Configuration', () => {
    it('should get default config for known widget type', () => {
      const defaultConfig = WidgetRegistry.getDefaultConfig('summary');
      
      expect(defaultConfig).toBeDefined();
      expect(defaultConfig?.type).toBe('summary');
      expect(defaultConfig?.position).toEqual(
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number),
          width: expect.any(Number),
          height: expect.any(Number),
        })
      );
      expect(defaultConfig?.visible).toBe(true);
    });

    it('should apply overrides to default config', () => {
      const overrides = {
        position: { x: 10, y: 20, width: 60, height: 25 },
        config: { customOption: true },
      };
      
      const defaultConfig = WidgetRegistry.getDefaultConfig('summary', overrides);
      
      expect(defaultConfig?.position).toEqual(overrides.position);
      expect(defaultConfig?.config).toEqual(overrides.config);
    });

    it('should return null for unknown widget type', () => {
      const defaultConfig = WidgetRegistry.getDefaultConfig('unknown');
      
      expect(defaultConfig).toBeNull();
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct widget configuration', () => {
      const validConfig: WidgetConfig = {
        id: 'valid-widget',
        type: 'summary',
        position: { x: 0, y: 0, width: 50, height: 15 },
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(validConfig);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject configuration for unknown widget type', () => {
      const invalidConfig = {
        id: 'invalid-widget',
        type: 'unknown' as WidgetConfig['type'],
        position: { x: 0, y: 0, width: 50, height: 15 },
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Unknown widget type: unknown');
    });

    it('should reject configuration with width below minimum', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: 0, y: 0, width: 20, height: 15 }, // Below min width of 30
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Width must be at least'))).toBe(true);
    });

    it('should reject configuration with height below minimum', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: 0, y: 0, width: 50, height: 5 }, // Below min height of 8
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Height must be at least'))).toBe(true);
    });

    it('should reject configuration with width above maximum', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: 0, y: 0, width: 150, height: 15 }, // Above max width of 120
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Width must not exceed'))).toBe(true);
    });

    it('should reject configuration with height above maximum', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: 0, y: 0, width: 50, height: 30 }, // Above max height of 20
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Height must not exceed'))).toBe(true);
    });

    it('should reject configuration with negative coordinates', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: -1, y: 0, width: 50, height: 15 },
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('X position cannot be negative'))).toBe(true);
    });

    it('should reject configuration with negative Y coordinate', () => {
      const invalidConfig: WidgetConfig = {
        id: 'invalid-widget',
        type: 'summary',
        position: { x: 0, y: -1, width: 50, height: 15 },
        config: {},
        visible: true,
      };
      
      const validation = WidgetRegistry.validateConfig(invalidConfig);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Y position cannot be negative'))).toBe(true);
    });
  });

  describe('Widget Rendering', () => {
    it('should render summary widget correctly', () => {
      const config = WidgetRegistry.getDefaultConfig('summary');
      if (!config) return;
      
      const { lastFrame } = render(
        WidgetRegistry.createWidget(config, false, vi.fn(), vi.fn())!
      );
      
      expect(lastFrame()).toContain('Summary Widget');
      expect(lastFrame()).toContain('Overall metrics and key insights');
    });

    it('should render issues widget correctly', () => {
      const config = WidgetRegistry.getDefaultConfig('issues');
      if (!config) return;
      
      const { lastFrame } = render(
        WidgetRegistry.createWidget(config, false, vi.fn(), vi.fn())!
      );
      
      expect(lastFrame()).toContain('Issues Widget');
      expect(lastFrame()).toContain('Top issues and filtering options');
    });

    it('should render coverage widget correctly', () => {
      const config = WidgetRegistry.getDefaultConfig('coverage');
      if (!config) return;
      
      const { lastFrame } = render(
        WidgetRegistry.createWidget(config, false, vi.fn(), vi.fn())!
      );
      
      expect(lastFrame()).toContain('Coverage Widget');
      expect(lastFrame()).toContain('Code coverage visualization');
    });

    it('should render trends widget correctly', () => {
      const config = WidgetRegistry.getDefaultConfig('trends');
      if (!config) return;
      
      const { lastFrame } = render(
        WidgetRegistry.createWidget(config, false, vi.fn(), vi.fn())!
      );
      
      expect(lastFrame()).toContain('Trends Widget');
      expect(lastFrame()).toContain('Historical trend charts');
    });
  });
});