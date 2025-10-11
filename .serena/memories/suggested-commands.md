# DevQuality CLI Suggested Commands

## Essential Commands for Development

### Project Setup
```bash
# Initial setup
bun install                    # Install dependencies
bun run install:all           # Install and build everything
turbo run build:cli           # Build CLI package
```

### Development Workflow
```bash
bun run dev                   # Start development mode
bun run start                 # Run CLI directly
bun run clean                 # Clean build artifacts
```

### Quality Assurance
```bash
# Linting and Formatting
bun run lint                  # Run ESLint
bun run lint:fix             # Fix ESLint issues automatically
bun run format               # Run Prettier formatting
bun run format:check         # Check formatting without changes

# Type Checking
bun run type-check           # TypeScript compilation check
bun run type-check:watch     # Watch mode for type checking

# Testing
bun run test                 # Run all tests
bun run test:watch          # Run tests in watch mode
bun run test:coverage       # Run tests with coverage report
bun run test:unit           # Run unit tests only
bun run test:integration    # Run integration tests only
bun run test:e2e            # Run end-to-end tests only
```

### Package-Specific Commands
```bash
# CLI App
cd apps/cli
bun run build                # Build CLI package
bun run dev                  # Development mode
bun run test                 # Run CLI tests
bun run start                # Run CLI

# Core Package
cd packages/core
bun run build                # Build core package
bun run test                 # Run core tests

# Types Package
cd packages/types
bun run build                # Build types package
bun run test                 # Run types tests
```

### Performance Testing
```bash
# Large dataset testing
bun run test:performance     # Run performance tests
bun run benchmark           # Run benchmarking suite

# Memory profiling
node --inspect apps/cli/src/index.js  # Debug mode with inspection
```

### Database Operations
```bash
# SQLite operations
bun run db:migrate           # Run database migrations
bun run db:seed             # Seed database with test data
bun run db:reset            # Reset database
```

### Security Testing
```bash
# Security validation
bun run test:security        # Run security-focused tests
bun run audit               # Audit dependencies for vulnerabilities
```

### Build and Release
```bash
# Building
bun run build:all           # Build all packages
bun run build:cli           # Build CLI only

# Release preparation
bun run release:prepare     # Prepare for release
bun run release:publish     # Publish to npm
```

## Git Workflow Commands
```bash
# Quality checks before commit
bun run lint && bun run type-check && bun run test:coverage

# Pre-commit hook (if configured)
bun run pre-commit          # Run all pre-commit checks

# Commit with quality gates
git add .
git commit -m "feat: add new feature"  # Will run quality gates
```

## Troubleshooting Commands
```bash
# Clean and rebuild
bun run clean && bun install && bun run build:all

# Reset dependencies
rm -rf node_modules apps/*/node_modules packages/*/node_modules
bun install

# TypeScript diagnostics
bun run type-check --noEmit  # Type checking without output

# ESLint diagnostics
bun run lint --max-warnings=0  # Fail on any warnings
```

## IDE Integration
```bash
# VS Code debugging
code .                       # Open in VS Code
# Use .vscode/launch.json for debugging configuration

# IDE URI generation (for navigation)
vscode://file/Users/eduardomenoncello/Projects/dev-tools/quality/apps/cli/src/components/app.tsx
```

## Monitoring and Debugging
```bash
# Logging configuration
DEBUG=* bun run start        # Enable debug logging

# Performance monitoring
bun run start --profile      # Run with performance profiling

# Memory usage monitoring
bun run start --memory-usage # Monitor memory usage
```

## Custom Commands for This Project
```bash
# Story-based development
/bmad create-story           # Create new story document
/bmad trace-requirements     # Trace requirements to tests
/bmad qa-gate               # Run quality gate assessment

# Quality assurance
/bmad security-scan         # Run security vulnerability scan
/bmad performance-check     # Validate performance requirements
```

## Commands for Specific File Types
```bash
# TypeScript files
bun run type-check --path apps/cli/src/components/dashboard/*.tsx

# Test files
bun run test --pattern "dashboard.*test.ts"

# Configuration files
bun run lint --config eslint.config.js
```

## Quick Development Commands
```bash
# Quick test run (for development)
bun run test:unit --watch

# Quick build check
bun run build:cli && bun run start

# Quick quality check
bun run lint && bun run type-check
```

These commands cover the most common development tasks for the DevQuality CLI project. Use them as references during development to ensure proper quality standards and workflow adherence.