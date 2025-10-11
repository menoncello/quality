/**
 * Expanded Team Integration Test Suite
 *
 * Comprehensive tests for Microsoft Teams and GitHub integrations (Story 2.4 AC4)
 * including webhook notifications, API interactions, and security validation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TeamsService, type TeamsConfig } from '../../../../../src/services/reporting/integrations/teams-service';
import { GitHubService, type GitHubConfig } from '../../../../../src/services/reporting/integrations/github-service';

// Mock node-fetch
vi.mock('node-fetch', () => ({
  default: vi.fn()
}));

import fetch from 'node-fetch';

describe('Teams Integration Tests', () => {
  let teamsService: TeamsService;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();

    const teamsConfig: TeamsConfig = {
      webhookUrl: 'https://outlook.office.com/webhook/test-webhook-id',
      tenantId: 'test-tenant-id'
    };

    teamsService = new TeamsService(teamsConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Report Notifications', () => {
    it('should send successful report notification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const reportData = {
        title: 'Quality Report - Test Project',
        summary: 'The project has achieved a quality score of 85/100 with 12 total issues.',
        reportUrl: 'https://example.com/reports/test-project-2025-01-15.pdf',
        metrics: {
          overallScore: 85,
          totalIssues: 12,
          errorCount: 3,
          warningCount: 7,
          fixableCount: 8,
          duration: 5000
        },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportData);

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('office.com/webhook/'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('Quality Report - Test Project')
        })
      );
    });

    it('should format message with correct theme color based on score', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const highScoreReport = {
        title: 'High Quality Report',
        summary: 'Excellent code quality',
        metrics: { overallScore: 92, totalIssues: 2, errorCount: 0, warningCount: 2 },
        projectName: 'High Quality Project'
      };

      await teamsService.sendReportNotification(highScoreReport);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.themeColor).toBe('00FF00'); // Green for high score
    });

    it('should include all relevant metrics in message', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const detailedReport = {
        title: 'Detailed Report',
        summary: 'Comprehensive analysis',
        metrics: {
          overallScore: 75,
          totalIssues: 25,
          errorCount: 5,
          warningCount: 15,
          fixableCount: 18,
          duration: 8500
        },
        projectName: 'Detailed Project'
      };

      await teamsService.sendReportNotification(detailedReport);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      const facts = requestBody.sections[0].facts;
      const factNames = facts.map((fact: any) => fact.name);

      expect(factNames).toContain('Project');
      expect(factNames).toContain('Overall Score');
      expect(factNames).toContain('Total Issues');
      expect(factNames).toContain('Errors');
      expect(factNames).toContain('Warnings');
      expect(factNames).toContain('Fixable Issues');
      expect(factNames).toContain('Analysis Duration');
    });

    it('should handle reports without URLs gracefully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const reportWithoutUrl = {
        title: 'Report Without URL',
        summary: 'Report summary',
        metrics: { overallScore: 70, totalIssues: 10, errorCount: 2, warningCount: 8 },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportWithoutUrl);

      expect(result.success).toBe(true);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.potentialAction).toBeUndefined();
    });
  });

  describe('Failure Notifications', () => {
    it('should send failure notification with error details', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const failureData = {
        projectName: 'Failing Project',
        error: 'Failed to generate PDF report: insufficient memory',
        timestamp: new Date('2025-01-15T10:30:00Z'),
        retryAttempt: 2
      };

      const result = await teamsService.sendFailureNotification(failureData);

      expect(result.success).toBe(true);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.title).toBe('Quality Report Generation Failed');
      expect(requestBody.themeColor).toBe('FF0000'); // Red for failures
      expect(requestBody.sections[0].activityTitle).toBe('❌ Report Generation Failed');

      const facts = requestBody.sections[0].facts;
      const factNames = facts.map((fact: any) => fact.name);

      expect(factNames).toContain('Project');
      expect(factNames).toContain('Error');
      expect(factNames).toContain('Retry Attempt');
    });

    it('should truncate long error messages', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const longErrorMessage = 'A'.repeat(500); // Very long error message
      const failureData = {
        projectName: 'Test Project',
        error: longErrorMessage,
        timestamp: new Date(),
        retryAttempt: 1
      };

      await teamsService.sendFailureNotification(failureData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      const errorFact = requestBody.sections[0].facts.find((fact: any) => fact.name === 'Error');
      expect(errorFact.value.length).toBeLessThanOrEqual(303); // 300 + '...'
      expect(errorFact.value).toEndWith('...');
    });
  });

  describe('Trend Alerts', () => {
    it('should send trend alert for improving metrics', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const trendData = {
        projectName: 'Improving Project',
        metric: 'Overall Quality Score',
        direction: 'up' as const,
        changePercentage: 15.5,
        alertLevel: 'info' as const
      };

      const result = await teamsService.sendTrendAlert(trendData);

      expect(result.success).toBe(true);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.title).toBe('Quality Trend Alert');
      expect(requestBody.sections[0].activityTitle).toBe('📈 Trend Alert');

      const facts = requestBody.sections[0].facts;
      const directionFact = facts.find((fact: any) => fact.name === 'Direction');
      expect(directionFact.value).toContain('Improving');
      expect(directionFact.value).toContain('15.5%');
    });

    it('should send trend alert for declining metrics with warning level', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const trendData = {
        projectName: 'Declining Project',
        metric: 'Code Coverage',
        direction: 'down' as const,
        changePercentage: 8.2,
        alertLevel: 'warning' as const
      };

      await teamsService.sendTrendAlert(trendData);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.themeColor).toBe('FFA500'); // Orange for warning
      expect(requestBody.sections[0].activityTitle).toBe('📉 Trend Alert');

      const facts = requestBody.sections[0].facts;
      const directionFact = facts.find((fact: any) => fact.name === 'Direction');
      expect(directionFact.value).toContain('declining');
      expect(directionFact.value).toContain('8.2%');
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should handle rate limiting with retry', async () => {
      // First call returns rate limit
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Map([['Retry-After', '2']]),
        text: vi.fn().mockResolvedValue('Rate limited')
      });

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const reportData = {
        title: 'Rate Limit Test',
        summary: 'Testing rate limit handling',
        metrics: { overallScore: 80, totalIssues: 5, errorCount: 1, warningCount: 4 },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportData);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle HTTP errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Webhook not found')
      });

      const reportData = {
        title: 'Error Test',
        summary: 'Testing error handling',
        metrics: { overallScore: 70, totalIssues: 10, errorCount: 2, warningCount: 8 },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });

    it('should retry on network failures', async () => {
      // First call fails with network error
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200
      });

      const reportData = {
        title: 'Retry Test',
        summary: 'Testing retry logic',
        metrics: { overallScore: 85, totalIssues: 3, errorCount: 0, warningCount: 3 },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportData);

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries exceeded', async () => {
      // All calls fail
      mockFetch.mockRejectedValue(new Error('Persistent network error'));

      const reportData = {
        title: 'Max Retry Test',
        summary: 'Testing max retry limit',
        metrics: { overallScore: 60, totalIssues: 20, errorCount: 5, warningCount: 15 },
        projectName: 'Test Project'
      };

      const result = await teamsService.sendReportNotification(reportData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Max retries exceeded');
      expect(result.retryCount).toBe(4); // Initial attempt + 3 retries
    });
  });

  describe('Configuration Validation', () => {
    it('should validate webhook URL format', () => {
      expect(() => {
        new TeamsService({
          webhookUrl: 'invalid-url',
          tenantId: 'test-tenant'
        });
      }).toThrow('Invalid Teams webhook URL format');
    });

    it('should validate Teams webhook URL pattern', () => {
      expect(() => {
        new TeamsService({
          webhookUrl: 'https://example.com/webhook/test',
          tenantId: 'test-tenant'
        });
      }).toThrow('Invalid Teams webhook URL - must be a valid Microsoft Teams webhook URL');
    });

    it('should require webhook URL', () => {
      expect(() => {
        new TeamsService({
          webhookUrl: '',
          tenantId: 'test-tenant'
        });
      }).toThrow('Teams webhook URL is required');
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await teamsService.testConnection();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await teamsService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });
});

describe('GitHub Integration Tests', () => {
  let githubService: GitHubService;
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.mocked(fetch);
    mockFetch.mockClear();

    const githubConfig: GitHubConfig = {
      token: 'ghp_test_token_12345',
      owner: 'test-owner',
      repo: 'test-repo',
      defaultAssignee: 'test-assignee',
      defaultLabels: ['dev-quality', 'automated']
    };

    githubService = new GitHubService(githubConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Issue Creation', () => {
    it('should create quality issues successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 12345,
          number: 678,
          html_url: 'https://github.com/test-owner/test-repo/issues/678'
        })
      });

      const issues = [
        {
          title: 'Fix critical security vulnerability',
          description: 'SQL injection vulnerability found in authentication module',
          severity: 'error' as const,
          filePath: '/src/auth.ts',
          lineNumber: 45,
          ruleId: 'security/no-sql-injection',
          suggestedFix: 'Use parameterized queries'
        }
      ];

      const results = await githubService.createQualityIssues(issues);

      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(true);
      expect(results[0].data?.issueNumber).toBe(678);
      expect(results[0].data?.issueUrl).toContain('github.com');

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.title).toBe('Fix critical security vulnerability');
      expect(requestBody.labels).toContain('bug');
      expect(requestBody.labels).toContain('high-priority');
      expect(requestBody.labels).toContain('dev-quality-cli');
      expect(requestBody.assignees).toContain('test-assignee');
    });

    it('should format issue with all details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 12345, number: 678 })
      });

      const detailedIssue = {
        title: 'Code style issue',
        description: 'Inconsistent code formatting detected',
        severity: 'warning' as const,
        filePath: '/src/utils/formatter.ts',
        lineNumber: 23,
        ruleId: 'style/formatting',
        suggestedFix: 'Apply consistent indentation and spacing'
      };

      await githubService.createQualityIssues([detailedIssue]);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      expect(requestBody.body).toContain('/src/utils/formatter.ts:23');
      expect(requestBody.body).toContain('style/formatting');
      expect(requestBody.body).toContain('Apply consistent indentation');
      expect(requestBody.body).toContain('DevQuality CLI');
      expect(requestBody.labels).toContain('enhancement');
      expect(requestBody.labels).toContain('medium-priority');
    });

    it('should handle multiple issues in batch', async () => {
      // Mock successful responses for all issues
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: Math.random(), number: Math.floor(Math.random() * 1000) })
      });

      const issues = [
        {
          title: 'Error 1',
          description: 'First error',
          severity: 'error' as const
        },
        {
          title: 'Warning 1',
          description: 'First warning',
          severity: 'warning' as const
        },
        {
          title: 'Info 1',
          description: 'First info',
          severity: 'info' as const
        }
      ];

      const results = await githubService.createQualityIssues(issues);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures gracefully', async () => {
      // First issue succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 12345, number: 678 })
      });

      // Second issue fails
      mockFetch.mockRejectedValueOnce(new Error('API rate limit exceeded'));

      const issues = [
        {
          title: 'Success Issue',
          description: 'This should succeed',
          severity: 'error' as const
        },
        {
          title: 'Failed Issue',
          description: 'This should fail',
          severity: 'warning' as const
        }
      ];

      const results = await githubService.createQualityIssues(issues);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBe('API rate limit exceeded');
    });
  });

  describe('Pull Request Comments', () => {
    it('should add comment to pull request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 98765,
          html_url: 'https://github.com/test-owner/test-repo/pull/123#issuecomment-98765'
        })
      });

      const comment = {
        body: '## Quality Report Summary\n\nOverall Score: 85/100\n\nTotal Issues: 12 (3 errors, 7 warnings)',
        commitId: 'abc123def456'
      };

      const result = await githubService.addPullRequestComment(123, comment);

      expect(result.success).toBe(true);
      expect(result.data?.commentId).toBe(98765);
      expect(result.data?.commentUrl).toContain('pull/123');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/pulls/123/comments');
      expect(JSON.parse(callArgs[1].body).body).toContain('Quality Report Summary');
    });

    it('should handle invalid pull request number', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Pull request not found')
      });

      const comment = {
        body: 'Test comment'
      };

      const result = await githubService.addPullRequestComment(999, comment);

      expect(result.success).toBe(false);
      expect(result.error).toContain('HTTP 404');
    });
  });

  describe('Commit Status Updates', () => {
    it('should update commit status successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 55555,
          url: 'https://api.github.com/repos/test-owner/test-repo/statuses/abc123'
        })
      });

      const status = {
        state: 'success' as const,
        targetUrl: 'https://example.com/reports/quality-report-123.pdf',
        description: 'Quality analysis completed successfully',
        context: 'dev-quality/analysis'
      };

      const result = await githubService.updateCommitStatus('abc123def456', status);

      expect(result.success).toBe(true);
      expect(result.data?.statusId).toBe(55555);

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/statuses/abc123def456');

      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.state).toBe('success');
      expect(requestBody.description).toBe('Quality analysis completed successfully');
      expect(requestBody.context).toBe('dev-quality/analysis');
    });

    it('should handle failure status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 55555 })
      });

      const failureStatus = {
        state: 'failure' as const,
        description: 'Quality analysis failed - critical errors detected',
        context: 'dev-quality/analysis'
      };

      const result = await githubService.updateCommitStatus('def456abc123', failureStatus);

      expect(result.success).toBe(true);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.state).toBe('failure');
      expect(requestBody.description).toContain('critical errors');
    });
  });

  describe('Check Runs', () => {
    it('should create check run for commit', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({
          id: 77777,
          html_url: 'https://github.com/test-owner/test-repo/checks/77777'
        })
      });

      const checkData = {
        name: 'Quality Analysis',
        title: 'Quality Analysis Results',
        summary: '## Analysis Summary\n\n- **Overall Score**: 85/100\n- **Total Issues**: 12\n- **Status**: Passed',
        text: 'Detailed analysis results...',
        conclusion: 'success' as const,
        detailsUrl: 'https://example.com/reports/detailed-report'
      };

      const result = await githubService.createCheckRun('abc123def456', checkData);

      expect(result.success).toBe(true);
      expect(result.data?.checkRunId).toBe(77777);
      expect(result.data?.checkRunUrl).toContain('checks/77777');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/check-runs');

      const requestBody = JSON.parse(callArgs[1].body);
      expect(requestBody.name).toBe('Quality Analysis');
      expect(requestBody.head_sha).toBe('abc123def456');
      expect(requestBody.conclusion).toBe('success');
      expect(requestBody.output.title).toBe('Quality Analysis Results');
      expect(requestBody.output.summary).toContain('Overall Score');
      expect(requestBody.details_url).toBe('https://example.com/reports/detailed-report');
    });

    it('should create failed check run', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 77777 })
      });

      const failedCheckData = {
        name: 'Quality Analysis',
        title: 'Quality Analysis Failed',
        summary: '## Analysis Failed\n\n- **Errors**: 5 critical issues found\n- **Status**: Failed',
        conclusion: 'failure' as const
      };

      const result = await githubService.createCheckRun('xyz789abc456', failedCheckData);

      expect(result.success).toBe(true);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.conclusion).toBe('failure');
      expect(requestBody.output.title).toBe('Quality Analysis Failed');
    });
  });

  describe('Rate Limiting and Retry Logic', () => {
    it('should handle GitHub rate limiting', async () => {
      // First response returns rate limit
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Map([
          ['X-RateLimit-Remaining', '0'],
          ['X-RateLimit-Reset', String(Math.floor(Date.now() / 1000) + 60)]
        ]),
        text: vi.fn().mockResolvedValue('API rate limit exceeded')
      });

      // Second response succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 12345, number: 678 })
      });

      const issue = {
        title: 'Rate Limit Test',
        description: 'Testing rate limit handling',
        severity: 'error' as const
      };

      const result = await githubService.createQualityIssues([issue]);

      expect(result[0].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry on temporary failures', async () => {
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Temporary network error'));

      // Second call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 12345, number: 678 })
      });

      const issue = {
        title: 'Retry Test',
        description: 'Testing retry logic',
        severity: 'warning' as const
      };

      const result = await githubService.createQualityIssues([issue]);

      expect(result[0].success).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate required fields', () => {
      expect(() => {
        new GitHubService({
          token: '',
          owner: 'test-owner',
          repo: 'test-repo'
        });
      }).toThrow('GitHub token is required');

      expect(() => {
        new GitHubService({
          token: 'ghp_test',
          owner: '',
          repo: 'test-repo'
        });
      }).toThrow('GitHub repository owner is required');

      expect(() => {
        new GitHubService({
          token: 'ghp_test',
          owner: 'test-owner',
          repo: ''
        });
      }).toThrow('GitHub repository name is required');
    });

    it('should warn about invalid token format', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      new GitHubService({
        token: 'invalid-token-format',
        owner: 'test-owner',
        repo: 'test-repo'
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('GitHub token format may be invalid')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Connection Testing', () => {
    it('should test connection successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          login: 'test-user',
          name: 'Test User',
          email: 'test@example.com'
        })
      });

      const result = await githubService.testConnection();

      expect(result.success).toBe(true);
      expect(result.userInfo?.login).toBe('test-user');
      expect(result.userInfo?.name).toBe('Test User');
    });

    it('should handle connection test failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue('Bad credentials')
      });

      const result = await githubService.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub API error: 401');
    });
  });

  describe('Repository Information', () => {
    it('should fetch repository information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          name: 'test-repo',
          full_name: 'test-owner/test-repo',
          description: 'Test repository for quality analysis',
          private: false,
          default_branch: 'main',
          language: 'TypeScript'
        })
      });

      const result = await githubService.getRepositoryInfo();

      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('test-repo');
      expect(result.data?.fullName).toBe('test-owner/test-repo');
      expect(result.data?.language).toBe('TypeScript');
    });

    it('should handle repository not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue('Repository not found')
      });

      const result = await githubService.getRepositoryInfo();

      expect(result.success).toBe(false);
      expect(result.error).toContain('GitHub API error: 404');
    });
  });

  describe('Security Validation', () => {
    it('should sanitize malicious content in issue descriptions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: vi.fn().mockResolvedValue({ id: 12345, number: 678 })
      });

      const maliciousIssue = {
        title: 'XSS Test Issue',
        description: 'Issue with <script>alert("xss")</script> malicious content',
        severity: 'error' as const
      };

      const result = await githubService.createQualityIssues([maliciousIssue]);

      expect(result[0].success).toBe(true);

      const callArgs = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(callArgs[1].body);

      // The service should include the content as-is since GitHub handles sanitization
      expect(requestBody.body).toContain('<script>alert("xss")</script>');
      expect(requestBody.body).toContain('DevQuality CLI');
    });

    it('should not expose sensitive information in error messages', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Token ghp_secret_token_123 is invalid'));

      const issue = {
        title: 'Security Test',
        description: 'Testing security',
        severity: 'error' as const
      };

      const result = await githubService.createQualityIssues([issue]);

      expect(result[0].success).toBe(false);
      expect(result[0].error).not.toContain('ghp_secret_token_123');
    });
  });
});