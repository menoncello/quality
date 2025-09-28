# Development Workflow

## Local Development Setup

### Prerequisites

```bash
# Required tools
bun --version                    # >= 1.0.0
node --version                    # >= 18.0.0 (fallback)

# Optional development tools
git --version                     # >= 2.0.0
docker --version                  # >= 20.0.0 (for testing)
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/dev-quality-cli.git
cd dev-quality-cli

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Link CLI for local development
bun link
bun link dev-quality-cli
```

### Development Commands

```bash
# Start all services in development mode
bun run dev

# Start CLI only
bun run dev:cli

# Start specific package in watch mode
bun run dev:package --package core

# Run tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run linting
bun run lint

# Run type checking
bun run typecheck

# Build for production
bun run build

# Run local CLI
dev-quality --help
```

## Environment Configuration

### Required Environment Variables

```bash
# Development environment (.env.local)
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=dev-quality:*

# Production environment (.env.production)
NODE_ENV=production
LOG_LEVEL=info
```

### Optional Environment Variables

```bash
# Analytics tracking (optional)
ANALYTICS_ENABLED=false
ANALYTICS_ENDPOINT=https://analytics.dev-quality.com

# Plugin registry (optional)
PLUGIN_REGISTRY_URL=https://plugins.dev-quality.com

# AI integration (optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```
