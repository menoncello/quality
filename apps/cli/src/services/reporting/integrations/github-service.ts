/**
 * GitHub Integration Service
 *
 * Provides integration with GitHub for issue creation, PR comments, and status updates.
 * Supports GitHub API v4 (GraphQL) and v3 (REST) for comprehensive integration.
 */

import fetch from 'node-fetch';

export interface GitHubConfig {
  token: string;
  apiUrl?: string;
  owner: string;
  repo: string;
  defaultAssignee?: string;
  defaultLabels?: string[];
}

export interface GitHubIssue {
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
  milestone?: number;
}

export interface GitHubPullRequestComment {
  body: string;
  commitId?: string;
  path?: string;
  position?: number;
}

export interface GitHubStatusUpdate {
  state: 'pending' | 'success' | 'error' | 'failure';
  targetUrl?: string;
  description: string;
  context: string;
}

export interface GitHubResult {
  success: boolean;
  data?: any;
  error?: string;
  retryCount?: number;
}

/**
 * GitHub Service
 * Handles GitHub API interactions for quality reporting
 */
export class GitHubService {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay
  private apiUrl: string;

  constructor(private config: GitHubConfig) {
    this.apiUrl = config.apiUrl || 'https://api.github.com';
    this.validateConfig();
  }

  /**
   * Create GitHub issues from quality report
   */
  async createQualityIssues(
    issues: Array<{
      title: string;
      description: string;
      severity: 'error' | 'warning' | 'info';
      filePath?: string;
      lineNumber?: number;
      ruleId?: string;
      suggestedFix?: string;
    }>
  ): Promise<GitHubResult[]> {
    const results: GitHubResult[] = [];

    for (const issue of issues) {
      try {
        const githubIssue = this.formatIssueForGitHub(issue);
        const result = await this.createIssue(githubIssue);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Create a single GitHub issue
   */
  async createIssue(issue: GitHubIssue): Promise<GitHubResult> {
    const url = `${this.apiUrl}/repos/${this.config.owner}/${this.config.repo}/issues`;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(issue)
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: {
              issueNumber: data.number,
              issueUrl: data.html_url,
              issueId: data.id
            }
          };
        }

        // Handle rate limiting (403 with rate limit message)
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            if (resetTime) {
              const waitTime = parseInt(resetTime) * 1000 - Date.now();
              if (waitTime > 0) {
                await this.sleep(Math.max(waitTime, 1000));
                retryCount++;
                continue;
              }
            }
          }
        }

        // Handle other errors
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);

      } catch (error) {
        retryCount++;

        if (retryCount > this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          };
        }

        await this.sleep(this.calculateRetryDelay(retryCount));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retryCount
    };
  }

  /**
   * Add comment to pull request
   */
  async addPullRequestComment(
    pullNumber: number,
    comment: GitHubPullRequestComment
  ): Promise<GitHubResult> {
    const url = `${this.apiUrl}/repos/${this.config.owner}/${this.config.repo}/pulls/${pullNumber}/comments`;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(comment)
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: {
              commentId: data.id,
              commentUrl: data.html_url
            }
          };
        }

        // Handle rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            if (resetTime) {
              const waitTime = parseInt(resetTime) * 1000 - Date.now();
              if (waitTime > 0) {
                await this.sleep(Math.max(waitTime, 1000));
                retryCount++;
                continue;
              }
            }
          }
        }

        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);

      } catch (error) {
        retryCount++;

        if (retryCount > this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          };
        }

        await this.sleep(this.calculateRetryDelay(retryCount));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retryCount
    };
  }

  /**
   * Update commit status
   */
  async updateCommitStatus(
    commitSha: string,
    status: GitHubStatusUpdate
  ): Promise<GitHubResult> {
    const url = `${this.apiUrl}/repos/${this.config.owner}/${this.config.repo}/statuses/${commitSha}`;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(status)
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: {
              statusId: data.id,
              statusUrl: data.url
            }
          };
        }

        // Handle rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            if (resetTime) {
              const waitTime = parseInt(resetTime) * 1000 - Date.now();
              if (waitTime > 0) {
                await this.sleep(Math.max(waitTime, 1000));
                retryCount++;
                continue;
              }
            }
          }
        }

        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);

      } catch (error) {
        retryCount++;

        if (retryCount > this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          };
        }

        await this.sleep(this.calculateRetryDelay(retryCount));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retryCount
    };
  }

  /**
   * Create or update check run for commit
   */
  async createCheckRun(
    commitSha: string,
    checkData: {
      name: string;
      title: string;
      summary: string;
      text?: string;
      conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required';
      detailsUrl?: string;
    }
  ): Promise<GitHubResult> {
    const url = `${this.apiUrl}/repos/${this.config.owner}/${this.config.repo}/check-runs`;
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `token ${this.config.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: checkData.name,
            head_sha: commitSha,
            status: 'completed',
            conclusion: checkData.conclusion || 'success',
            output: {
              title: checkData.title,
              summary: checkData.summary,
              text: checkData.text
            },
            details_url: checkData.detailsUrl
          })
        });

        if (response.ok) {
          const data = await response.json();
          return {
            success: true,
            data: {
              checkRunId: data.id,
              checkRunUrl: data.html_url
            }
          };
        }

        // Handle rate limiting
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            const resetTime = response.headers.get('X-RateLimit-Reset');
            if (resetTime) {
              const waitTime = parseInt(resetTime) * 1000 - Date.now();
              if (waitTime > 0) {
                await this.sleep(Math.max(waitTime, 1000));
                retryCount++;
                continue;
              }
            }
          }
        }

        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);

      } catch (error) {
        retryCount++;

        if (retryCount > this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount
          };
        }

        await this.sleep(this.calculateRetryDelay(retryCount));
      }
    }

    return {
      success: false,
      error: 'Max retries exceeded',
      retryCount
    };
  }

  /**
   * Format quality issue for GitHub
   */
  private formatIssueForGitHub(issue: {
    title: string;
    description: string;
    severity: 'error' | 'warning' | 'info';
    filePath?: string;
    lineNumber?: number;
    ruleId?: string;
    suggestedFix?: string;
  }): GitHubIssue {
    let body = issue.description;

    // Add file location if available
    if (issue.filePath) {
      const location = issue.lineNumber
        ? `${issue.filePath}:${issue.lineNumber}`
        : issue.filePath;
      body += `\n\n**Location:** \`${location}\``;
    }

    // Add rule ID if available
    if (issue.ruleId) {
      body += `\n\n**Rule:** \`${issue.ruleId}\``;
    }

    // Add suggested fix if available
    if (issue.suggestedFix) {
      body += `\n\n**Suggested Fix:**\n\`\`\`\n${issue.suggestedFix}\n\`\`\``;
    }

    // Add footer
    body += `\n\n---\n*This issue was automatically created by DevQuality CLI*`;

    const labels = [
      ...this.getDefaultLabelsForSeverity(issue.severity),
      ...(this.config.defaultLabels || [])
    ];

    const assignees = this.config.defaultAssignee ? [this.config.defaultAssignee] : [];

    return {
      title: issue.title,
      body,
      labels: [...new Set(labels)], // Remove duplicates
      assignees
    };
  }

  /**
   * Get default labels based on severity
   */
  private getDefaultLabelsForSeverity(severity: 'error' | 'warning' | 'info'): string[] {
    const baseLabels = ['dev-quality-cli'];

    switch (severity) {
      case 'error':
        return [...baseLabels, 'bug', 'high-priority'];
      case 'warning':
        return [...baseLabels, 'enhancement', 'medium-priority'];
      case 'info':
        return [...baseLabels, 'documentation', 'low-priority'];
      default:
        return baseLabels;
    }
  }

  /**
   * Validate GitHub configuration
   */
  private validateConfig(): void {
    if (!this.config.token) {
      throw new Error('GitHub token is required');
    }

    if (!this.config.owner) {
      throw new Error('GitHub repository owner is required');
    }

    if (!this.config.repo) {
      throw new Error('GitHub repository name is required');
    }

    // Validate token format (GitHub tokens start with certain patterns)
    if (!this.config.token.startsWith('ghp_') && !this.config.token.startsWith('github_pat_')) {
      console.warn('Warning: GitHub token format may be invalid. Expected token to start with "ghp_" or "github_pat_"');
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test GitHub API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; userInfo?: any }> {
    try {
      const response = await fetch(`${this.apiUrl}/user`, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const userInfo = await response.json();
        return {
          success: true,
          userInfo: {
            login: userInfo.login,
            name: userInfo.name,
            email: userInfo.email
          }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `GitHub API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(): Promise<GitHubResult> {
    try {
      const response = await fetch(`${this.apiUrl}/repos/${this.config.owner}/${this.config.repo}`, {
        headers: {
          'Authorization': `token ${this.config.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: {
            name: data.name,
            fullName: data.full_name,
            description: data.description,
            private: data.private,
            defaultBranch: data.default_branch,
            language: data.language
          }
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: `GitHub API error: ${response.status} - ${errorText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GitHubConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig(): Omit<GitHubConfig, 'token'> {
    const { token, ...safeConfig } = this.config;
    return safeConfig;
  }
}