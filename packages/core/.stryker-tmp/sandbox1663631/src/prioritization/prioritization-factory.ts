import { IssuePrioritizationEngine, IssuePrioritizationEngineFactory } from './issue-prioritization-engine';
import { IssuePrioritizationEngineImpl } from './prioritization-engine-impl';
import { PrioritizationConfiguration } from '@dev-quality/types';

/**
 * Factory for creating Issue Prioritization Engine instances
 * Provides different initialization methods and configurations
 */
export class IssuePrioritizationEngineFactoryImpl implements IssuePrioritizationEngineFactory {

  /**
   * Create engine with custom configuration
   */
  async createEngine(config?: Partial<PrioritizationConfiguration>): Promise<IssuePrioritizationEngine> {
    return new IssuePrioritizationEngineImpl(config);
  }

  /**
   * Create engine with default configuration
   */
  async createEngineWithDefaults(): Promise<IssuePrioritizationEngine> {
    return new IssuePrioritizationEngineImpl();
  }

  /**
   * Create engine optimized for performance
   */
  async createPerformanceOptimizedEngine(): Promise<IssuePrioritizationEngine> {
    const config: Partial<PrioritizationConfiguration> = {
      algorithm: 'weighted',
      mlSettings: {
        enabled: false,
        confidenceThreshold: 0.8,
        retrainingThreshold: 200
      },
      rules: {
        enabled: false,
        autoOptimize: false,
        conflictResolution: 'first-match'
      },
      caching: {
        enabled: true,
        ttl: 7200, // 2 hours
        maxSize: 200
      }
    };

    return new IssuePrioritizationEngineImpl(config);
  }

  /**
   * Create engine optimized for accuracy
   */
  async createAccuracyOptimizedEngine(): Promise<IssuePrioritizationEngine> {
    const config: Partial<PrioritizationConfiguration> = {
      algorithm: 'ml-enhanced',
      weights: {
        severity: 0.35,
        impact: 0.30,
        effort: 0.15,
        businessValue: 0.20
      },
      mlSettings: {
        enabled: true,
        confidenceThreshold: 0.6,
        retrainingThreshold: 50
      },
      rules: {
        enabled: true,
        autoOptimize: true,
        conflictResolution: 'combine'
      },
      caching: {
        enabled: true,
        ttl: 1800, // 30 minutes
        maxSize: 50
      }
    };

    return new IssuePrioritizationEngineImpl(config);
  }

  /**
   * Create engine for small projects
   */
  async createSmallProjectEngine(): Promise<IssuePrioritizationEngine> {
    const config: Partial<PrioritizationConfiguration> = {
      algorithm: 'weighted',
      weights: {
        severity: 0.4,
        impact: 0.3,
        effort: 0.2,
        businessValue: 0.1
      },
      mlSettings: {
        enabled: false,
        confidenceThreshold: 0.8,
        retrainingThreshold: 500
      },
      rules: {
        enabled: true,
        autoOptimize: false,
        conflictResolution: 'first-match'
      },
      caching: {
        enabled: false,
        ttl: 0,
        maxSize: 0
      }
    };

    return new IssuePrioritizationEngineImpl(config);
  }

  /**
   * Create engine for large enterprise projects
   */
  async createEnterpriseEngine(): Promise<IssuePrioritizationEngine> {
    const config: Partial<PrioritizationConfiguration> = {
      algorithm: 'hybrid',
      weights: {
        severity: 0.25,
        impact: 0.25,
        effort: 0.25,
        businessValue: 0.25
      },
      mlSettings: {
        enabled: true,
        confidenceThreshold: 0.7,
        retrainingThreshold: 100
      },
      rules: {
        enabled: true,
        autoOptimize: true,
        conflictResolution: 'highest-weight'
      },
      caching: {
        enabled: true,
        ttl: 3600, // 1 hour
        maxSize: 500
      }
    };

    return new IssuePrioritizationEngineImpl(config);
  }
}