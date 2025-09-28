# Frontend Architecture

The primary interface for DevQuality CLI is command-line based. However, the architecture supports potential future web components for enhanced visualization and collaboration.

## CLI Component Architecture

### Component Organization

```
src/cli/
├── commands/           # CLI command implementations
│   ├── setup.ts        # Setup wizard command
│   ├── analyze.ts      # Analysis commands
│   ├── config.ts       # Configuration commands
│   └── report.ts       # Report generation commands
├── components/         # Reusable CLI components
│   ├── progress.ts     # Progress indicators
│   ├── tables.ts       # Table formatting
│   ├── charts.ts       # ASCII charts
│   └── interactive.ts  # Interactive menus
├── hooks/             # Custom React hooks for CLI
│   ├── useConfig.ts    # Configuration management
│   ├── useAnalysis.ts  # Analysis state
│   └── useCache.ts     # Cache management
├── styles/            # CLI styling and formatting
│   ├── colors.ts       # Color definitions
│   ├── themes.ts       # Theme configurations
│   └── layout.ts       # Layout utilities
└── utils/             # CLI utilities
    ├── formatting.ts   # Text formatting
    ├── validation.ts   # Input validation
    └── navigation.ts   # Navigation helpers
```

### Component Template

```typescript
// Example of a reusable CLI component
import React from "react";
import { Box, Text, useInput } from "ink";

interface ProgressProps {
  current: number;
  total: number;
  label?: string;
}

const Progress: React.FC<ProgressProps> = ({ current, total, label }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <Box flexDirection="column" gap={1}>
      {label && <Text>{label}</Text>}
      <Box>
        <Text color="cyan">
          {`${"█".repeat(Math.floor(percentage / 2))}${"░".repeat(
            50 - Math.floor(percentage / 2)
          )}`}
        </Text>
        <Text> {percentage}%</Text>
      </Box>
      <Text dimColor>
        {current} / {total}
      </Text>
    </Box>
  );
};

export default Progress;
```

## State Management Architecture

### State Structure

```typescript
interface CLIState {
  // Configuration state
  config: {
    currentProject: ProjectConfiguration | null;
    userPreferences: UserSettings;
    isLoading: boolean;
  };

  // Analysis state
  analysis: {
    currentResult: AnalysisResult | null;
    isRunning: boolean;
    progress: number;
    errors: AnalysisError[];
  };

  // UI state
  ui: {
    currentScreen: string;
    navigation: NavigationHistory[];
    theme: Theme;
  };

  // Cache state
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
}
```

### State Management Patterns

- **Zustand stores**: Lightweight state management for CLI state
- **Local component state**: Component-specific UI state
- **Configuration persistence**: State saved to SQLite for consistency
- **Event-driven updates**: State updates through event system

## Routing Architecture

### Route Organization

```
# CLI command routing structure
dev-quality                    # Root command -> quick analysis
├── setup                       # Setup wizard
├── quick                       # Quick analysis (alias for root)
├── analyze                     # Comprehensive analysis
├── config                      # Configuration management
│   ├── show                    # Show current config
│   ├── edit                    # Edit configuration
│   └── reset                   # Reset to defaults
├── report                      # Report generation
│   ├── export                  # Export results
│   ├── history                 # Show history
│   └── trend                   # Trend analysis
├── watch                       # Watch mode
├── test                        # Run tests
├── debug                       # Debug information
└── version                     # Version info
```

### Protected Route Pattern

```typescript
// Example of protected route for configuration
import { Command } from "commander";

const configCommand = new Command("config")
  .description("Configuration management")
  .action(async () => {
    // Check if project is configured
    if (!(await isProjectConfigured())) {
      console.error('Project not configured. Run "dev-quality setup" first.');
      process.exit(1);
    }

    // Show configuration menu
    await showConfigMenu();
  });
```

## Frontend Services Layer

### API Client Setup

```typescript
// No external API client needed - CLI uses internal services
class InternalAPIClient {
  private analysisEngine: AnalysisEngine;
  private configManager: ConfigurationManager;

  constructor() {
    this.analysisEngine = new AnalysisEngine();
    this.configManager = new ConfigurationManager();
  }

  async analyzeProject(options: AnalysisOptions): Promise<AnalysisResult> {
    return await this.analysisEngine.analyze(options);
  }

  async getConfiguration(): Promise<ProjectConfiguration> {
    return await this.configManager.getCurrent();
  }

  async updateConfiguration(
    config: Partial<ProjectConfiguration>
  ): Promise<void> {
    return await this.configManager.update(config);
  }
}
```

### Service Example

```typescript
// Analysis service example
class AnalysisService {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService();
  }

  async runQuickAnalysis(projectPath: string): Promise<AnalysisResult> {
    const cacheKey = `quick:${projectPath}`;

    // Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Run analysis
    const result = await this.executeQuickAnalysis(projectPath);

    // Cache result
    await this.cache.set(cacheKey, result, { ttl: 300 }); // 5 minutes

    return result;
  }

  private async executeQuickAnalysis(
    projectPath: string
  ): Promise<AnalysisResult> {
    // Execute only critical tools for quick analysis
    // Implementation details...
  }
}
```
