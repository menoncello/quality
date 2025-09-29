# Code Style & Conventions

## TypeScript Configuration
- **Target:** ES2022
- **Module:** ESNext with bundler resolution
- **Strict Mode:** Enabled with all strict checks
- **Path Aliases:**
  - `@dev-quality/*` → `packages/*/src`
  - `@/*` → `apps/*/src`

## Naming Conventions
- **Components:** PascalCase (e.g., `ProgressBar.tsx`)
- **Hooks:** camelCase with 'use' prefix (e.g., `useAnalysis.ts`)
- **Commands:** kebab-case (e.g., `analyze-project`)
- **Classes:** PascalCase (e.g., `AnalysisService`)
- **Interfaces:** PascalCase (e.g., `IAnalysisPlugin`)
- **Functions:** camelCase (e.g., `executeAnalysis()`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `MAX_CACHE_SIZE`)
- **Files:** kebab-case (e.g., `analysis-service.ts`)

## Prettier Configuration
- **Semi:** true
- **Single Quote:** true
- **Print Width:** 100
- **Tab Width:** 2
- **Trailing Comma:** es5
- **Arrow Parens:** avoid
- **End of Line:** lf

## ESLint Rules (Key)
- No `any` type (warn) - use explicit types or `unknown`
- No unused variables (error) - prefix with `_` if intentional
- No console (warn) - use Winston logging
- Prefer const over let
- Prefer nullish coalescing (`??`) over logical OR (`||`)
- Prefer optional chaining (`?.`)
- Max line length: 100 characters (warn)

## Type Safety
- Always use TypeScript interfaces and types
- Avoid `any` type - use `unknown` if type is truly unknown
- Only use `any` for external API responses or complex third-party libraries
- Always specify return types for functions
- Use type assertions with `as` syntax

## Error Handling
- All async operations must have proper error handling
- Always wrap file operations in try-catch blocks
- Validate JSON structure before processing
- Use proper error boundaries and fallbacks for external APIs

## Testing Standards
- **Test Isolation:** Use timestamp-based directories to avoid conflicts
- **Cleanup:** Always clean up test files after each test
- **Mock Management:** Mock external dependencies, not internal logic
- **Coverage Target:** 90%+ for core functionality, 100% for detection engine