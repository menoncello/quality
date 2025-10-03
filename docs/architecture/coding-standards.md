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
2. **Ink Property Abuse:** Using non-existent styling properties
3. **Type Confusion:** Date objects assigned to string properties
4. **Console Logging:** Direct console statements in dashboard components
5. **Mock Type Issues:** Mock engines not implementing proper interfaces

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
  backgroundColor?: never; // Not supported on Text
  marginLeft?: never;     // Not supported on Text
}
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

### **Quality Gates for Dashboard Development**

- **TypeScript Compilation:** Must compile with strictNullChecks enabled
- **ESLint Compliance:** Zero unused variable violations
- **Ink Component Validation:** All component properties verified against documentation
- **Interface Consistency:** Store interfaces match component usage patterns
- **No Console Statements:** All logging through proper utilities
