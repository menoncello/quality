# DevQuality CLI - Project Overview

## Purpose
DevQuality CLI is a code quality analysis and reporting tool designed for developers. It provides automated analysis of code quality metrics, linting, testing, and generates comprehensive reports for TypeScript/JavaScript projects.

## Tech Stack
- **Language:** TypeScript 5.9.2
- **Runtime:** Bun 1.0+ (JavaScript runtime, bundler, and test runner)
- **CLI Framework:** Commander.js 14.0.1 (command parsing)
- **Interactive UI:** Ink 6.3.1 (React components for terminal)
- **State Management:** Zustand 5.0.8
- **Database:** SQLite (local caching and historical data)
- **Logging:** Winston 3.11.0
- **Build Tool:** Bun (integrated with runtime)
- **CI/CD:** GitHub Actions

## Project Type
Monorepo using Bun workspaces with multiple packages:
- `apps/cli` - Main CLI application
- `packages/core` - Core functionality and interfaces
- `packages/types` - Shared TypeScript types
- `packages/utils` - Shared utilities

## Key Features
- Code quality analysis with plugin system
- Support for multiple analysis tools (ESLint, Prettier, TypeScript, Bun Test)
- Interactive CLI with rich terminal interfaces
- Local data persistence with SQLite
- Historical analysis tracking
- Report generation and export