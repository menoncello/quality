# DevQuality CLI

> A powerful CLI tool for code quality analysis and reporting, built with Bun, TypeScript, and Ink.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Development](#development)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

DevQuality CLI is a comprehensive tool for analyzing and improving code quality in TypeScript/JavaScript projects. It provides:

- **Interactive Setup Wizard** - Automatic project detection and configuration
- **Code Quality Analysis** - Integration with ESLint, Prettier, TypeScript, and Bun Test
- **Automated Configuration** - Generate optimal configurations for your project
- **Quality Reports** - Detailed reports on code quality metrics
- **Rollback Support** - Safe configuration changes with automatic rollback

## ✨ Features

### 🧙 Interactive Setup Wizard
- Auto-detects project type and existing configurations
- Generates configurations for Bun Test, ESLint, Prettier, and TypeScript
- Merge or replace existing configurations
- Validates configurations before applying
- Atomic rollback on errors

### 📊 Code Quality Analysis
- Run comprehensive quality checks across your codebase
- Integration with industry-standard tools
- Configurable analysis pipeline
- Detailed reporting and metrics

### 🔒 Security Features
- Path traversal attack prevention
- Command injection protection
- Safe configuration file parsing
- Input validation and sanitization

### 🎨 Modern CLI Experience
- Interactive terminal UI with Ink
- Real-time progress indicators
- Color-coded status messages
- Keyboard shortcuts for navigation

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** >= 1.0.0 ([Installation Guide](https://bun.sh))
- **Node.js** >= 18.0.0 (for compatibility)
- **Git** (for version control)

### Installing Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"

# Verify installation
bun --version
```

## 🚀 Installation

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/your-org/dev-quality-cli.git
cd dev-quality-cli

# Install dependencies
bun install

# Build the CLI
bun run build

# Link for local development (optional)
bun link
```

### From Package Manager (Coming Soon)

```bash
# NPM
npm install -g @devquality/cli

# Bun
bun add -g @devquality/cli
```

## 🏃 Quick Start

### 1. Run the Setup Wizard

```bash
# Navigate to your project
cd /path/to/your/project

# Run the setup wizard
dev-quality setup --interactive

# Or with auto-detection
dev-quality setup
```

The wizard will:
1. ✅ Detect your project structure
2. ✅ Find existing configurations
3. ✅ Generate optimal configurations
4. ✅ Validate all settings
5. ✅ Create backup before changes

### 2. Analyze Your Code

```bash
# Run analysis
dev-quality analyze

# With specific tools
dev-quality analyze --tools eslint,prettier,typescript

# With custom config
dev-quality analyze --config .devquality.json
```

### 3. Generate Reports

```bash
# Generate HTML report
dev-quality report --format html

# Generate JSON report
dev-quality report --format json --output report.json

# Open report in browser
dev-quality report --format html --open
```

## 📖 Usage

### Available Commands

```bash
dev-quality [command] [options]
```

#### `setup` - Interactive Configuration Setup

```bash
# Interactive wizard
dev-quality setup --interactive

# Auto-detect and configure
dev-quality setup

# Force overwrite existing configs
dev-quality setup --force

# Specify project path
dev-quality setup --config /path/to/project
```

**Options:**
- `--interactive, -i` - Run interactive setup wizard
- `--force, -f` - Overwrite existing configuration files
- `--config <path>` - Path to project or config file

#### `analyze` - Run Code Quality Analysis

```bash
# Analyze entire project
dev-quality analyze

# Analyze specific directories
dev-quality analyze src/ tests/

# Analyze with specific tools
dev-quality analyze --tools eslint,typescript

# Verbose output
dev-quality analyze --verbose
```

**Options:**
- `--tools <tools>` - Comma-separated list of tools to run
- `--config <path>` - Custom configuration file
- `--verbose, -v` - Detailed output
- `--quiet, -q` - Minimal output
- `--json` - Output as JSON

#### `report` - Generate Quality Reports

```bash
# Generate HTML report
dev-quality report --format html

# Generate and open
dev-quality report --format html --open

# Save to specific location
dev-quality report --output ./reports/quality-report.html
```

**Options:**
- `--format <type>` - Report format (html, json, markdown)
- `--output <path>` - Output file path
- `--open, -o` - Open report after generation

#### `config` - Manage Configuration

```bash
# View current configuration
dev-quality config

# Set configuration value
dev-quality config set tools.eslint.enabled true

# Get configuration value
dev-quality config get tools.eslint

# Reset configuration
dev-quality config reset
```

#### `detect` - Detect Project Configuration

```bash
# Detect current project
dev-quality detect

# Detect specific path
dev-quality detect /path/to/project

# Output as JSON
dev-quality detect --json
```

#### `help` - Show Help Information

```bash
# General help
dev-quality help

# Command-specific help
dev-quality help setup
dev-quality help analyze
```

### Configuration File

DevQuality uses a `.devquality.json` file for configuration:

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "type": "typescript",
  "frameworks": ["react"],
  "tools": [
    {
      "name": "eslint",
      "enabled": true,
      "config": {},
      "priority": 1
    },
    {
      "name": "prettier",
      "enabled": true,
      "config": {},
      "priority": 2
    },
    {
      "name": "typescript",
      "enabled": true,
      "config": {},
      "priority": 3
    }
  ],
  "paths": {
    "source": "./src",
    "tests": "./tests",
    "config": "./configs",
    "output": "./output"
  },
  "settings": {
    "verbose": false,
    "quiet": false,
    "json": false,
    "cache": true
  }
}
```

## 🛠 Development

### Project Structure

```
dev-quality-cli/
├── apps/
│   └── cli/                    # Main CLI application
│       ├── src/
│       │   ├── commands/       # CLI commands
│       │   ├── components/     # Ink UI components
│       │   │   └── wizard/    # Setup wizard components
│       │   ├── services/       # Business logic
│       │   │   └── wizard/    # Wizard services
│       │   ├── tools/         # Tool integrations
│       │   ├── utils/         # Utility functions
│       │   └── index.ts       # Entry point
│       └── tests/
│           ├── unit/          # Unit tests
│           ├── integration/   # Integration tests
│           └── e2e/          # End-to-end tests
│
├── packages/
│   ├── core/                  # Core functionality
│   ├── types/                 # Shared TypeScript types
│   ├── utils/                 # Shared utilities
│   └── plugins/              # Plugin packages
│
├── docs/                      # Documentation
│   ├── architecture/         # Architecture docs
│   ├── prd/                  # Product requirements
│   └── stories/              # User stories
│
└── scripts/                   # Build and utility scripts
```

### Development Scripts

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Development mode with watch
bun run dev

# Run linting
bun run lint

# Fix linting issues
bun run lint --fix

# Format code
bun run format

# Check formatting
bun run format:check

# Type checking
bun run typecheck

# Run all quality checks
bun run quality
```

### Adding New Features

1. **Create a new command:**
   ```bash
   # Create command file
   touch apps/cli/src/commands/my-command.ts
   ```

2. **Implement command logic:**
   ```typescript
   import { BaseCommand } from './base-command';

   export class MyCommand extends BaseCommand {
     async execute(): Promise<void> {
       // Implementation
     }
   }
   ```

3. **Add tests:**
   ```bash
   touch apps/cli/tests/commands/my-command.test.ts
   ```

4. **Update documentation**

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run CLI tests only
bun run test:cli

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test apps/cli/tests/unit/wizard/wizard-service.test.ts

# Run tests in watch mode
bun test --watch
```

### Test Structure

```bash
# Unit tests
bun test tests/unit/

# Integration tests
bun test tests/integration/

# Wizard tests (both unit and integration)
bun test tests/unit/wizard/ tests/integration/wizard/
```

### Test Coverage

```bash
# Generate coverage report
bun test --coverage

# View coverage report
open coverage/index.html
```

**Coverage Requirements:**
- Core functionality: **100%** coverage required
- New features: **90%+** coverage required
- Edge cases and error handling must be tested

### Writing Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';

describe('MyService', () => {
  let service: MyService;

  beforeEach(() => {
    service = new MyService();
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    const result = service.doSomething();
    expect(result).toBe(expected);
  });
});
```

## 🔍 Quality Checks

### Pre-commit Checks

```bash
# Run all quality checks
bun run quality

# Includes:
# - ESLint (linting)
# - Prettier (formatting)
# - TypeScript (type checking)
# - Tests (unit + integration)
```

### Continuous Integration

The project uses GitHub Actions for CI/CD:

- ✅ Linting on every push
- ✅ Type checking
- ✅ Test execution
- ✅ Coverage reports
- ✅ Build verification

## 🏗 Architecture

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | Bun | 1.0.0+ | JavaScript runtime and bundler |
| Language | TypeScript | 5.3.3+ | Type-safe development |
| CLI Framework | Commander.js | 11.0.0 | Command parsing |
| UI Framework | Ink | 4.0.0 | Terminal UI components |
| State Management | Zustand | 4.4.0 | CLI state management |
| Testing | Bun Test | 1.0.0+ | Unit and integration tests |
| Database | SQLite | 5.1.0 | Local configuration storage |

### Key Design Patterns

- **Command Pattern** - CLI command structure
- **Repository Pattern** - Database access
- **Service Layer** - Business logic separation
- **Component-Based UI** - Reusable Ink components
- **Plugin Architecture** - Extensible tool integration

## 🔒 Security

### Security Features

- **Path Sanitization** - Prevents directory traversal attacks
- **Command Injection Prevention** - Safe command execution
- **Input Validation** - All user inputs validated
- **JSON Validation** - Safe config file parsing
- **Secure Defaults** - Security-first configuration

### Reporting Security Issues

Please report security vulnerabilities to: security@devquality.io

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Run quality checks: `bun run quality`
6. Commit your changes: `git commit -m "feat: add my feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a Pull Request

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Code Standards

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: All rules must pass
- **Prettier**: Code must be formatted
- **Tests**: 90%+ coverage for new code
- **Documentation**: Update README and inline docs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) - Ultra-fast JavaScript runtime
- UI powered by [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- Inspired by best practices from the developer tools community

## 📞 Support

- **Documentation**: [docs.devquality.io](https://docs.devquality.io)
- **Issues**: [GitHub Issues](https://github.com/your-org/dev-quality-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/dev-quality-cli/discussions)
- **Twitter**: [@devquality](https://twitter.com/devquality)

## 🗺 Roadmap

### Current Version (v0.0.0)

- ✅ Interactive Setup Wizard
- ✅ Auto-Configuration Detection
- ✅ Tool Configuration Generators
- ✅ Configuration Validation
- ✅ Atomic Rollback System

### Coming Soon (v0.1.0)

- 🔄 SQLite Configuration Persistence
- 🔄 Initial Analysis Execution
- 🔄 Enhanced Reporting System
- 🔄 Plugin System

### Future (v0.2.0+)

- 📋 Monorepo Support
- 📋 Custom Templates
- 📋 CI/CD Integration
- 📋 Web Dashboard

---

**Made with ❤️ by the DevQuality Team**

*Empowering developers with better code quality tools*