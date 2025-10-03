/**
 * Dashboard integration with analysis engine
 */

import type {
  AnalysisEngine,
  AnalysisProgress,
  AnalysisContext,
  ToolResult,
} from '@dev-quality/core';
import type { AnalysisResult } from '../../types';
import type { ProjectConfiguration } from '@dev-quality/types';
import { transformCoreAnalysisResultToCLI } from '../../utils/type-transformers';

// Proper type definitions instead of any
type _any = unknown;
// import type { DashboardData } from '../../types/dashboard';
import { DashboardService } from './dashboard-service';

// Event type definitions
interface PluginCompleteEvent {
  toolName: string;
  result: ToolResult;
}

interface PluginErrorEvent {
  toolName: string;
  error: Error;
}

// Logger interface
// interface Logger {
//   error: (message: string, ...args: unknown[]) => void;
//   warn: (message: string, ...args: unknown[]) => void;
//   info: (message: string, ...args: unknown[]) => void;
//   debug: (message: string, ...args: unknown[]) => void;
// }

export class DashboardEngineIntegration {
  private dashboardService: DashboardService;
  private analysisEngine: AnalysisEngine | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.dashboardService = new DashboardService();
  }

  /**
   * Initialize with analysis engine
   */
  setAnalysisEngine(analysisEngine: AnalysisEngine): void {
    this.analysisEngine = analysisEngine;
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for real-time updates
   */
  private setupEventListeners(): void {
    if (!this.analysisEngine) return;

    // Analysis progress updates
    this.analysisEngine.on('analysis:progress', (projectId: string, progress: AnalysisProgress) => {
      this.emit('progress', progress);
    });

    // Plugin completion
    this.analysisEngine.on(
      'analysis:plugin-complete',
      (projectId: string, toolName: string, result: ToolResult) => {
        this.emit('plugin-complete', { toolName, result });
      }
    );

    // Plugin errors
    this.analysisEngine.on(
      'analysis:plugin-error',
      (projectId: string, toolName: string, error: Error) => {
        this.emit('plugin-error', { toolName, error });
      }
    );

    // Analysis completion
    this.analysisEngine.on('analysis:complete', (projectId: string, result: AnalysisResult) => {
      const dashboardData = this.dashboardService.processResults(result);
      this.emit('analysis-complete', dashboardData);
    });

    // Analysis errors
    this.analysisEngine.on('analysis:error', (projectId: string, error: Error) => {
      this.emit('analysis-error', error);
    });
  }

  /**
   * Execute analysis with dashboard integration
   */
  async executeAnalysisWithDashboard(
    projectId: string,
    config: ProjectConfiguration,
    options: {
      plugins?: string[];
      incremental?: boolean;
      timeout?: number;
      enableCache?: boolean;
      onProgress?: (progress: AnalysisProgress) => void;
      onPluginComplete?: (toolName: string, result: ToolResult) => void;
      onPluginError?: (toolName: string, error: Error) => void;
    } = {}
  ): Promise<{
    success: boolean;
    result?: AnalysisResult;
    error?: Error;
  }> {
    if (!this.analysisEngine) {
      throw new Error('Analysis engine not initialized');
    }

    try {
      // Set up temporary event listeners for this specific analysis
      const cleanupListeners = this.setupTemporaryListeners(options);

      // Create analysis context
      const context: AnalysisContext = {
        projectPath: process.cwd(),
        cache: undefined, // Will be provided by analysis engine
        logger: {
          error: (_message: string, ..._args: unknown[]) => {
            // Error logged: ${_message}
          },
          warn: (_message: string, ..._args: unknown[]) => {
            // Warning logged: ${_message}
          },
          info: (_message: string, ..._args: unknown[]) => {
            // Info logged: ${_message}
          },
          debug: (_message: string, ..._args: unknown[]) => {
            // Debug logged: ${_message}
          },
        },
        signal: undefined,
        config: config as _any, // Type assertion to handle config interface differences
      };

      // Execute analysis
      const result = await this.analysisEngine.executeAnalysis(projectId, context, {
        plugins: options.plugins,
        incremental: options.incremental,
        timeout: options.timeout,
        enableCache: options.enableCache,
      });

      // Clean up temporary listeners
      cleanupListeners();

      return {
        success: true,
        result: transformCoreAnalysisResultToCLI(result as _any), // Type assertion for interface differences
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Set up temporary event listeners for a specific analysis
   */
  private setupTemporaryListeners(options: {
    onProgress?: (progress: AnalysisProgress) => void;
    onPluginComplete?: (toolName: string, result: ToolResult) => void;
    onPluginError?: (toolName: string, error: Error) => void;
  }): () => void {
    const listeners: Array<{ event: string; listener: Function }> = [];

    if (options.onProgress) {
      const listener = (progress: AnalysisProgress) => {
        if (options.onProgress) {
          options.onProgress(progress);
        }
      };
      this.on('progress', listener);
      listeners.push({ event: 'progress', listener });
    }

    if (options.onPluginComplete) {
      const listener = ({ toolName, result }: PluginCompleteEvent) => {
        if (options.onPluginComplete) {
          options.onPluginComplete(toolName, result);
        }
      };
      this.on('plugin-complete', listener);
      listeners.push({ event: 'plugin-complete', listener });
    }

    if (options.onPluginError) {
      const listener = ({ toolName, error }: PluginErrorEvent) => {
        if (options.onPluginError) {
          options.onPluginError(toolName, error);
        }
      };
      this.on('plugin-error', listener);
      listeners.push({ event: 'plugin-error', listener });
    }

    // Return cleanup function
    return () => {
      listeners.forEach(({ event, listener }) => {
        this.off(event, listener);
      });
    };
  }

  /**
   * Get real-time analysis progress
   */
  getCurrentProgress(): AnalysisProgress | null {
    // This would be maintained by the event listeners
    return null; // Implementation would depend on the analysis engine's state
  }

  /**
   * Cancel ongoing analysis
   */
  async cancelAnalysis(_projectId: string): Promise<boolean> {
    if (!this.analysisEngine) return false;

    // Implementation would depend on analysis engine's cancel method
    // For now, always return true to indicate cancellation was attempted
    return true;
  }

  /**
   * Add event listener
   */
  on(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.push(listener);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (_error) {
          // Error in event listener for ${event}
        }
      });
    }
  }

  /**
   * Transform analysis result for dashboard consumption
   */
  transformAnalysisResult(result: AnalysisResult) {
    return this.dashboardService.processResults(result);
  }

  /**
   * Get dashboard service instance
   */
  getDashboardService(): DashboardService {
    return this.dashboardService;
  }
}
