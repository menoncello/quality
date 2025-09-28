# Source Tree

## Full Project Structure

```
dev-quality-cli/
├── .github/                    # GitHub Actions CI/CD
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       ├── release.yml         # Release automation
│       └── deploy.yml          # Deployment
├── apps/                        # Application packages
│   └── cli/                     # Main CLI application
│       ├── src/
│       │   ├── commands/        # CLI command implementations
│       │   │   ├── setup.ts     # Setup wizard
│       │   │   ├── analyze.ts   # Analysis commands
│       │   │   ├── config.ts    # Configuration commands
│       │   │   └── report.ts    # Report commands
│       │   ├── components/      # Reusable CLI components
│       │   │   ├── progress.ts  # Progress indicators
│       │   │   ├── tables.ts    # Table formatting
│       │   │   └── charts.ts    # ASCII charts
│       │   ├── hooks/          # Custom React hooks
│       │   │   ├── useConfig.ts # Config management
│       │   │   ├── useAnalysis.ts # Analysis state
│       │   │   └── useCache.ts   # Cache management
│       │   ├── services/        # Business logic services
│       │   │   ├── analysis/    # Analysis engine
│       │   │   ├── config/      # Configuration management
│       │   │   ├── storage/     # Data persistence
│       │   │   └── reporting/   # Report generation
│       │   ├── tools/           # Analysis tool integrations
│       │   │   ├── bun-test.ts  # Bun test plugin
│       │   │   ├── eslint.ts    # ESLint plugin
│       │   │   ├── prettier.ts  # Prettier plugin
│       │   │   └── typescript.ts # TypeScript plugin
│       │   ├── utils/           # Utility functions
│       │   │   ├── formatting.ts # Text formatting
│       │   │   ├── validation.ts # Input validation
│       │   │   └── navigation.ts # Navigation helpers
│       │   ├── types/           # TypeScript type definitions
│       │   │   ├── api.ts       # API interfaces
│       │   │   ├── config.ts    # Configuration types
│       │   │   └── analysis.ts  # Analysis types
│       │   ├── constants/       # Application constants
│       │   ├── styles/          # CLI styling and themes
│       │   └── index.ts         # Main entry point
│       ├── tests/               # Test files
│       │   ├── integration/     # Integration tests
│       │   ├── e2e/            # End-to-end tests
│       │   └── fixtures/       # Test fixtures
│       ├── package.json
│       └── tsconfig.json
├── packages/                    # Shared packages
│   ├── core/                   # Core functionality
│   │   ├── src/
│   │   │   ├── analysis/       # Analysis engine interfaces
│   │   │   ├── plugins/        # Plugin system
│   │   │   ├── cache/          # Caching interfaces
│   │   │   └── events/         # Event system
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts        # Type exports
│   │   │   ├── plugin.ts       # Plugin interfaces
│   │   │   ├── analysis.ts     # Analysis types
│   │   │   └── config.ts       # Configuration types
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/                  # Shared utilities
│   │   ├── src/
│   │   │   ├── crypto.ts       # Cryptographic utilities
│   │   │   ├── file.ts         # File system utilities
│   │   │   ├── string.ts       # String utilities
│   │   │   └── async.ts        # Async utilities
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── plugins/                # Plugin packages
│       ├── bun-test/          # Bun test plugin
│       ├── eslint/            # ESLint plugin
│       ├── prettier/          # Prettier plugin
│       └── typescript/        # TypeScript plugin
├── infrastructure/              # Infrastructure definitions
│   ├── database/              # Database schema and migrations
│   │   ├── migrations/        # Database migration files
│   │   └── seeds/             # Database seeds
│   └── scripts/               # Infrastructure scripts
├── configs/                    # Shared configuration files
│   ├── eslint/                # ESLint configuration
│   │   ├── index.js
│   │   └── base.js
│   ├── typescript/            # TypeScript configuration
│   │   ├── base.json
│   │   └── react.json
│   └── jest/                  # Jest testing configuration
│       ├── base.js
│       └── cli.js
├── docs/                       # Documentation
│   ├── prd.md                 # Product requirements
│   ├── architecture.md        # Architecture documentation
│   ├── api.md                 # API documentation
│   ├── plugin-development.md  # Plugin development guide
│   └── examples/              # Example configurations
├── scripts/                    # Build and deployment scripts
│   ├── build.ts               # Build script
│   ├── test.ts                # Test runner script
│   ├── deploy.ts              # Deployment script
│   └── release.ts             # Release automation script
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json
├── tsconfig.base.json         # Base TypeScript configuration
└── README.md                  # Project documentation
```
