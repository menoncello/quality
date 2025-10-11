/**
 * Layout persistence service for file-based storage operations
 */

import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync, writeFileSync, readFileSync, unlinkSync, readdirSync } from 'fs';
import type { DashboardLayout, FilterState } from '../types/dashboard';

export class LayoutPersistenceService {
  private layoutsDir: string;
  private filterPresetsDir: string;

  constructor() {
    // Store layouts in user's home directory under .dev-quality
    const appDir = join(homedir(), '.dev-quality');
    if (!existsSync(appDir)) {
      mkdirSync(appDir, { recursive: true });
    }
    
    this.layoutsDir = join(appDir, 'layouts');
    this.filterPresetsDir = join(appDir, 'filter-presets');
    
    if (!existsSync(this.layoutsDir)) {
      mkdirSync(this.layoutsDir, { recursive: true });
    }
    
    if (!existsSync(this.filterPresetsDir)) {
      mkdirSync(this.filterPresetsDir, { recursive: true });
    }
  }

  /**
   * Initialize storage directories
   */
  initialize(): void {
    // Directories are created in constructor
  }

  /**
   * Close storage (no-op for file-based storage)
   */
  close(): void {
    // No cleanup needed for file-based storage
  }

  private getLayoutPath(name: string): string {
    return join(this.layoutsDir, `${name}.json`);
  }

  private getFilterPresetPath(name: string): string {
    return join(this.filterPresetsDir, `${name}.json`);
  }

  /**
   * Save a dashboard layout to file
   */
  saveLayout(layout: DashboardLayout): boolean {
    try {
      const layoutPath = this.getLayoutPath(layout.name);
      const layoutData = {
        id: layout.id,
        name: layout.name,
        description: layout.description,
        isPreset: layout.isPreset,
        widgets: layout.widgets,
        createdAt: layout.createdAt.toISOString(),
        updatedAt: new Date().toISOString(),
      };

      writeFileSync(layoutPath, JSON.stringify(layoutData, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Failed to save layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load a dashboard layout from file by name
   */
  loadLayout(name: string): DashboardLayout | null {
    try {
      const layoutPath = this.getLayoutPath(name);
      if (!existsSync(layoutPath)) return null;

      const layoutData = JSON.parse(readFileSync(layoutPath, 'utf-8'));

      return {
        id: layoutData.id,
        name: layoutData.name,
        description: layoutData.description,
        isPreset: layoutData.isPreset,
        widgets: layoutData.widgets,
        createdAt: new Date(layoutData.createdAt),
        updatedAt: new Date(layoutData.updatedAt),
      };
    } catch (error) {
      throw new Error(`Failed to load layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all available layouts
   */
  getAllLayouts(): DashboardLayout[] {
    try {
      const files = readdirSync(this.layoutsDir);
      const layouts: DashboardLayout[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const layoutName = file.replace('.json', '');
          const layout = this.loadLayout(layoutName);
          if (layout) {
            layouts.push(layout);
          }
        }
      }

      return layouts.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to get all layouts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a layout by name
   */
  deleteLayout(name: string): boolean {
    try {
      const layoutPath = this.getLayoutPath(name);
      if (!existsSync(layoutPath)) return false;

      unlinkSync(layoutPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export layout to JSON string
   */
  exportLayout(name: string): string | null {
    const layout = this.loadLayout(name);
    if (!layout) return null;

    return JSON.stringify(layout, null, 2);
  }

  /**
   * Import layout from JSON string
   */
  importLayout(layoutJson: string): DashboardLayout | null {
    try {
      const layoutData = JSON.parse(layoutJson);
      
      // Validate layout structure
      if (!layoutData.id || !layoutData.name || !Array.isArray(layoutData.widgets)) {
        throw new Error('Invalid layout structure');
      }

      const layout: DashboardLayout = {
        id: layoutData.id,
        name: layoutData.name,
        description: layoutData.description,
        isPreset: layoutData.isPreset ?? false,
        widgets: layoutData.widgets,
        createdAt: new Date(layoutData.createdAt),
        updatedAt: new Date(layoutData.updatedAt),
      };

      // Save imported layout
      this.saveLayout(layout);
      return layout;
    } catch (error) {
      throw new Error(`Failed to import layout: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Save filter preset
   */
  saveFilterPreset(name: string, description: string | null, filterConfig: FilterState, isGlobal: boolean = false): boolean {
    try {
      const presetPath = this.getFilterPresetPath(name);
      const presetData = {
        name,
        description,
        config: filterConfig,
        isGlobal,
        createdAt: new Date().toISOString(),
      };

      writeFileSync(presetPath, JSON.stringify(presetData, null, 2));
      return true;
    } catch (error) {
      throw new Error(`Failed to save filter preset: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Load filter preset
   */
  loadFilterPreset(name: string): FilterState | null {
    try {
      const presetPath = this.getFilterPresetPath(name);
      if (!existsSync(presetPath)) return null;

      const presetData = JSON.parse(readFileSync(presetPath, 'utf-8'));
      return presetData.config;
    } catch (error) {
      throw new Error(`Failed to load filter preset: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get all filter presets
   */
  getAllFilterPresets(): Array<{ name: string; description: string | null; config: FilterState; isGlobal: boolean }> {
    try {
      const files = readdirSync(this.filterPresetsDir);
      const presets: Array<{ name: string; description: string | null; config: FilterState; isGlobal: boolean }> = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const presetPath = join(this.filterPresetsDir, file);
          const presetData = JSON.parse(readFileSync(presetPath, 'utf-8'));
          presets.push({
            name: presetData.name,
            description: presetData.description,
            config: presetData.config,
            isGlobal: presetData.isGlobal,
          });
        }
      }

      return presets.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error(`Failed to get all filter presets: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete filter preset
   */
  deleteFilterPreset(name: string): boolean {
    try {
      const presetPath = this.getFilterPresetPath(name);
      if (!existsSync(presetPath)) return false;

      unlinkSync(presetPath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete filter preset: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): { layouts: number; filterPresets: number } {
    try {
      const layoutFiles = readdirSync(this.layoutsDir).filter(f => f.endsWith('.json'));
      const presetFiles = readdirSync(this.filterPresetsDir).filter(f => f.endsWith('.json'));

      return {
        layouts: layoutFiles.length,
        filterPresets: presetFiles.length,
      };
    } catch (error) {
      throw new Error(`Failed to get storage stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Singleton instance
export const layoutPersistenceService = new LayoutPersistenceService();