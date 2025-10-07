# Coding Standards

## Critical Fullstack Rules

- **Type Safety:** Always use TypeScript interfaces and types
- **Error Handling:** All async operations must have proper error handling
- **Plugin Interfaces:** Plugins must implement the AnalysisPlugin interface
- **Configuration:** Never hardcode configuration values
- **File Paths:** Always use path utilities for cross-platform compatibility
- **Database Access:** Use repository pattern, never direct SQL in business logic
- **CLI Output:** Use Ink components for consistent CLI interface
- **State Management:** Use Zustand for CLI state, avoid global state
- **Testing:** All core functionality must have unit tests
- **Performance:** Use caching for expensive operations

## ESLint Compliance Standards

### **Type Safety Rules**

- **Avoid `any` type:** Use explicit types or `unknown` instead of `any`
- **Exception:** Only use `any` for external API responses or complex third-party libraries
- **Nullish Coalescing:** Use `??` instead of `||` for null/undefined checks
- **Type Assertions:** Use `as` syntax consistently, avoid angle bracket assertions

### **Code Quality Rules**

- **No Unused Variables:** Remove or prefix unused variables with `_`
- **No Console Statements:** Use proper logging utilities instead of `console.log`
- **Consistent Returns:** Always specify return types for functions
- **Parameter Naming:** Use descriptive parameter names, avoid single letters except for callbacks

## TypeScript Standards

### **Export Management**

- **Public API:** Only export necessary types and classes from package entry points
- **Type Exports:** Export interfaces and types alongside implementations
- **Consistent Naming:** Export names should match implementation names

### **Error Handling Patterns**

- **Async Operations:** Always wrap in try-catch blocks
- **File Operations:** Handle file system errors gracefully
- **JSON Parsing:** Validate JSON structure before processing
- **External APIs:** Use proper error boundaries and fallbacks

## Testing Standards

### **Test Isolation**

- **Unique Test Directories:** Use timestamp-based directory names to avoid conflicts
- **Cleanup:** Always clean up test files and directories after each test
- **Mock Management:** Mock external dependencies, not internal logic
- **Race Conditions:** Use proper async/await patterns to avoid timing issues

### **Test Coverage**

- **Core Functionality:** 100% test coverage for detection engine components
- **Edge Cases:** Test empty projects, invalid inputs, and error conditions
- **Integration:** Test component interactions and data flow
- **Performance:** Test with large projects and complex structures

## Quality Assurance Process

### **Pre-commit Quality Gates**

- **ESLint:** Must pass all linting rules (zero errors, minimal warnings)
- **TypeScript:** Must compile without errors
- **Tests:** Must pass all tests with 90%+ coverage
- **Formatting:** Must pass Prettier formatting checks

### **Development Workflow**

1. **Write Tests First:** Create failing tests for new functionality
2. **Implementation:** Write code to pass tests
3. **Quality Checks:** Run ESLint, TypeScript, and formatting checks
4. **Documentation:** Update relevant documentation
5. **Code Review:** Peer review for quality and standards compliance

## Performance Standards

### **Detection Engine**

- **File System Operations:** Cache expensive operations when possible
- **Memory Management:** Clean up temporary files and objects
- **Error Recovery:** Graceful handling of malformed project structures
- **Scalability:** Handle projects with 1000+ files efficiently

## Naming Conventions

| Element    | Frontend             | Backend              | Example               |
| ---------- | -------------------- | -------------------- | --------------------- |
| Components | PascalCase           | -                    | `ProgressBar.tsx`     |
| Hooks      | camelCase with 'use' | -                    | `useAnalysis.ts`      |
| Commands   | -                    | kebab-case           | `analyze-project`     |
| Classes    | PascalCase           | PascalCase           | `AnalysisService`     |
| Interfaces | PascalCase           | PascalCase           | `IAnalysisPlugin`     |
| Functions  | camelCase            | camelCase            | `executeAnalysis()`   |
| Constants  | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_CACHE_SIZE`      |
| Files      | kebab-case           | kebab-case           | `analysis-service.ts` |

## Error Pattern Guidelines

### **Common Anti-patterns to Avoid**

1. **Type Any Usage:** Replace with proper interfaces or unknown types
2. **Console Logging:** Use proper logging utilities with levels
3. **Unused Variables:** Remove or prefix with underscore
4. **Inconsistent Returns:** Always specify return types
5. **Hardcoded Values:** Use configuration objects or environment variables

### **Best Practices for Detection Engine**

1. **Modular Architecture:** Separate concerns into distinct detector classes
2. **Error Boundaries:** Each detector should handle its own errors
3. **Configuration Validation:** Validate all configuration inputs
4. **Performance Optimization:** Cache results and avoid redundant operations
5. **Testability:** Design components for easy unit testing

## CLI Dashboard Development Standards

### **TypeScript Configuration Requirements**

- **strictNullChecks:** MUST be enabled in tsconfig.json for proper type safety
- **Strict Mode:** Enable all strict type checking options for dashboard components
- **Interface Consistency:** Ensure all AnalysisResult interfaces match between packages

### **Ink Component Standards**

- **Property Validation:** Only use documented Ink component properties
- **Forbidden Properties:** NEVER use `marginLeft` or `backgroundColor` on Text components
- **Styling Approach:** Use Ink's built-in styling props: `padding`, `margin`, `color`, `dimColor`
- **Component API:** Always check Ink documentation before using component properties

```typescript
// ❌ WRONG - Properties don't exist
<Text marginLeft={2} backgroundColor="blue">Content</Text>

// ✅ CORRECT - Use proper Ink properties
<Box paddingLeft={2}>
  <Text color="blue">Content</Text>
</Box>
```

### **State Management Standards**

- **Interface Synchronization:** Store interfaces must match component usage patterns
- **Property Existence:** Ensure all accessed properties exist in store interface
- **Type Safety:** Store state must be strongly typed, no dynamic property access

```typescript
// ❌ WRONG - Property doesn't exist in interface
const currentView = useDashboardStore(state => state.currentView);

// ✅ CORRECT - Property exists in interface
interface DashboardStore {
  currentView: 'dashboard' | 'issue-list' | 'issue-details';
  // ... other properties
}
const currentView = useDashboardStore(state => state.currentView);
```

### **Variable Management Standards**

- **Unused Variables:** All unused variables must be prefixed with underscore `_`
- **Destructuring:** Use underscore prefix for unused destructured properties
- **Function Parameters:** Unused parameters must be prefixed with underscore

```typescript
// ❌ WRONG - Unused variables not prefixed
const { selectedIssue, setAnalyzing } = useDashboardStore();
const handleClick = (index, item, value) => { /* only uses index */ };

// ✅ CORRECT - Unused variables prefixed
const { selectedIssue: _selectedIssue, setAnalyzing: _setAnalyzing } = useDashboardStore();
const handleClick = (index, _item, _value) => { /* only uses index */ };
```

### **Dashboard-Specific Anti-patterns**

1. **Interface Mismatch:** Store properties not matching component usage
2. **Ink Property Abuse:** Using non-existent styling properties (size, marginLeft, backgroundColor, capitalize)
3. **Import Errors:** Using non-existent Ink components (TextInput, Checkbox)
4. **Null Safety Issues:** Accessing potentially undefined values without optional chaining
5. **Type Safety Violations:** Implicit any types in function parameters
6. **Module Resolution:** Importing non-existent local modules
7. **Type Confusion:** Date objects assigned to string properties
8. **Console Logging:** Direct console statements in dashboard components
9. **Mock Type Issues:** Mock engines not implementing proper interfaces

### **Dashboard Development Workflow**

1. **Interface First:** Define all store interfaces before implementation
2. **Component Validation:** Verify Ink component properties in documentation
3. **Type Checking:** Run TypeScript compilation after each component
4. **Store Testing:** Test store state management with mock data
5. **Integration Testing:** Verify dashboard components with real analysis results

### **Error Prevention Patterns**

#### **Ink Component Validation**
```typescript
// Always verify component properties in Ink docs
// Common safe properties for Text component:
interface TextProps {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: ColorName;
  dimColor?: boolean;
  // FORBIDDEN PROPERTIES (do not exist):
  size?: never;           // Not supported on Text
  backgroundColor?: never; // Not supported on Text
  marginLeft?: never;     // Not supported on Text
  capitalize?: never;     // Not supported on Text
  marginTop?: never;      // Not supported on Text
}
```

#### **Ink Component Import Patterns**
```typescript
// ❌ WRONG - Non-existent imports
import { TextInput, Checkbox } from 'ink';

// ✅ CORRECT - Use available Ink components
import { Box, Text, useInput } from 'ink';

// For input handling, use useInput hook:
const [input, setInput] = useState('');
useInput((input, key) => {
  if (key.return) {
    handleSubmit(input);
  } else if (input) {
    setInput(prev => prev + input);
  }
});
```

#### **Null Safety Patterns for Dashboard Components**
```typescript
// ❌ WRONG - Potential undefined access
const runName = selectedRun.name;
const score = issue.scoreDiff;

// ✅ CORRECT - Proper null safety
const runName = selectedRun?.name ?? 'Unknown';
const score = issue.scoreDiff ?? 0;

// For optional chaining with arrays:
const filteredIssues = analysisResult?.issues?.filter(issue =>
  issue.severity === 'error'
) ?? [];
```

#### **Store Interface Design**
```typescript
// Design store interfaces to match component needs
interface DashboardStore {
  // Core state properties
  currentResult: AnalysisResult | null;
  filteredIssues: Issue[];
  selectedIssue: Issue | null;
  isAnalyzing: boolean;

  // UI state properties
  currentView: DashboardView;
  currentPage: number;
  itemsPerPage: number;

  // Action methods
  setCurrentView: (view: DashboardView) => void;
  setSelectedIssue: (issue: Issue | null) => void;
  // ... other methods
}
```

#### **Date vs String Handling**
```typescript
// ❌ WRONG - Date assigned to string property
const timestamp: string = new Date();

// ✅ CORRECT - Proper date to string conversion
const timestamp: string = new Date().toISOString();
const displayDate: string = new Date().toLocaleDateString();
```

#### **Function Parameter Type Safety**
```typescript
// ❌ WRONG - Implicit any types
const handleSearch = (query) => { /* ... */ };
const handleToggle = (checked) => { /* ... */ };

// ✅ CORRECT - Explicit type annotations
const handleSearch = (query: string) => { /* ... */ };
const handleToggle = (checked: boolean) => { /* ... */ };

// For event handlers with proper typing:
const handleClick = (_index: number, _item: unknown, _value: unknown) => {
  // Use underscore prefix for unused parameters
};
```

#### **Box Layout vs Text Properties**
```typescript
// ❌ WRONG - Using margin properties on Text
<Text marginLeft={2} color="blue">Content</Text>

// ✅ CORRECT - Use Box for layout, Text for styling
<Box paddingLeft={2}>
  <Text color="blue">Content</Text>
</Box>

// ❌ WRONG - Using unsupported Text properties
<Text size="small" capitalize>Banner</Text>

// ✅ CORRECT - Use only supported Text properties
<Text bold color="cyan">BANNER</Text>
```

#### **Missing Module Resolution**
```typescript
// ❌ WRONG - Importing non-existent local modules
import VirtualizedList from './virtualized-list';

// ✅ CORRECT - Use actual available modules or create them
// Either create the file or use alternative approaches:
import { VirtualizedList } from '../components/virtualized-list';
// Or implement inline virtualization
```

### **Quality Gates for Dashboard Development**

- **TypeScript Compilation:** Must compile with strictNullChecks enabled
- **ESLint Compliance:** Zero unused variable violations
- **Ink Component Validation:** All component properties verified against documentation
- **Interface Consistency:** Store interfaces match component usage patterns
- **No Console Statements:** All logging through proper utilities

## **Learnings from Quality Analysis (Updated 2025-10-06)**

### **Critical Ink Component Violations**

Based on recent quality checks, the following patterns were identified as major sources of TypeScript errors:

#### **1. Forbidden Text Properties**
The most common violation (80+ occurrences) is using non-existent properties on Ink Text components:

```typescript
// ❌ NEVER USE THESE PROPERTIES ON TEXT COMPONENTS
<Text size="small" marginLeft={2} backgroundColor="blue" capitalize>
  Content
</Text>

// ✅ CORRECT APPROACH
<Box paddingLeft={2}>
  <Text bold color="blue">CONTENT</Text>
</Box>
```

#### **2. Non-existent Ink Imports**
Importing components that don't exist in the Ink library:

```typescript
// ❌ THESE IMPORTS DON'T EXIST
import { TextInput, Checkbox } from 'ink';

// ✅ CORRECT IMPORTS
import { Box, Text, useInput, useApp } from 'ink';
```

#### **3. Null Safety Requirements**
Multiple TypeScript strict null check violations:

```typescript
// ❌ POTENTIAL RUNTIME ERRORS
const runName = selectedRun.name;
const scoreDiff = issue.scoreDiff;

// ✅ SAFE ACCESS PATTERNS
const runName = selectedRun?.name ?? 'Unknown';
const scoreDiff = issue.scoreDiff ?? 0;
```

### **Prevention Strategies**

1. **Component Property Validation**: Always check Ink documentation before using component properties
2. **TypeScript Strict Mode**: Enable all strict type checking options
3. **Null Safety Training**: Require optional chaining for all potentially nullable values
4. **Import Verification**: Verify all imports exist before using them
5. **Regular Quality Checks**: Run type checking and formatting checks in development

### **Impact Assessment**

- **Ink Property Violations**: 80+ TypeScript errors
- **Missing Modules**: 2 import errors causing build failures
- **Null Safety Issues**: 15+ strict null check violations
- **Type Safety**: 5+ implicit any type violations

These updated standards should prevent similar issues in future dashboard development.

## **Learnings from Quality Analysis (Updated 2025-10-07)**

### **Critical ESLint Configuration Issues**

The quality checks revealed fundamental ESLint configuration problems causing widespread parsing errors:

#### **1. TypeScript Parsing Configuration**
ESLint is not configured to parse TypeScript syntax, causing "Unexpected token" errors for:

```typescript
// ❌ ESLint PARSES THESE AS ERRORS
interface AnalysisResult { ... }
abstract class BaseCommand { ... }
readonly property: string;
implements PluginInterface
const result: unknown = data;
```

**Solution**: Ensure `@typescript-eslint/parser` is configured and TypeScript files are properly associated.

#### **2. Global Environment Variables**
Multiple `no-undef` errors for standard Node.js and browser globals:

```typescript
// ❌ THESE CAUSE NO-UNDEF ERRORS
process.env.NODE_ENV
console.log('debug info');
performance.now();
setTimeout(callback, 1000);
require('fs');
global.Buffer;
```

**Solution**: Configure ESLint globals for Node.js environment:

```javascript
// eslint.config.js
export default [
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly'
      }
    }
  }
];
```

### **Code Quality Pattern Violations**

#### **3. Unused Variable Patterns**
Multiple instances of unused variables without proper naming convention:

```typescript
// ❌ UNUSED VARIABLES NOT PREFIXED
import path from 'path';  // path imported but not used
const handleClick = (index, item, value) => { /* only uses index */ };

// ✅ CORRECT UNUSED VARIABLE HANDLING
import _path from 'path';  // prefixed with underscore
const handleClick = (index, _item, _value) => { /* only uses index */ };
```

#### **4. Regular Expression Safety**
Invalid regex patterns causing parsing failures:

```javascript
// ❌ INVALID REGEX - UNTERMINATED GROUP
const pattern = /\.(\([^)]+\) as any\)/;

// ✅ VALID REGEX PATTERNS
const pattern = /\.(\([^)]*\)\s+as\s+any\)/;
const pattern = /\.(\([^)]*\))\s+as\s+any\)/;
```

#### **5. Import/Export Consistency**
Inconsistent export patterns across modules:

```typescript
// ❌ MIXED EXPORT STYLES
export interface AnalysisResult { ... }
export default AnalysisEngine;

// ✅ CONSISTENT EXPORTS
export interface AnalysisResult { ... }
export class AnalysisEngine { ... }
export { AnalysisEngine };
```

### **ESLint Configuration Standards**

#### **Required Parser Configuration**
```javascript
// eslint.config.js
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    }
  }
];
```

#### **Environment Configuration**
```javascript
// eslint.config.js
export default [
  {
    languageOptions: {
      globals: {
        // Node.js globals
        process: 'readonly',
        require: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        exports: 'readonly',

        // Browser/Performance globals
        console: 'readonly',
        performance: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    }
  }
];
```

#### **File Pattern Matching**
```javascript
// eslint.config.js
export default [
  {
    ignores: [
      '**/dist/**/*',
      '**/node_modules/**/*',
      'coverage/**/*',
      'build/**/*',
      '*.d.ts',
      'temp/**/*',
      '.stryker-tmp/**/*',
      '**/.stryker-tmp/**/*'
    ]
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // TypeScript-specific rules
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // JavaScript-specific rules
  }
];
```

### **Prevention Strategies**

#### **1. Configuration Validation**
- Validate ESLint configuration before committing
- Test configuration on sample TypeScript files
- Ensure parser compatibility with TypeScript version

#### **2. Global Environment Management**
- Always specify environment globals in ESLint config
- Use `eslint-env` comments for file-specific environments
- Prefer explicit global declarations over implicit assumptions

#### **3. Regex Safety Patterns**
- Test regex patterns in isolation before use
- Use regex testing tools for complex patterns
- Escape special characters properly in string-based regex

#### **4. Import/Export Standards**
- Use consistent export patterns within modules
- Prefer named exports for better tree-shaking
- Validate imports exist before using them

### **Quality Gates Update**

#### **Pre-commit Requirements**
- **ESLint Configuration**: Must parse TypeScript files correctly
- **Global Variables**: Zero `no-undef` errors for standard globals
- **Regex Validation**: All regex patterns must be syntactically valid
- **Unused Variables**: All unused variables properly prefixed
- **Import Consistency**: All imports must resolve to existing modules

#### **Development Workflow Updates**
1. **Configuration Testing**: Test ESLint config on sample files
2. **Regex Validation**: Validate complex regex patterns separately
3. **Global Setup**: Ensure environment globals are properly configured
4. **Import Verification**: Check all imports resolve correctly
5. **Variable Naming**: Audit unused variables and apply underscore prefix

### **Impact Assessment**

- **ESLint Configuration**: 200+ parsing errors due to TypeScript misconfiguration
- **Global Variables**: 50+ `no-undef` errors for standard Node.js/browser globals
- **Unused Variables**: 15+ violations of naming conventions
- **Regex Issues**: 2 critical regex parsing failures
- **Formatting**: 158 files with Prettier formatting issues

### **Implementation Priority**

1. **Critical**: Fix ESLint TypeScript parsing configuration
2. **High**: Configure proper environment globals
3. **Medium**: Address unused variable naming conventions
4. **Medium**: Fix regex pattern validation
5. **Low**: Resolve Prettier formatting consistency

These updates address fundamental configuration issues that prevent proper code quality analysis and establish patterns for maintaining robust ESLint configuration in TypeScript projects.
