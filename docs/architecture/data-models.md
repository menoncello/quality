# Data Models

## ProjectConfiguration

**Purpose:** Stores project-specific configuration and detected settings

**Key Attributes:**

- projectPath: string - Absolute path to project root
- projectType: 'javascript' | 'typescript' | 'mixed' - Detected project language
- tools: ToolConfiguration[] - Configured analysis tools
- settings: UserSettings - User preferences and options
- lastAnalysis: AnalysisResult | null - Cached last analysis results
- createdAt: Date - Configuration creation timestamp
- updatedAt: Date - Last modification timestamp

**TypeScript Interface:**

```typescript
interface ProjectConfiguration {
  projectPath: string;
  projectType: "javascript" | "typescript" | "mixed";
  tools: ToolConfiguration[];
  settings: UserSettings;
  lastAnalysis?: AnalysisResult;
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships:**

- Has many ToolConfiguration records
- Has one UserSettings
- References many AnalysisResult records

## ToolConfiguration

**Purpose:** Individual tool configuration and settings

**Key Attributes:**

- toolName: string - Name of the analysis tool (eslint, prettier, etc.)
- enabled: boolean - Whether the tool is active
- configPath: string - Path to configuration file
- version: string - Tool version
- options: Record<string, any> - Tool-specific settings
- lastRun: Date | null - Last execution timestamp
- status: 'active' | 'error' | 'disabled' - Current tool status

**TypeScript Interface:**

```typescript
interface ToolConfiguration {
  toolName: string;
  enabled: boolean;
  configPath: string;
  version: string;
  options: Record<string, any>;
  lastRun?: Date;
  status: "active" | "error" | "disabled";
}
```

**Relationships:**

- Belongs to ProjectConfiguration
- Has many AnalysisResult records

## AnalysisResult

**Purpose:** Stores comprehensive analysis results from tool execution

**Key Attributes:**

- id: string - Unique result identifier
- projectId: string - Associated project identifier
- timestamp: Date - Analysis execution time
- duration: number - Execution duration in milliseconds
- overallScore: number - Overall quality score (0-100)
- toolResults: ToolResult[] - Individual tool results
- summary: ResultSummary - Aggregated metrics and insights
- aiPrompts: AIPrompt[] - Generated AI prompts for improvements

**TypeScript Interface:**

```typescript
interface AnalysisResult {
  id: string;
  projectId: string;
  timestamp: Date;
  duration: number;
  overallScore: number;
  toolResults: ToolResult[];
  summary: ResultSummary;
  aiPrompts: AIPrompt[];
}
```

**Relationships:**

- Belongs to ProjectConfiguration
- Has many ToolResult records
- Has many AIPrompt records

## ToolResult

**Purpose:** Individual tool execution results

**Key Attributes:**

- toolName: string - Tool that generated the result
- executionTime: number - Tool execution duration
- status: 'success' | 'error' | 'warning' - Execution status
- issues: Issue[] - Identified issues and problems
- metrics: ToolMetrics - Tool-specific metrics
- coverage?: CoverageData - Test coverage data (if applicable)

**TypeScript Interface:**

```typescript
interface ToolResult {
  toolName: string;
  executionTime: number;
  status: "success" | "error" | "warning";
  issues: Issue[];
  metrics: ToolMetrics;
  coverage?: CoverageData;
}
```

**Relationships:**

- Belongs to AnalysisResult
- Has many Issue records

## Issue

**Purpose:** Individual issue or problem identified by analysis tools

**Key Attributes:**

- id: string - Unique issue identifier
- type: 'error' | 'warning' | 'info' - Issue severity
- toolName: string - Tool that identified the issue
- filePath: string - File containing the issue
- lineNumber: number - Line number of issue
- message: string - Issue description
- ruleId?: string - Rule identifier (if applicable)
- fixable: boolean - Whether issue can be auto-fixed
- suggestion?: string - Suggested fix or improvement
- score: number - Impact score for prioritization

**TypeScript Interface:**

```typescript
interface Issue {
  id: string;
  type: "error" | "warning" | "info";
  toolName: string;
  filePath: string;
  lineNumber: number;
  message: string;
  ruleId?: string;
  fixable: boolean;
  suggestion?: string;
  score: number;
}
```

**Relationships:**

- Belongs to ToolResult

## AIPrompt

**Purpose:** AI-optimized prompts for code improvement suggestions

**Key Attributes:**

- id: string - Unique prompt identifier
- type: 'fix' | 'improve' | 'refactor' - Prompt purpose
- targetFile: string - Target file for improvements
- targetIssue?: string - Associated issue identifier
- prompt: string - Generated prompt text
- context: string - Context information for AI
- targetModel: 'claude' | 'gpt' | 'generic' - Target AI model
- effectiveness?: number - User feedback on prompt effectiveness

**TypeScript Interface:**

```typescript
interface AIPrompt {
  id: string;
  type: "fix" | "improve" | "refactor";
  targetFile: string;
  targetIssue?: string;
  prompt: string;
  context: string;
  targetModel: "claude" | "gpt" | "generic";
  effectiveness?: number;
}
```

**Relationships:**

- Belongs to AnalysisResult
