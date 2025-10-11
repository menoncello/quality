/**
 * Microsoft Teams Integration Service
 *
 * Provides integration with Microsoft Teams for report notifications and sharing.
 * Supports adaptive cards, channel notifications, and message formatting.
 */

import fetch from 'node-fetch';

export interface TeamsConfig {
  webhookUrl: string;
  tenantId?: string;
  serviceUrl?: string;
  appId?: string;
  appPassword?: string;
}

export interface TeamsMessage {
  type: 'message' | 'adaptiveCard';
  title?: string;
  text: string;
  summary?: string;
  themeColor?: string;
  sections?: TeamsMessageSection[];
  potentialAction?: TeamsAction[];
}

export interface TeamsMessageSection {
  activityTitle?: string;
  activitySubtitle?: string;
  activityImage?: string;
  facts?: TeamsFact[];
  markdown?: boolean;
}

export interface TeamsFact {
  name: string;
  value: string;
}

export interface TeamsAction {
  '@type': 'OpenUri' | 'PostBack' | 'ActionCard';
  name: string;
  targets?: Array<{ os: 'default'; uri: string }>;
  data?: Record<string, unknown>;
}

export interface TeamsNotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

/**
 * Microsoft Teams Service
 * Handles sending report notifications to Microsoft Teams channels
 */
export class TeamsService {
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second base delay

  constructor(private config: TeamsConfig) {
    this.validateConfig();
  }

  /**
   * Send report notification to Teams
   */
  async sendReportNotification(
    reportData: {
      title: string;
      summary: string;
      reportUrl?: string;
      metrics: Record<string, any>;
      projectName: string;
    }
  ): Promise<TeamsNotificationResult> {
    const message = this.createReportMessage(reportData);
    return this.sendMessage(message);
  }

  /**
   * Send failure notification to Teams
   */
  async sendFailureNotification(
    failureData: {
      projectName: string;
      error: string;
      timestamp: Date;
      retryAttempt?: number;
    }
  ): Promise<TeamsNotificationResult> {
    const message = this.createFailureMessage(failureData);
    return this.sendMessage(message);
  }

  /**
   * Send trend alert to Teams
   */
  async sendTrendAlert(
    trendData: {
      projectName: string;
      metric: string;
      direction: 'up' | 'down';
      changePercentage: number;
      alertLevel: 'info' | 'warning' | 'critical';
    }
  ): Promise<TeamsNotificationResult> {
    const message = this.createTrendMessage(trendData);
    return this.sendMessage(message);
  }

  /**
   * Create report notification message
   */
  private createReportMessage(reportData: {
    title: string;
    summary: string;
    reportUrl?: string;
    metrics: Record<string, any>;
    projectName: string;
  }): TeamsMessage {
    const themeColor = this.getThemeColorForScore(reportData.metrics.overallScore || 0);

    const facts: TeamsFact[] = [
      { name: 'Project', value: reportData.projectName },
      { name: 'Overall Score', value: `${reportData.metrics.overallScore || 0}/100` },
      { name: 'Total Issues', value: reportData.metrics.totalIssues || 0 },
      { name: 'Errors', value: reportData.metrics.errorCount || 0 },
      { name: 'Warnings', value: reportData.metrics.warningCount || 0 }
    ];

    // Add fixable count if available
    if (reportData.metrics.fixableCount !== undefined) {
      facts.push({ name: 'Fixable Issues', value: reportData.metrics.fixableCount });
    }

    // Add duration if available
    if (reportData.metrics.duration) {
      facts.push({ name: 'Analysis Duration', value: `${(reportData.metrics.duration / 1000).toFixed(1)}s` });
    }

    const sections: TeamsMessageSection[] = [
      {
        activityTitle: reportData.title,
        activitySubtitle: new Date().toLocaleString(),
        facts,
        markdown: true
      }
    ];

    const actions: TeamsAction[] = [];

    if (reportData.reportUrl) {
      actions.push({
        '@type': 'OpenUri',
        name: 'View Full Report',
        targets: [
          {
            os: 'default',
            uri: reportData.reportUrl
          }
        ]
      });
    }

    return {
      type: 'message',
      title: reportData.title,
      text: reportData.summary,
      summary: `Quality report for ${reportData.projectName}`,
      themeColor,
      sections,
      potentialAction: actions.length > 0 ? actions : undefined
    };
  }

  /**
   * Create failure notification message
   */
  private createFailureMessage(failureData: {
    projectName: string;
    error: string;
    timestamp: Date;
    retryAttempt?: number;
  }): TeamsMessage {
    const sections: TeamsMessageSection[] = [
      {
        activityTitle: `❌ Report Generation Failed`,
        activitySubtitle: failureData.timestamp.toLocaleString(),
        facts: [
          { name: 'Project', value: failureData.projectName },
          { name: 'Error', value: this.truncateMessage(failureData.error, 300) },
          { name: 'Retry Attempt', value: failureData.retryAttempt?.toString() || '1' }
        ],
        markdown: false
      }
    ];

    return {
      type: 'message',
      title: 'Quality Report Generation Failed',
      text: `Failed to generate quality report for ${failureData.projectName}`,
      summary: `Report generation failed for ${failureData.projectName}`,
      themeColor: 'FF0000', // Red for failures
      sections
    };
  }

  /**
   * Create trend alert message
   */
  private createTrendMessage(trendData: {
    projectName: string;
    metric: string;
    direction: 'up' | 'down';
    changePercentage: number;
    alertLevel: 'info' | 'warning' | 'critical';
  }): TeamsMessage {
    const trendIcon = trendData.direction === 'up' ? '📈' : '📉';
    const themeColor = this.getThemeColorForAlert(trendData.alertLevel);

    const sections: TeamsMessageSection[] = [
      {
        activityTitle: `${trendIcon} Trend Alert`,
        activitySubtitle: new Date().toLocaleString(),
        facts: [
          { name: 'Project', value: trendData.projectName },
          { name: 'Metric', value: trendData.metric },
          { name: 'Direction', value: `${trendData.direction === 'up' ? 'Improving' : 'Declining'} (${trendData.changePercentage.toFixed(1)}%)` },
          { name: 'Alert Level', value: trendData.alertLevel.toUpperCase() }
        ],
        markdown: true
      }
    ];

    return {
      type: 'message',
      title: 'Quality Trend Alert',
      text: `${trendData.metric} is ${trendData.direction === 'up' ? 'improving' : 'declining'} by ${trendData.changePercentage.toFixed(1)}%`,
      summary: `Trend alert for ${trendData.projectName}`,
      themeColor,
      sections
    };
  }

  /**
   * Send message to Teams with retry logic
   */
  private async sendMessage(message: TeamsMessage): Promise<TeamsNotificationResult> {
    let retryCount = 0;

    while (retryCount <= this.maxRetries) {
      try {
        const response = await fetch(this.config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });

        if (response.ok) {
          return {
            success: true,
            messageId: `teams-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          };
        }

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateRetryDelay(retryCount);
          await this.sleep(delay);
          retryCount++;
          continue;
        }

        // Handle other HTTP errors
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

        // Wait before retry
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
   * Validate Teams configuration
   */
  private validateConfig(): void {
    if (!this.config.webhookUrl) {
      throw new Error('Teams webhook URL is required');
    }

    try {
      new URL(this.config.webhookUrl);
    } catch {
      throw new Error('Invalid Teams webhook URL format');
    }

    // Validate URL format for Teams webhook
    if (!this.config.webhookUrl.includes('office.com/webhook')) {
      throw new Error('Invalid Teams webhook URL - must be a valid Microsoft Teams webhook URL');
    }
  }

  /**
   * Get theme color based on score
   */
  private getThemeColorForScore(score: number): string {
    if (score >= 80) return '00FF00'; // Green
    if (score >= 60) return 'FFA500'; // Orange
    return 'FF0000'; // Red
  }

  /**
   * Get theme color based on alert level
   */
  private getThemeColorForAlert(alertLevel: 'info' | 'warning' | 'critical'): string {
    switch (alertLevel) {
      case 'info': return '0080FF'; // Blue
      case 'warning': return 'FFA500'; // Orange
      case 'critical': return 'FF0000'; // Red
      default: return '808080'; // Gray
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Truncate message to prevent overly long messages
   */
  private truncateMessage(message: string, maxLength: number): string {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test Teams connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testMessage: TeamsMessage = {
        type: 'message',
        title: 'Connection Test',
        text: 'Testing DevQuality CLI Teams integration',
        summary: 'Connection test message',
        themeColor: '00FF00'
      };

      const result = await this.sendMessage(testMessage);
      return {
        success: result.success,
        error: result.error
      };
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
  updateConfig(newConfig: Partial<TeamsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.validateConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): Omit<TeamsConfig, 'appPassword'> {
    const { appPassword, ...safeConfig } = this.config;
    return safeConfig;
  }
}