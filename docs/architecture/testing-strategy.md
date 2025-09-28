# Testing Strategy

## Testing Pyramid

```
      E2E Tests
     /        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

## Test Organization

### Frontend Tests

```
apps/cli/tests/
├── unit/                    # Unit tests for CLI components
│   ├── components/         # Component tests
│   ├── commands/           # Command tests
│   └── utils/              # Utility tests
├── integration/            # Integration tests
│   ├── analysis/           # Analysis workflows
│   ├── configuration/      # Configuration management
│   └── plugins/            # Plugin system
└── e2e/                    # End-to-end tests
    ├── setup-wizard.ts     # Setup workflow
    ├── analysis-commands.ts # Analysis commands
    └── report-generation.ts # Report generation
```

### Backend Tests

```
packages/*/tests/
├── unit/                   # Unit tests for core functionality
├── integration/            # Integration tests
└── fixtures/              # Test data and fixtures
```

### E2E Tests

```
tests/e2e/
├── cli-workflows.ts        # CLI workflow tests
├── plugin-system.ts        # Plugin system tests
└── performance.ts          # Performance tests
```

## Test Examples

### Frontend Component Test

```typescript
// Progress component test
import { render } from "@testing-library/react";
import Progress from "../../src/components/progress";

describe("Progress Component", () => {
  it("renders progress bar correctly", () => {
    const { container } = render(
      <Progress current={50} total={100} label="Analysis Progress" />
    );

    expect(container).toHaveTextContent("Analysis Progress");
    expect(container).toHaveTextContent("50%");
    expect(container).toHaveTextContent("50 / 100");
  });

  it("shows 0% when no progress", () => {
    const { container } = render(<Progress current={0} total={100} />);

    expect(container).toHaveTextContent("0%");
  });

  it("shows 100% when complete", () => {
    const { container } = render(<Progress current={100} total={100} />);

    expect(container).toHaveTextContent("100%");
  });
});
```

### Backend API Test

```typescript
// Analysis service test
import { AnalysisService } from "../../src/services/analysis";
import { mockProjectConfig } from "../fixtures";

describe("AnalysisService", () => {
  let analysisService: AnalysisService;

  beforeEach(() => {
    analysisService = new AnalysisService();
  });

  it("runs quick analysis successfully", async () => {
    const result = await analysisService.runQuickAnalysis(
      mockProjectConfig.path
    );

    expect(result).toBeDefined();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.toolResults).toHaveLength(4); // 4 main tools
  });

  it("caches quick analysis results", async () => {
    const projectPath = mockProjectConfig.path;

    // First call - cache miss
    const result1 = await analysisService.runQuickAnalysis(projectPath);

    // Second call - cache hit
    const result2 = await analysisService.runQuickAnalysis(projectPath);

    expect(result1).toEqual(result2);
  });
});
```

### E2E Test

```typescript
// CLI workflow test
import { execSync } from "child_process";
import { join } from "path";

describe("CLI Workflows", () => {
  const testProject = join(__dirname, "fixtures/test-project");

  it("setup wizard creates valid configuration", () => {
    process.chdir(testProject);

    // Run setup wizard with automated responses
    execSync('echo "yes" | dev-quality setup', {
      cwd: testProject,
      stdio: "pipe"
    });

    // Verify configuration file exists
    expect(fs.existsSync(join(testProject, ".dev-quality.json"))).toBe(true);
  });

  it("quick analysis generates valid output", () => {
    process.chdir(testProject);

    const output = execSync("dev-quality quick --json", {
      cwd: testProject,
      encoding: "utf8"
    });

    const result = JSON.parse(output);
    expect(result.overallScore).toBeDefined();
    expect(result.toolResults).toBeDefined();
    expect(result.duration).toBeDefined();
  });
});
```
