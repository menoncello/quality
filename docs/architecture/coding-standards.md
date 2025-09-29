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
