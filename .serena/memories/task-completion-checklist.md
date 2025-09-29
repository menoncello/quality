# Task Completion Checklist

When a task is completed, always execute these steps in order:

## 1. Code Quality Checks

### Linting
```bash
bun run lint
```
- Must pass with zero errors
- Minimal warnings acceptable only for specific cases

### Type Checking
```bash
bun run typecheck
```
- Must compile without errors
- No implicit any types

### Formatting
```bash
bun run format:check
```
- Code must be properly formatted
- If fails, run `bun run format` to auto-fix

## 2. Testing

### Unit Tests
```bash
bun run test
```
- All tests must pass
- No skipped tests without justification

### Test Coverage
```bash
bun run test:coverage
```
- Minimum 90% coverage for new code
- 100% coverage for detection engine components

## 3. Build Verification
```bash
bun run build
```
- Build must complete successfully
- No build warnings or errors

## 4. Full Quality Gate (Recommended)
```bash
bun run quality:fix
```
This runs all checks in sequence:
1. Linting
2. Auto-formatting
3. Type checking
4. All tests

## Important Notes
- **NEVER use --no-verify flag** when committing
- **Always fix linting and type errors** before committing
- **Never disable ESLint rules** without explicit approval
- **Always validate changes by running tests** after any modification
- **Never assume code works** - always test and verify