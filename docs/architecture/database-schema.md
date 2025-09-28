# Database Schema

## SQLite Schema for Local Caching

```sql
-- Project configurations
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    path TEXT UNIQUE NOT NULL,
    name TEXT,
    type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tool configurations
CREATE TABLE tool_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    config_path TEXT,
    version TEXT,
    options TEXT, -- JSON
    status TEXT DEFAULT 'active',
    last_run DATETIME,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE(project_id, tool_name)
);

-- Analysis results
CREATE TABLE analysis_results (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timestamp DATETIME NOT NULL,
    duration INTEGER NOT NULL,
    overall_score INTEGER NOT NULL,
    summary TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tool execution results
CREATE TABLE tool_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    execution_time INTEGER NOT NULL,
    status TEXT NOT NULL,
    metrics TEXT, -- JSON
    coverage_data TEXT, -- JSON
    FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
);

-- Individual issues
CREATE TABLE issues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_result_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    message TEXT NOT NULL,
    rule_id TEXT,
    fixable BOOLEAN DEFAULT FALSE,
    suggestion TEXT,
    score INTEGER DEFAULT 0,
    FOREIGN KEY (tool_result_id) REFERENCES tool_results(id) ON DELETE CASCADE
);

-- AI prompts
CREATE TABLE ai_prompts (
    id TEXT PRIMARY KEY,
    analysis_id TEXT NOT NULL,
    type TEXT NOT NULL,
    target_file TEXT NOT NULL,
    target_issue TEXT,
    prompt TEXT NOT NULL,
    context TEXT NOT NULL,
    target_model TEXT NOT NULL,
    effectiveness INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (analysis_id) REFERENCES analysis_results(id) ON DELETE CASCADE
);

-- Cache entries
CREATE TABLE cache_entries (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    access_count INTEGER DEFAULT 0,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL, -- JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_analysis_results_project_timestamp ON analysis_results(project_id, timestamp DESC);
CREATE INDEX idx_tool_results_analysis ON tool_results(analysis_id);
CREATE INDEX idx_issues_tool_result ON issues(tool_result_id);
CREATE INDEX idx_issues_file_type ON issues(file_path, type);
CREATE INDEX idx_cache_expires ON cache_entries(expires_at);
CREATE INDEX idx_cache_access ON cache_entries(last_accessed);

-- Triggers for data consistency
CREATE TRIGGER update_project_timestamp
    AFTER UPDATE ON projects
    BEGIN
        UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER clean_expired_cache
    AFTER INSERT ON cache_entries
    BEGIN
        DELETE FROM cache_entries WHERE expires_at < CURRENT_TIMESTAMP;
    END;
```

## Data Access Layer

```typescript
// Repository pattern for database access
interface ProjectRepository {
  findById(id: string): Promise<ProjectConfiguration | null>;
  findByPath(path: string): Promise<ProjectConfiguration | null>;
  save(project: ProjectConfiguration): Promise<void>;
  delete(id: string): Promise<void>;
}

interface AnalysisResultRepository {
  save(result: AnalysisResult): Promise<void>;
  findByProject(projectId: string): Promise<AnalysisResult[]>;
  findRecent(projectId: string, limit: number): Promise<AnalysisResult[]>;
}

interface CacheRepository {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}
```
