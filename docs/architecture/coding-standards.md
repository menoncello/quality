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
