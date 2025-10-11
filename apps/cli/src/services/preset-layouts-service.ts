/**
 * Preset layouts service providing predefined dashboard layouts
 */

import type { DashboardLayout, WidgetConfig } from '../types/dashboard';
import { WidgetRegistry } from '../components/dashboard/widget-registry';

export class PresetLayoutsService {
  private presetLayouts: Map<string, DashboardLayout> = new Map();

  constructor() {
    this.initializePresetLayouts();
  }

  private initializePresetLayouts(): void {
    // Developer-focused layout
    this.presetLayouts.set('developer', this.createDeveloperLayout());
    
    // Manager-focused layout
    this.presetLayouts.set('manager', this.createManagerLayout());
    
    // CI/CD-focused layout
    this.presetLayouts.set('cicd', this.createCICDLayout());
    
    // Security-focused layout
    this.presetLayouts.set('security', this.createSecurityLayout());
    
    // Performance-focused layout
    this.presetLayouts.set('performance', this.createPerformanceLayout());
    
    // Minimal layout
    this.presetLayouts.set('minimal', this.createMinimalLayout());
  }

  private createDeveloperLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'dev-summary',
      position: { x: 0, y: 0, width: 40, height: 12 },
      config: { refreshInterval: 15000, showDetails: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'dev-issues',
      position: { x: 45, y: 0, width: 55, height: 20 },
      config: { maxItems: 20, showPriority: true, showFixable: true },
    });
    
    const coverageWidget = WidgetRegistry.getDefaultConfig('coverage', {
      id: 'dev-coverage',
      position: { x: 0, y: 14, width: 40, height: 15 },
      config: { showUncovered: true, threshold: 80, highlightCritical: true },
    });
    
    const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
      id: 'dev-trends',
      position: { x: 45, y: 22, width: 55, height: 12 },
      config: { timeframe: '14d', showMetrics: ['score', 'issues', 'coverage'] },
    });

    return {
      id: 'developer-preset',
      name: 'Developer Layout',
      description: 'Focused on code quality, issues, and coverage for developers',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget, coverageWidget, trendsWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createManagerLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'mgr-summary',
      position: { x: 0, y: 0, width: 50, height: 10 },
      config: { refreshInterval: 30000, showDetails: false, showTrends: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'mgr-issues',
      position: { x: 55, y: 0, width: 45, height: 15 },
      config: { maxItems: 10, showPriority: true, groupBy: 'severity' },
    });
    
    const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
      id: 'mgr-trends',
      position: { x: 0, y: 12, width: 100, height: 18 },
      config: { timeframe: '30d', showMetrics: ['score', 'issues', 'coverage', 'technicalDebt'] },
    });

    return {
      id: 'manager-preset',
      name: 'Manager Layout',
      description: 'High-level overview focusing on trends and team metrics',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget, trendsWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createCICDLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'cicd-summary',
      position: { x: 0, y: 0, width: 35, height: 8 },
      config: { refreshInterval: 10000, showBuildStatus: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'cicd-issues',
      position: { x: 40, y: 0, width: 60, height: 12 },
      config: { maxItems: 15, showBlocking: true, groupBy: 'tool' },
    });
    
    const coverageWidget = WidgetRegistry.getDefaultConfig('coverage', {
      id: 'cicd-coverage',
      position: { x: 0, y: 10, width: 45, height: 15 },
      config: { showUncovered: true, threshold: 85, enforceThreshold: true },
    });
    
    const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
      id: 'cicd-trends',
      position: { x: 50, y: 14, width: 50, height: 12 },
      config: { timeframe: '7d', showMetrics: ['buildTime', 'testTime', 'coverage'] },
    });

    return {
      id: 'cicd-preset',
      name: 'CI/CD Layout',
      description: 'Optimized for build pipelines and deployment monitoring',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget, coverageWidget, trendsWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createSecurityLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'sec-summary',
      position: { x: 0, y: 0, width: 40, height: 10 },
      config: { refreshInterval: 20000, showSecurityScore: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'sec-issues',
      position: { x: 45, y: 0, width: 55, height: 20 },
      config: { maxItems: 25, showSecurityOnly: true, groupBy: 'severity', showCWE: true },
    });
    
    const coverageWidget = WidgetRegistry.getDefaultConfig('coverage', {
      id: 'sec-coverage',
      position: { x: 0, y: 12, width: 40, height: 15 },
      config: { showUncovered: true, threshold: 90, highlightSecurity: true },
    });
    
    const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
      id: 'sec-trends',
      position: { x: 45, y: 22, width: 55, height: 10 },
      config: { timeframe: '30d', showMetrics: ['vulnerabilities', 'securityScore', 'compliance'] },
    });

    return {
      id: 'security-preset',
      name: 'Security Layout',
      description: 'Focused on security vulnerabilities and compliance metrics',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget, coverageWidget, trendsWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createPerformanceLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'perf-summary',
      position: { x: 0, y: 0, width: 35, height: 8 },
      config: { refreshInterval: 15000, showPerformanceMetrics: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'perf-issues',
      position: { x: 40, y: 0, width: 60, height: 15 },
      config: { maxItems: 15, showPerformanceOnly: true, groupBy: 'impact' },
    });
    
    const coverageWidget = WidgetRegistry.getDefaultConfig('coverage', {
      id: 'perf-coverage',
      position: { x: 0, y: 10, width: 45, height: 12 },
      config: { showUncovered: true, threshold: 80, showPerformance: true },
    });
    
    const trendsWidget = WidgetRegistry.getDefaultConfig('trends', {
      id: 'perf-trends',
      position: { x: 50, y: 17, width: 50, height: 12 },
      config: { timeframe: '14d', showMetrics: ['responseTime', 'throughput', 'memory'] },
    });

    return {
      id: 'performance-preset',
      name: 'Performance Layout',
      description: 'Optimized for performance monitoring and bottlenecks',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget, coverageWidget, trendsWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createMinimalLayout(): DashboardLayout {
    const summaryWidget = WidgetRegistry.getDefaultConfig('summary', {
      id: 'min-summary',
      position: { x: 0, y: 0, width: 50, height: 8 },
      config: { refreshInterval: 30000, showEssential: true },
    });
    
    const issuesWidget = WidgetRegistry.getDefaultConfig('issues', {
      id: 'min-issues',
      position: { x: 55, y: 0, width: 45, height: 12 },
      config: { maxItems: 5, showCriticalOnly: true },
    });

    return {
      id: 'minimal-preset',
      name: 'Minimal Layout',
      description: 'Clean, minimal layout showing only essential information',
      isPreset: true,
      widgets: [summaryWidget, issuesWidget].filter((widget): widget is WidgetConfig => widget !== null),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get all available preset layouts
   */
  getAllPresetLayouts(): DashboardLayout[] {
    return Array.from(this.presetLayouts.values());
  }

  /**
   * Get a specific preset layout by name
   */
  getPresetLayout(name: string): DashboardLayout | null {
    return this.presetLayouts.get(name) ?? null;
  }

  /**
   * Get preset layout names with descriptions
   */
  getPresetLayoutDescriptions(): Array<{ name: string; description: string }> {
    return Array.from(this.presetLayouts.values()).map(layout => ({
      name: layout.name,
      description: layout.description ?? '',
    }));
  }

  /**
   * Check if a layout name is a preset
   */
  isPresetLayout(name: string): boolean {
    return this.presetLayouts.has(name);
  }

  /**
   * Create a custom layout based on a preset
   */
  createFromPreset(presetName: string, customName: string, customDescription?: string): DashboardLayout | null {
    const presetLayout = this.getPresetLayout(presetName);
    if (!presetLayout) return null;

    return {
      ...presetLayout,
      id: `custom-${Date.now()}`,
      name: customName,
      description: customDescription ?? `Custom layout based on ${presetLayout.name}`,
      isPreset: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Get recommended preset based on project characteristics
   */
  getRecommendedPreset(projectStats: {
    totalIssues: number;
    criticalIssues: number;
    coverage: number;
    securityIssues: number;
    performanceIssues: number;
    teamSize: number;
  }): string {
    const { criticalIssues, coverage, securityIssues, performanceIssues, teamSize } = projectStats;

    // Decision logic for recommendation
    if (securityIssues > 10) {
      return 'security';
    }
    
    if (performanceIssues > 10) {
      return 'performance';
    }
    
    if (teamSize > 10) {
      return 'manager';
    }
    
    if (coverage < 70) {
      return 'developer';
    }
    
    if (criticalIssues > 5) {
      return 'cicd';
    }
    
    return 'minimal';
  }
}

// Singleton instance
export const presetLayoutsService = new PresetLayoutsService();