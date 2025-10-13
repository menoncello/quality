/**
 * Unit tests for LayoutPersistenceService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'bun:test';
import type { DashboardLayout } from '../../../src/types/dashboard';

// Mock file system operations at module level
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
  readFileSync: vi.fn(),
  unlinkSync: vi.fn(),
  readdirSync: vi.fn(),
}));

// Mock path and os modules
vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

vi.mock('os', () => ({
  homedir: vi.fn(() => '/mock/home'),
}));

// Import the mocked modules
import * as fs from 'fs';
import { LayoutPersistenceService } from '../../../src/services/layout-persistence-service';

describe('LayoutPersistenceService', () => {
  const mockAppDir = '/mock/home/.dev-quality';
  const mockLayoutsDir = '/mock/home/.dev-quality/layouts';
  const mockFilterPresetsDir = '/mock/home/.dev-quality/filter-presets';

  // Mock test data
  const mockLayout: DashboardLayout = {
    id: 'test-layout',
    name: 'Test Layout',
    description: 'A test layout for unit testing',
    isPreset: false,
    widgets: [
      {
        id: 'widget-1',
        type: 'summary',
        position: { x: 0, y: 0, width: 50, height: 15 },
        config: { refreshInterval: 30000 },
        visible: true,
      },
      {
        id: 'widget-2',
        type: 'issues',
        position: { x: 55, y: 0, width: 45, height: 20 },
        config: { maxItems: 10 },
        visible: true,
      },
    ],
    createdAt: new Date('2023-01-01T00:00:00.000Z'),
    updatedAt: new Date('2023-01-02T00:00:00.000Z'),
  };

  let service: LayoutPersistenceService;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    (fs.existsSync as any).mockImplementation((path: string) => {
      if (path.includes('.dev-quality')) {
        return true;
      }
      if (path.includes('test-layout.json')) {
        return true;
      }
      return false;
    });

    (fs.mkdirSync as any).mockImplementation(() => undefined);

    (fs.readdirSync as any).mockImplementation(() => [
      'test-layout.json',
      'another-layout.json',
    ]);

    (fs.writeFileSync as any).mockImplementation(() => undefined);

    (fs.readFileSync as any).mockImplementation((path: string) => {
      if (path.includes('Test Layout.json')) {
        return JSON.stringify({
          id: mockLayout.id,
          name: mockLayout.name,
          description: mockLayout.description,
          isPreset: mockLayout.isPreset,
          widgets: mockLayout.widgets,
          createdAt: mockLayout.createdAt.toISOString(),
          updatedAt: mockLayout.updatedAt.toISOString(),
        });
      }
      if (path.includes('another-layout.json')) {
        return JSON.stringify({
          id: 'another-layout',
          name: 'Another Layout',
          description: 'Another test layout',
          isPreset: false,
          widgets: [],
          createdAt: new Date('2023-01-01T00:00:00.000Z').toISOString(),
          updatedAt: new Date('2023-01-02T00:00:00.000Z').toISOString(),
        });
      }
      return '{}';
    });

    (fs.unlinkSync as any).mockImplementation(() => undefined);

    // Create a new service instance to use our mocks
    service = new LayoutPersistenceService();
  });

  afterEach(() => {
    service.close();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create app directory if it does not exist', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('.dev-quality') && !path.includes('layouts') && !path.includes('filter-presets')) {
          return false;
        }
        return true;
      });

      // Create a new service instance to test initialization
      const _service = new LayoutPersistenceService();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.dev-quality'),
        { recursive: true }
      );
    });

    it('should create layouts directory if it does not exist', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('.dev-quality/layouts')) {
          return false;
        }
        return true;
      });

      // Create a new service instance to test initialization
      const _service = new LayoutPersistenceService();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.dev-quality/layouts'),
        { recursive: true }
      );
    });

    it('should create filter presets directory if it does not exist', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('.dev-quality/filter-presets')) {
          return false;
        }
        return true;
      });

      // Create a new service instance to test initialization
      const _service = new LayoutPersistenceService();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.dev-quality/filter-presets'),
        { recursive: true }
      );
    });
  });

  describe('Layout Operations', () => {
    it('should save a layout to file', () => {
      const result = service.saveLayout(mockLayout);

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('Test Layout.json'),
        expect.stringContaining('"name": "Test Layout"')
      );
    });

    it('should load a layout from file', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('Test Layout.json')) return true;
        return false;
      });

      const layout = service.loadLayout('Test Layout');

      expect(layout).toEqual(mockLayout);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('Test Layout.json'),
        'utf-8'
      );
    });

    it('should return null when loading non-existent layout', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('non-existent.json')) return false;
        return true;
      });

      const layout = service.loadLayout('non-existent');

      expect(layout).toBeNull();
    });

    it('should get all layouts', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('Test Layout.json')) return true;
        if (path.includes('another-layout.json')) return true;
        return false;
      });

      const layouts = service.getAllLayouts();

      expect(layouts).toHaveLength(1);
      expect(layouts[0].name).toBe('Another Layout');
      expect(fs.readdirSync).toHaveBeenCalledWith(
        expect.stringContaining('layouts')
      );
    });

    it('should delete a layout', () => {
      const result = service.deleteLayout('Test Layout');

      expect(result).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('Test Layout.json')
      );
    });

    it('should return false when deleting non-existent layout', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('non-existent.json')) return false;
        return true;
      });

      const result = service.deleteLayout('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('Import/Export Operations', () => {
    it('should export layout to JSON string', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('Test Layout.json')) return true;
        return false;
      });

      const exported = service.exportLayout('Test Layout');

      expect(exported).toContain('"name": "Test Layout"');
      expect(exported).toContain('"id": "test-layout"');
    });

    it('should return null when exporting non-existent layout', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('non-existent.json')) return false;
        return true;
      });

      const exported = service.exportLayout('non-existent');

      expect(exported).toBeNull();
    });

    it('should import layout from JSON string', () => {
      const layoutJson = JSON.stringify(mockLayout);

      const imported = service.importLayout(layoutJson);

      expect(imported).toEqual(mockLayout);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should throw error when importing invalid JSON', () => {
      expect(() => {
        service.importLayout('invalid json');
      }).toThrow('Failed to import layout');
    });

    it('should throw error when importing layout with invalid structure', () => {
      const invalidLayout = {
        // Missing required fields
        name: 'Invalid Layout',
      };

      expect(() => {
        service.importLayout(JSON.stringify(invalidLayout));
      }).toThrow('Invalid layout structure');
    });
  });

  describe('Filter Preset Operations', () => {
    it('should save a filter preset', () => {
      const filterConfig = {
        severity: ['error', 'warning'],
        tools: ['eslint', 'typescript'],
      };

      const result = service.saveFilterPreset(
        'test-preset',
        'Test filter preset',
        filterConfig,
        false
      );

      expect(result).toBe(true);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-preset.json'),
        expect.stringContaining('"name": "test-preset"')
      );
    });

    it('should load a filter preset', () => {
      const filterConfig = {
        severity: ['error', 'warning'],
        tools: ['eslint', 'typescript'],
      };

      (fs.readFileSync as any).mockImplementation((path: string) => {
        if (path.includes('test-preset.json')) {
          return JSON.stringify({
            name: 'test-preset',
            description: 'Test filter preset',
            config: filterConfig,
            isGlobal: false,
            createdAt: new Date().toISOString(),
          });
        }
        return '{}';
      });

      const preset = service.loadFilterPreset('test-preset');

      expect(preset).toEqual(filterConfig);
    });

    it('should return null when loading non-existent filter preset', () => {
      (fs.existsSync as any).mockImplementation((path: string) => {
        if (path.includes('non-existent.json')) return false;
        return true;
      });

      const preset = service.loadFilterPreset('non-existent');

      expect(preset).toBeNull();
    });

    it('should delete a filter preset', () => {
      const result = service.deleteFilterPreset('test-preset');

      expect(result).toBe(true);
      expect(fs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('test-preset.json')
      );
    });
  });

  describe('Statistics', () => {
    it('should get storage statistics', () => {
      (fs.readdirSync as any).mockImplementation((path: string) => {
        if (path.includes('layouts')) {
          return ['layout1.json', 'layout2.json', 'layout3.json'];
        }
        if (path.includes('filter-presets')) {
          return ['preset1.json', 'preset2.json'];
        }
        return [];
      });

      const stats = service.getStats();

      expect(stats.layouts).toBe(3);
      expect(stats.filterPresets).toBe(2);
    });
  });
});