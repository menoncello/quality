# Suggested Commands

## Development Commands

### Build
- `bun run build` - Build CLI application
- `bun run build:cli` - Build CLI specifically
- `bun run dev` - Build in watch mode

### Testing
- `bun run test` - Run CLI tests
- `bun run test:cli` - Run CLI tests specifically
- `bun run test:all` - Run all tests recursively
- `bun test` - Direct Bun test execution
- `bun run test:coverage` - Check test coverage

### Linting
- `bun run lint` - Lint CLI code
- `bun run lint:cli` - Lint CLI specifically
- `bun run lint:all` - Lint all packages
- `bun run lint:packages` - Lint all packages

### Type Checking
- `bun run typecheck` - Type check CLI
- `bun run typecheck:cli` - Type check CLI specifically
- `bun run typecheck:all` - Type check all packages
- `bun run typecheck:packages` - Type check all packages

### Formatting
- `bun run format` - Format CLI code
- `bun run format:cli` - Format CLI specifically
- `bun run format:check` - Check formatting without writing
- `bun run format:all` - Format all code
- `bun run format:packages` - Format all packages

### Quality Gates
- `bun run quality` - Run full quality check (lint + format:check + typecheck + test:all)
- `bun run quality:fix` - Run quality check with auto-fix (lint + format + typecheck + test:all)

### Utility
- `bun run clean` - Clean all node_modules and dist folders
- `bun run install:all` - Fresh install and build

## System Commands (Darwin/macOS)
- `ls` - List files
- `cd` - Change directory
- `grep` - Search text
- `find` - Find files
- `git` - Version control