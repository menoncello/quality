# DevQuality CLI Development Workflow

## Pre-commit Quality Gates
1. **ESLint Check**: Must pass all linting rules (zero errors)
2. **TypeScript Compilation**: Must compile without errors
3. **Test Execution**: Must pass all tests with 90%+ coverage
4. **Formatting Check**: Must pass Prettier formatting checks

## Development Commands

### Installation and Setup
```bash
# Install all dependencies
bun install

# Build CLI package
turbo run build:cli

# Install and build everything
bun run install:all
```

### Development
```bash
# Start development mode
bun run dev

# Run CLI directly
bun run start

# Clean all build artifacts
bun run clean
```

### Testing
```bash
# Run tests with coverage
bun run test:coverage

# Run all tests
turbo run test

# Run tests for specific package
cd apps/cli && bun test
```

### Building
```bash
# Build CLI only
bun run build:cli

# Build all packages
bun run build:all
```

## Code Development Process

### 1. Feature Development
- Write tests first for new functionality
- Implement code to pass tests
- Follow TypeScript strict mode standards
- Use proper Ink component patterns
- Implement comprehensive error handling

### 2. Quality Assurance
- Run ESLint and fix all issues
- Ensure TypeScript compilation succeeds
- Run tests and maintain 90%+ coverage
- Check Prettier formatting
- Validate performance requirements

### 3. Testing Strategy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **Performance Tests**: Validate 10K+ item handling
- **Security Tests**: Validate input sanitization
- **E2E Tests**: Test complete user workflows

### 4. Error Handling Patterns
- Always wrap async operations in try-catch blocks
- Handle file system errors gracefully
- Validate JSON structure before processing
- Use proper error boundaries
- Implement graceful degradation

### 5. Performance Optimization
- Use virtualization for large lists
- Implement caching for expensive operations
- Use debounced updates for real-time features
- Monitor memory usage and clean up resources
- Optimize render performance

## Quality Check Reminders
- Never use --no-verify flag when committing
- Always fix linting and type errors before committing
- Validate changes by running tests after modifications
- Use proper TypeScript types (no 'any')
- Follow Ink component property guidelines
- Ensure all unused variables are prefixed with underscore
- Test with realistic data scenarios

## Dashboard Development Specifics
- Enable strictNullChecks in tsconfig.json
- Use proper Ink styling patterns (Box for layout, Text for styling)
- Implement null safety with optional chaining
- Use consistent store interfaces
- Test with large datasets for performance validation