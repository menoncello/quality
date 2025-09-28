# Deployment Architecture

## Deployment Strategy

**CLI Distribution:**

- **Platform:** npm registry
- **Build Command:** `bun run build`
- **Output Directory:** `dist/`
- **CDN/Edge:** N/A (distributed via npm)

**Plugin Distribution:**

- **Platform:** npm registry
- **Build Command:** `bun run build:plugin`
- **Output Directory:** `packages/*/dist/`
- **Deployment Method:** npm publish

## CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test:coverage

      - name: Run linting
        run: bun run lint

      - name: Type check
        run: bun run typecheck

      - name: Build packages
        run: bun run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  release:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Build packages
        run: bun run build

      - name: Publish to npm
        run: |
          echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc
          bun run publish
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Environments

| Environment | Frontend URL | Backend URL | Purpose           |
| ----------- | ------------ | ----------- | ----------------- |
| Development | N/A          | N/A         | Local development |
| Testing     | N/A          | N/A         | CI/CD testing     |
| Production  | N/A          | N/A         | Released CLI tool |
