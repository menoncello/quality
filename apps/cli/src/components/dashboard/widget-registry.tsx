/**
 * Widget Registry for dynamic widget loading and management
 */

import type { WidgetConfig, WidgetRegistration, WidgetFactory } from './base-widget';
import { BaseWidget } from './base-widget';
import type { ReactElement } from 'react';

class WidgetRegistryImpl {
  private widgets = new Map<string, WidgetRegistration>();
  private instances = new Map<string, WidgetFactory>();

  /**
   * Register a new widget type
   */
  register(registration: WidgetRegistration): void {
    this.widgets.set(registration.type, registration);
  }

  /**
   * Get widget registration by type
   */
  getRegistration(type: string): WidgetRegistration | undefined {
    return this.widgets.get(type);
  }

  /**
   * Get all registered widget types
   */
  getAllRegistrations(): WidgetRegistration[] {
    return Array.from(this.widgets.values());
  }

  /**
   * Create a widget instance
   */
  createWidget(
    config: WidgetConfig,
    isSelected: boolean,
    onSelect: (widgetId: string) => void,
    onUpdate: (widgetId: string, updates: Partial<WidgetConfig>) => void
  ): ReactElement | null {
    const registration = this.widgets.get(config.type);
    if (!registration) {
      return null;
    }

    const factory = registration.factory;
    return factory(config, isSelected, onSelect, onUpdate);
  }

  /**
   * Get default configuration for a widget type
   */
  getDefaultConfig(type: string, overrides: Partial<WidgetConfig> = {}): WidgetConfig | null {
    const registration = this.widgets.get(type);
    if (!registration) {
      return null;
    }

    return {
      id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: type as WidgetConfig['type'],
      position: { x: 0, y: 0, width: 60, height: 15 },
      config: {},
      visible: true,
      ...registration.defaultConfig,
      ...overrides,
    };
  }

  /**
   * Validate widget configuration
   */
  validateConfig(config: WidgetConfig): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const registration = this.widgets.get(config.type);

    if (!registration) {
      errors.push(`Unknown widget type: ${config.type}`);
      return { isValid: false, errors };
    }

    // Validate position
    if (config.position.width < registration.minSize.width) {
      errors.push(`Width must be at least ${registration.minSize.width}`);
    }
    if (config.position.height < registration.minSize.height) {
      errors.push(`Height must be at least ${registration.minSize.height}`);
    }
    if (config.position.width > registration.maxSize.width) {
      errors.push(`Width must not exceed ${registration.maxSize.width}`);
    }
    if (config.position.height > registration.maxSize.height) {
      errors.push(`Height must not exceed ${registration.maxSize.height}`);
    }

    // Validate position coordinates
    if (config.position.x < 0) {
      errors.push('X position cannot be negative');
    }
    if (config.position.y < 0) {
      errors.push('Y position cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get available widget types for user selection
   */
  getAvailableWidgetTypes(): Array<{
    type: string;
    name: string;
    description: string;
  }> {
    return this.getAllRegistrations().map(reg => ({
      type: reg.type,
      name: reg.name,
      description: reg.description,
    }));
  }
}

// Create singleton instance
export const WidgetRegistry = new WidgetRegistryImpl();

// Built-in widget factory functions
export const createSummaryWidget: WidgetFactory = (
  config,
  isSelected,
  onSelect,
  onUpdate
) => {
  return (
    <BaseWidget
      config={config}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
    >
      <SummaryWidgetContent config={config} />
    </BaseWidget>
  );
};

export const createIssuesWidget: WidgetFactory = (
  config,
  isSelected,
  onSelect,
  onUpdate
) => {
  return (
    <BaseWidget
      config={config}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
    >
      <IssuesWidgetContent config={config} />
    </BaseWidget>
  );
};

export const createCoverageWidget: WidgetFactory = (
  config,
  isSelected,
  onSelect,
  onUpdate
) => {
  return (
    <BaseWidget
      config={config}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
    >
      <CoverageWidgetContent config={config} />
    </BaseWidget>
  );
};

export const createTrendsWidget: WidgetFactory = (
  config,
  isSelected,
  onSelect,
  onUpdate
) => {
  return (
    <BaseWidget
      config={config}
      isSelected={isSelected}
      onSelect={onSelect}
      onUpdate={onUpdate}
    >
      <TrendsWidgetContent config={config} />
    </BaseWidget>
  );
};

// Placeholder widget content components (will be implemented separately)
function SummaryWidgetContent({ config }: { config: WidgetConfig }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="cyan">Summary Widget</Text>
      <Text color="gray" dimColor>
        Overall metrics and key insights will be displayed here.
      </Text>
      <Box marginTop={1}>
        <Text>Config: {JSON.stringify(config.config, null, 2)}</Text>
      </Box>
    </Box>
  );
}

function IssuesWidgetContent({ config }: { config: WidgetConfig }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="yellow">Issues Widget</Text>
      <Text color="gray" dimColor>
        Top issues and filtering options will be displayed here.
      </Text>
      <Box marginTop={1}>
        <Text>Config: {JSON.stringify(config.config, null, 2)}</Text>
      </Box>
    </Box>
  );
}

function CoverageWidgetContent({ config }: { config: WidgetConfig }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="green">Coverage Widget</Text>
      <Text color="gray" dimColor>
        Code coverage visualization will be displayed here.
      </Text>
      <Box marginTop={1}>
        <Text>Config: {JSON.stringify(config.config, null, 2)}</Text>
      </Box>
    </Box>
  );
}

function TrendsWidgetContent({ config }: { config: WidgetConfig }): ReactElement {
  return (
    <Box flexDirection="column">
      <Text color="magenta">Trends Widget</Text>
      <Text color="gray" dimColor>
        Historical trend charts will be displayed here.
      </Text>
      <Box marginTop={1}>
        <Text>Config: {JSON.stringify(config.config, null, 2)}</Text>
      </Box>
    </Box>
  );
}

// Import Box and Text components
import { Box, Text } from 'ink';

// Register built-in widgets
WidgetRegistry.register({
  type: 'summary',
  name: 'Summary',
  description: 'Overall metrics and key insights',
  factory: createSummaryWidget,
  defaultConfig: {
    position: { x: 0, y: 0, width: 60, height: 10 },
    config: { refreshInterval: 30000 },
  },
  minSize: { width: 30, height: 8 },
  maxSize: { width: 120, height: 20 },
});

WidgetRegistry.register({
  type: 'issues',
  name: 'Issues',
  description: 'Top issues and filtering options',
  factory: createIssuesWidget,
  defaultConfig: {
    position: { x: 65, y: 0, width: 50, height: 15 },
    config: { maxItems: 10, showPriority: true },
  },
  minSize: { width: 30, height: 10 },
  maxSize: { width: 100, height: 30 },
});

WidgetRegistry.register({
  type: 'coverage',
  name: 'Coverage',
  description: 'Code coverage visualization',
  factory: createCoverageWidget,
  defaultConfig: {
    position: { x: 0, y: 12, width: 55, height: 12 },
    config: { showUncovered: true, threshold: 80 },
  },
  minSize: { width: 25, height: 8 },
  maxSize: { width: 80, height: 25 },
});

WidgetRegistry.register({
  type: 'trends',
  name: 'Trends',
  description: 'Historical trend charts',
  factory: createTrendsWidget,
  defaultConfig: {
    position: { x: 60, y: 17, width: 55, height: 12 },
    config: { timeframe: '7d', showMetrics: ['score', 'issues'] },
  },
  minSize: { width: 25, height: 8 },
  maxSize: { width: 80, height: 25 },
});