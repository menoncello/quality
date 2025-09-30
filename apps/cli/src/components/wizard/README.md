# Setup Wizard - Interactive Configuration System

## Overview

The Setup Wizard provides an interactive, terminal-based interface for configuring the DevQuality CLI tool. It guides users through setting up Bun Test, ESLint, Prettier, and TypeScript configurations with automatic project detection, validation, and rollback capabilities.

## Architecture

### Component Structure

```
apps/cli/src/
├── components/wizard/
│   ├── wizard-container.tsx      # Main wizard orchestrator
│   ├── welcome-screen.tsx        # Initial screen with project detection
│   ├── config-step.tsx          # Individual configuration step
│   ├── summary-screen.tsx       # Final summary and validation results
│   └── index.ts                 # Barrel exports
│
└── services/wizard/
    ├── wizard-service.ts        # Core orchestration service
    ├── config-generator.ts      # Configuration file generators
    ├── validator.ts            # Configuration validators
    ├── rollback.ts            # Backup and rollback service
    └── index.ts               # Barrel exports
```

## Core Components

### 1. WizardContainer

**Purpose:** Orchestrates the wizard flow, manages state, and handles navigation between steps.

**Features:**

- Step-by-step navigation with progress indicators
- Wizard data accumulation across steps
- Keyboard shortcuts (ESC/Ctrl+C to cancel)
- Automatic step transitions

**Usage:**

```tsx
import { WizardContainer, WizardStep } from './components/wizard';

const steps: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    component: WelcomeScreen,
  },
  // ... more steps
];

<WizardContainer
  steps={steps}
  onComplete={data => console.log('Wizard completed!', data)}
  onCancel={() => console.log('Wizard cancelled')}
/>;
```

**Props:**

```typescript
interface WizardContainerProps {
  steps: WizardStep[];
  onComplete: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: string;
  title: string;
  component: React.ComponentType<WizardStepProps>;
}
```

### 2. WelcomeScreen

**Purpose:** Displays project detection results and sets expectations for the wizard.

**Features:**

- Shows detected project information (name, type, frameworks)
- Lists found tools and their versions
- Displays source and test directory structure
- Provides tool list that will be configured

**Props:**

```typescript
interface WelcomeScreenProps extends WizardStepProps {
  detectionResult?: DetectionResult;
}
```

**Example:**

```tsx
<WelcomeScreen detectionResult={detectionResult} onNext={handleNext} onCancel={handleCancel} />
```

### 3. ConfigStep

**Purpose:** Handles configuration for a single tool with create/replace/merge options.

**Features:**

- Displays existing configuration preview
- Offers replace/merge/skip options for existing configs
- Shows generation and validation progress
- Real-time status updates (generating → validating → complete)

**Props:**

```typescript
interface ConfigStepProps extends WizardStepProps {
  toolName: string;
  description: string;
  configPath: string;
  existingConfig?: boolean;
  configPreview?: string;
  onGenerate: () => Promise<void>;
  onValidate: () => Promise<boolean>;
}
```

### 4. SummaryScreen

**Purpose:** Displays final results, validation status, and next steps.

**Features:**

- Configuration summary for all tools
- Validation results with status indicators (✓/⚠/✗)
- Generated files list
- Next steps guidance
- Optional immediate analysis execution

**Props:**

```typescript
interface SummaryScreenProps extends WizardStepProps {
  validationResults: ValidationResult[];
  generatedFiles: string[];
  onRunAnalysis?: () => Promise<void>;
}
```

## Core Services

### 1. WizardService

**Purpose:** Orchestrates the wizard workflow and manages wizard context.

**Key Methods:**

```typescript
class WizardService {
  // Initialize wizard with project path
  constructor(projectPath: string);

  // Run project detection
  async detectProject(): Promise<DetectionResult>;

  // File tracking
  addGeneratedFile(filePath: string): void;
  getGeneratedFiles(): string[];

  // Configuration management
  hasExistingConfig(configFileName: string): boolean;
  getConfigPath(configFileName: string): string;

  // Backup management
  setBackupMetadata(metadata: BackupMetadata): void;
  getBackupMetadata(): BackupMetadata | undefined;

  // Create project configuration
  createProjectConfiguration(): ProjectConfiguration;

  // Reset wizard state
  reset(): void;
}
```

**Usage Example:**

```typescript
const wizardService = new WizardService(process.cwd());

// Detect project
const detection = await wizardService.detectProject();

// Check for existing configs
if (wizardService.hasExistingConfig('tsconfig.json')) {
  // Handle existing config
}

// Track generated file
wizardService.addGeneratedFile('bunfig.toml');

// Get all generated files
const files = wizardService.getGeneratedFiles();
```

### 2. Configuration Generators

**Purpose:** Generate tool-specific configuration files with support for create/replace/merge actions.

#### Available Generators:

**BunTestConfigGenerator**

- Generates `bunfig.toml` with test configuration
- Includes coverage settings (80% threshold)
- Configures test path patterns
- Adds preload configuration

**ESLintConfigGenerator**

- Supports both flat config (`eslint.config.js`) and legacy (`.eslintrc.json`)
- Includes TypeScript rules
- Auto-detects preferred format
- Prevents `no-explicit-any` usage

**PrettierConfigGenerator**

- Generates `.prettierrc.json` with sensible defaults
- Creates `.prettierignore` automatically
- Merges with existing configuration
- Includes common ignore patterns

**TypeScriptConfigGenerator**

- Generates `tsconfig.json` with strict mode
- Configures compiler options (ES2022, ESNext)
- Sets up path aliases
- Includes/excludes appropriate directories

**Base Usage Pattern:**

```typescript
import { BunTestConfigGenerator } from './services/wizard';

const generator = new BunTestConfigGenerator({
  projectPath: '/path/to/project',
  detectionResult: detectionResult,
});

// Generate new config
const result = await generator.generate('create');

// Replace existing config
const result = await generator.generate('replace');

// Merge with existing
const result = await generator.generate('merge');

console.log(result);
// {
//   filePath: '/path/to/project/bunfig.toml',
//   content: '...',
//   action: 'created' | 'replaced' | 'merged'
// }
```

**Security Features:**

- Path sanitization to prevent traversal attacks
- Validates all paths are within project directory
- Safe file operations with error handling

### 3. Configuration Validators

**Purpose:** Validate generated configurations with security protections.

#### Available Validators:

**BunTestValidator**

- Checks for `[test]` section in bunfig.toml
- Validates TOML structure
- Optionally runs `bun test --dry-run`

**ESLintValidator**

- Validates JSON structure for `.eslintrc.json`
- Checks JavaScript syntax for `eslint.config.js`
- Optionally runs `eslint --print-config`

**PrettierValidator**

- Validates JSON structure
- Checks for valid configuration keys
- Optionally runs `prettier --check`

**TypeScriptValidator**

- Validates JSON structure
- Checks for required `compilerOptions`
- Optionally runs `tsc --noEmit`

**Usage Example:**

```typescript
import { TypeScriptValidator } from './services/wizard';

const validator = new TypeScriptValidator({
  projectPath: '/path/to/project',
  configPath: 'tsconfig.json',
});

const result = await validator.validate();

if (!result.isValid) {
  console.error('Validation errors:', result.errors);
}

if (result.warnings.length > 0) {
  console.warn('Warnings:', result.warnings);
}
```

**Security Features:**

- Safe command execution with array-based arguments (prevents command injection)
- Input sanitization for paths
- JSON structure validation before parsing
- Catches and reports errors gracefully

### 4. RollbackService

**Purpose:** Provides atomic backup and restore capability for configuration files.

**Key Features:**

- Creates backups before any modifications
- Stores backup metadata with timestamps
- Atomic rollback (all or nothing)
- Cleanup after successful completion

**Usage Example:**

```typescript
import { RollbackService } from './services/wizard';

const rollbackService = new RollbackService('/path/to/project');

// Create backup before modifications
const metadata = await rollbackService.createBackup(
  ['bunfig.toml', 'tsconfig.json', 'eslint.config.js'],
  'configuration-step'
);

// ... perform modifications ...

// If something goes wrong, rollback
const result = await rollbackService.rollback();

if (result.success) {
  console.log('Restored files:', result.restoredFiles);
} else {
  console.error('Rollback errors:', result.errors);
}

// After successful completion, cleanup
await rollbackService.cleanupBackup();
```

**Backup Structure:**

```typescript
interface BackupMetadata {
  timestamp: Date;
  files: BackupFile[];
  wizardStep: string;
}

interface BackupFile {
  path: string;
  originalContent: string;
  existed: boolean; // If false, file will be deleted on rollback
}
```

## Complete Workflow Example

Here's a complete example of using the wizard components and services together:

```typescript
import {
  WizardService,
  BunTestConfigGenerator,
  TypeScriptConfigGenerator,
  BunTestValidator,
  TypeScriptValidator,
  RollbackService,
} from './services/wizard';

async function runWizard(projectPath: string) {
  // 1. Initialize services
  const wizardService = new WizardService(projectPath);
  const rollbackService = new RollbackService(projectPath);

  try {
    // 2. Detect project
    const detection = await wizardService.detectProject();
    console.log('Detected project:', detection.project.name);

    // 3. Create backup
    await rollbackService.createBackup(['bunfig.toml', 'tsconfig.json'], 'wizard-execution');

    // 4. Generate configurations
    const bunGenerator = new BunTestConfigGenerator({
      projectPath,
      detectionResult: detection,
    });
    const bunResult = await bunGenerator.generate('create');
    wizardService.addGeneratedFile(bunResult.filePath);

    const tsGenerator = new TypeScriptConfigGenerator({
      projectPath,
      detectionResult: detection,
    });
    const tsResult = await tsGenerator.generate('create');
    wizardService.addGeneratedFile(tsResult.filePath);

    // 5. Validate configurations
    const bunValidator = new BunTestValidator({
      projectPath,
      configPath: 'bunfig.toml',
    });
    const bunValidation = await bunValidator.validate();

    const tsValidator = new TypeScriptValidator({
      projectPath,
      configPath: 'tsconfig.json',
    });
    const tsValidation = await tsValidator.validate();

    // 6. Check validation results
    if (!bunValidation.isValid || !tsValidation.isValid) {
      console.error('Validation failed, rolling back...');
      await rollbackService.rollback();
      return;
    }

    // 7. Success - cleanup backup
    await rollbackService.cleanupBackup();

    console.log('Wizard completed successfully!');
    console.log('Generated files:', wizardService.getGeneratedFiles());
  } catch (error) {
    console.error('Wizard error, rolling back...', error);
    await rollbackService.rollback();
  }
}
```

## Configuration File Templates

### Bun Test (bunfig.toml)

```toml
[test]
preload = ["./test-setup.ts"]
coverage = true
coverageThreshold = 80
bail = false
timeout = 5000
testPathPatterns = ["./tests/**/*.test.{ts,tsx}"]
```

### ESLint (eslint.config.js - Flat Config)

```javascript
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];
```

### Prettier (.prettierrc.json)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": "./",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["./src", "./tests"],
  "exclude": ["node_modules", "dist", "build", "output"]
}
```

## Security Considerations

### Path Traversal Prevention

All file paths are sanitized to prevent directory traversal attacks:

```typescript
protected sanitizePath(filePath: string): string {
  const resolved = path.resolve(this.projectPath, filePath);

  // Ensure path is within project directory
  if (!resolved.startsWith(this.projectPath)) {
    throw new Error(`Invalid path: ${filePath} is outside project directory`);
  }

  return resolved;
}
```

### Command Injection Prevention

Commands are executed with array-based arguments:

```typescript
// Safe - uses array arguments
this.executeCommand('eslint', ['--print-config', 'test.ts']);

// UNSAFE - string interpolation
exec(`eslint --print-config ${userInput}`); // DON'T DO THIS
```

### JSON Validation

JSON files are validated before parsing:

```typescript
protected validateJsonStructure(content: string): boolean {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}
```

## Error Handling

All services implement comprehensive error handling:

```typescript
try {
  const result = await generator.generate('create');
} catch (error) {
  if (error instanceof Error) {
    console.error('Generation failed:', error.message);
  }
  // Trigger rollback
  await rollbackService.rollback();
}
```

## Testing

### Unit Tests

Located in `apps/cli/tests/unit/wizard/`:

- `wizard-service.test.ts` - Service orchestration
- `config-generator.test.ts` - Configuration generation
- `validator.test.ts` - Validation logic
- `rollback.test.ts` - Backup/restore functionality

### Integration Tests

Located in `apps/cli/tests/integration/wizard/`:

- `wizard-workflow.test.ts` - Complete end-to-end workflows

### Running Tests

```bash
# Run all wizard tests
bun test tests/unit/wizard/ tests/integration/wizard/

# Run specific test file
bun test tests/unit/wizard/config-generator.test.ts

# Run with coverage
bun test --coverage tests/unit/wizard/
```

## Future Enhancements

Planned improvements for future iterations:

1. **SQLite Persistence**
   - Save ProjectConfiguration to database
   - Track wizard execution history
   - Store user preferences

2. **Immediate Analysis**
   - Run analysis after wizard completion
   - Display initial quality metrics
   - Generate first report

3. **Monorepo Support**
   - Handle workspace configurations
   - Multi-package detection
   - Root vs package-level configs

4. **Advanced Merge**
   - Smarter configuration merging
   - Conflict resolution UI
   - Preview before applying

5. **Template Library**
   - Pre-configured templates for common stacks
   - Community-contributed templates
   - Custom template creation

## Troubleshooting

### Common Issues

**Issue:** "Configuration file not found" error

```
Solution: Ensure the file path is relative to the project root, not absolute.
```

**Issue:** Validation fails with "Command not found"

```
Solution: Make sure the tool (eslint, prettier, tsc, bun) is installed in the project.
```

**Issue:** Rollback doesn't restore files

```
Solution: Check that backup was created before modifications. Backup metadata is stored in `.devquality-backup/metadata.json`.
```

**Issue:** Permission errors when writing configs

```
Solution: Ensure the process has write permissions for the project directory.
```

## Contributing

When adding new features to the wizard:

1. **Create tests first** - Unit and integration tests
2. **Follow security patterns** - Path sanitization, safe execution
3. **Handle errors gracefully** - User-friendly error messages
4. **Update documentation** - Keep this README current
5. **Maintain backward compatibility** - Don't break existing workflows

## License

Part of the DevQuality CLI tool. See main project LICENSE file.
