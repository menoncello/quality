# Project Structure

## Monorepo Layout
```
dev-quality-cli/
├── apps/
│   └── cli/                    # Main CLI application
│       ├── src/
│       │   ├── commands/       # CLI command implementations
│       │   ├── components/     # Reusable CLI components (Ink)
│       │   ├── hooks/          # Custom React hooks
│       │   ├── services/       # Business logic services
│       │   ├── tools/          # Analysis tool integrations
│       │   ├── utils/          # Utility functions
│       │   ├── types/          # TypeScript type definitions
│       │   ├── constants/      # Application constants
│       │   ├── styles/         # CLI styling and themes
│       │   └── index.ts        # Main entry point
│       ├── tests/              # Test files
│       ├── dist/               # Build output
│       └── package.json
│
├── packages/
│   ├── core/                   # Core functionality
│   │   ├── src/
│   │   │   ├── analysis/       # Analysis engine interfaces
│   │   │   ├── plugins/        # Plugin system
│   │   │   ├── cache/          # Caching interfaces
│   │   │   └── events/         # Event system
│   │   └── package.json
│   │
│   ├── types/                  # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── plugin.ts       # Plugin interfaces
│   │   │   ├── analysis.ts     # Analysis types
│   │   │   └── config.ts       # Configuration types
│   │   └── package.json
│   │
│   └── utils/                  # Shared utilities
│       ├── src/
│       │   ├── crypto.ts       # Cryptographic utilities
│       │   ├── file.ts         # File system utilities
│       │   ├── string.ts       # String utilities
│       │   └── async.ts        # Async utilities
│       └── package.json
│
├── docs/                       # Documentation
│   ├── architecture/          # Architecture docs (sharded)
│   ├── prd/                   # Product requirements (sharded)
│   ├── qa/                    # QA documentation
│   └── stories/               # User stories
│
├── scripts/                   # Build and deployment scripts
├── configs/                   # Shared configuration files
├── infrastructure/            # Infrastructure definitions
├── .bmad-core/               # BMAD core configuration
└── package.json              # Root workspace configuration
```

## Key Directories

### Apps
- Contains deployable applications
- Currently only `cli` application

### Packages
- Shared code used by apps
- `core` - Core business logic and interfaces
- `types` - Shared TypeScript definitions
- `utils` - Common utilities

### Docs
- Architecture documentation in `docs/architecture/`
- Product requirements in `docs/prd/`
- QA documentation in `docs/qa/`
- User stories in `docs/stories/`

## Important Files
- `.bmad-core/core-config.yaml` - BMAD configuration
- `tsconfig.base.json` - Base TypeScript config
- `.prettierrc` - Prettier formatting rules
- `apps/cli/eslint.config.js` - ESLint configuration