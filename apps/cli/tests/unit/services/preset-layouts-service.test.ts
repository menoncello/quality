/**
 * Unit tests for PresetLayoutsService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { presetLayoutsService } from '../../../src/services/preset-layouts-service';

describe('PresetLayoutsService', () => {
  beforeEach(() => {
    // Reset the service before each test
    // Note: The service is already initialized in the constructor
  });

  describe('Preset Layouts', () => {
    it('should have developer preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('developer');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Developer Layout');
      expect(layout?.description).toBe('Focused on code quality, issues, and coverage for developers');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(4);
    });

    it('should have manager preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('manager');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Manager Layout');
      expect(layout?.description).toBe('High-level overview focusing on trends and team metrics');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(3);
    });

    it('should have CI/CD preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('cicd');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('CI/CD Layout');
      expect(layout?.description).toBe('Optimized for build pipelines and deployment monitoring');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(4);
    });

    it('should have security preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('security');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Security Layout');
      expect(layout?.description).toBe('Focused on security vulnerabilities and compliance metrics');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(4);
    });

    it('should have performance preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('performance');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Performance Layout');
      expect(layout?.description).toBe('Optimized for performance monitoring and bottlenecks');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(4);
    });

    it('should have minimal preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('minimal');
      
      expect(layout).toBeDefined();
      expect(layout?.name).toBe('Minimal Layout');
      expect(layout?.description).toBe('Clean, minimal layout showing only essential information');
      expect(layout?.isPreset).toBe(true);
      expect(layout?.widgets).toHaveLength(2);
    });
  });

  describe('Layout Retrieval', () => {
    it('should return null for unknown preset layout', () => {
      const layout = presetLayoutsService.getPresetLayout('unknown');
      
      expect(layout).toBeNull();
    });

    it('should get all preset layouts', () => {
      const layouts = presetLayoutsService.getAllPresetLayouts();
      
      expect(layouts).toHaveLength(6);
      expect(layouts.map(l => l.name)).toContain('Developer Layout');
      expect(layouts.map(l => l.name)).toContain('Manager Layout');
      expect(layouts.map(l => l.name)).toContain('CI/CD Layout');
      expect(layouts.map(l => l.name)).toContain('Security Layout');
      expect(layouts.map(l => l.name)).toContain('Performance Layout');
      expect(layouts.map(l => l.name)).toContain('Minimal Layout');
    });

    it('should get preset layout descriptions', () => {
      const descriptions = presetLayoutsService.getPresetLayoutDescriptions();
      
      expect(descriptions).toHaveLength(6);
      expect(descriptions.some(d => d.name === 'Developer Layout')).toBe(true);
      expect(descriptions.some(d => d.description?.includes('code quality'))).toBe(true);
    });
  });

  describe('Layout Validation', () => {
    it('should have valid widget configurations in developer layout', () => {
      const layout = presetLayoutsService.getPresetLayout('developer');
      
      expect(layout).toBeDefined();
      expect(layout?.widgets).toHaveLength(4);
      
      // Check that all widgets have valid positions
      layout?.widgets.forEach(widget => {
        expect(widget.position.x).toBeGreaterThanOrEqual(0);
        expect(widget.position.y).toBeGreaterThanOrEqual(0);
        expect(widget.position.width).toBeGreaterThan(0);
        expect(widget.position.height).toBeGreaterThan(0);
        expect(widget.id).toBeDefined();
        expect(widget.type).toBeDefined();
        expect(widget.visible).toBe(true);
      });
    });

    it('should have non-overlapping widget positions in developer layout', () => {
      const layout = presetLayoutsService.getPresetLayout('developer');
      
      expect(layout).toBeDefined();
      
      const positions = layout?.widgets.map(w => w.position) || [];
      
      // Check that widgets don't overlap (simplified check)
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const pos1 = positions[i];
          const pos2 = positions[j];
          
          // Simple check: widgets should not have the exact same position
          if (pos1.x === pos2.x && pos1.y === pos2.y) {
            expect.fail(`Widgets ${i} and ${j} have the same position`);
          }
        }
      }
    });
  });

  describe('Layout Customization', () => {
    it('should create custom layout based on preset', () => {
      const customLayout = presetLayoutsService.createFromPreset(
        'developer',
        'My Custom Layout',
        'A custom layout based on developer preset'
      );
      
      expect(customLayout).toBeDefined();
      expect(customLayout?.name).toBe('My Custom Layout');
      expect(customLayout?.description).toBe('A custom layout based on developer preset');
      expect(customLayout?.isPreset).toBe(false);
      expect(customLayout?.widgets).toHaveLength(4); // Same number of widgets as preset
    });

    it('should return null when creating from unknown preset', () => {
      const customLayout = presetLayoutsService.createFromPreset(
        'unknown',
        'My Custom Layout'
      );
      
      expect(customLayout).toBeNull();
    });
  });

  describe('Layout Recommendations', () => {
    it('should recommend security layout for high security issues', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 20,
        criticalIssues: 2,
        coverage: 85,
        securityIssues: 15,
        performanceIssues: 5,
        teamSize: 5,
      });
      
      expect(recommendation).toBe('security');
    });

    it('should recommend performance layout for high performance issues', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 25,
        criticalIssues: 3,
        coverage: 80,
        securityIssues: 5,
        performanceIssues: 12,
        teamSize: 6,
      });
      
      expect(recommendation).toBe('performance');
    });

    it('should recommend manager layout for large teams', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 30,
        criticalIssues: 2,
        coverage: 75,
        securityIssues: 4,
        performanceIssues: 6,
        teamSize: 15,
      });
      
      expect(recommendation).toBe('manager');
    });

    it('should recommend developer layout for low coverage', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 20,
        criticalIssues: 3,
        coverage: 65,
        securityIssues: 5,
        performanceIssues: 5,
        teamSize: 4,
      });
      
      expect(recommendation).toBe('developer');
    });

    it('should recommend CI/CD layout for many critical issues', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 35,
        criticalIssues: 8,
        coverage: 80,
        securityIssues: 5,
        performanceIssues: 5,
        teamSize: 5,
      });
      
      expect(recommendation).toBe('cicd');
    });

    it('should recommend minimal layout as default', () => {
      const recommendation = presetLayoutsService.getRecommendedPreset({
        totalIssues: 15,
        criticalIssues: 1,
        coverage: 85,
        securityIssues: 3,
        performanceIssues: 2,
        teamSize: 5,
      });
      
      expect(recommendation).toBe('minimal');
    });
  });

  describe('Layout Identification', () => {
    it('should identify preset layouts correctly', () => {
      expect(presetLayoutsService.isPresetLayout('developer')).toBe(true);
      expect(presetLayoutsService.isPresetLayout('manager')).toBe(true);
      expect(presetLayoutsService.isPresetLayout('cicd')).toBe(true);
      expect(presetLayoutsService.isPresetLayout('security')).toBe(true);
      expect(presetLayoutsService.isPresetLayout('performance')).toBe(true);
      expect(presetLayoutsService.isPresetLayout('minimal')).toBe(true);
    });

    it('should not identify custom layouts as presets', () => {
      expect(presetLayoutsService.isPresetLayout('custom-layout')).toBe(false);
      expect(presetLayoutsService.isPresetLayout('my-layout')).toBe(false);
    });
  });
});