# DevQuality CLI Coding Standards

## TypeScript Standards
- **Strict Mode**: All TypeScript files must use strict mode (strictNullChecks enabled)
- **No Any Types**: Use explicit types or 'unknown' instead of 'any'
- **Interface First**: Define interfaces before implementation
- **Type Safety**: Always specify return types for functions
- **Null Safety**: Use optional chaining and nullish coalescing operators

## ESLint Configuration
- **Zero Errors**: Must pass all ESLint rules with zero errors
- **No Disable Comments**: Never use 'eslint-disable' to bypass rules
- **TypeScript Parser**: Configured for TypeScript parsing with proper globals
- **Environment**: Node.js and browser globals properly configured

## Component Standards (Ink)
- **Property Validation**: Only use documented Ink component properties
- **Forbidden Properties**: NEVER use `marginLeft`, `backgroundColor`, `size`, `capitalize` on Text components
- **Styling Approach**: Use Ink's built-in styling props: `padding`, `margin`, `color`, `dimColor`
- **Layout Pattern**: Use Box for layout, Text for styling

## State Management
- **Zustand Stores**: Use for CLI state management
- **Interface Consistency**: Store interfaces must match component usage
- **Type Safety**: Store state must be strongly typed
- **No Global State**: Avoid global state variables

## Testing Requirements
- **Unit Tests**: All core functionality must have unit tests
- **Integration Tests**: Test component interactions and data flow
- **Coverage**: 90%+ test coverage required
- **Mock Strategy**: Mock external dependencies only, not internal logic
- **Test Isolation**: Use unique directories and proper cleanup

## Naming Conventions
- **Components**: PascalCase (ProgressBar.tsx)
- **Hooks**: camelCase with 'use' prefix (useAnalysis.ts)
- **Commands**: kebab-case (analyze-project)
- **Classes**: PascalCase (AnalysisService)
- **Functions**: camelCase (executeAnalysis())
- **Constants**: SCREAMING_SNAKE_CASE (MAX_CACHE_SIZE)
- **Files**: kebab-case (analysis-service.ts)

## Performance Standards
- **Memory Management**: Clean up temporary files and objects
- **Caching**: Cache expensive operations when possible
- **Virtualization**: Handle 10K+ items efficiently
- **Debouncing**: Use debounced updates for real-time features
- **Event Cleanup**: Prevent memory leaks through proper cleanup

## Security Standards
- **Input Validation**: All user inputs must be validated and sanitized
- **XSS Prevention**: Proper escaping of user-provided content
- **Rate Limiting**: Limit search and filter operations
- **File Path Safety**: Prevent directory traversal attacks
- **SQL Injection**: Use parameterized queries

## Quality Gates
- **TypeScript Compilation**: Must compile without errors
- **ESLint Compliance**: Zero errors and minimal warnings
- **Test Coverage**: 90%+ coverage required
- **Formatting**: Must pass Prettier formatting checks
- **Performance**: Must meet performance benchmarks