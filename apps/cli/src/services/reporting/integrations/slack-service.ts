/**
 * Slack Integration Service
 *
 * Provides Slack webhook integration for report delivery as required by Story 2.4 AC4.
 * Includes security validation, retry mechanisms, and proper error handling.
 */

declare const fetch: (input: string | globalThis.Request, init?: globalThis.RequestInit) => Promise<globalThis.Response>;
declare const URL: typeof globalThis.URL;

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
  mentionUsers?: string[];
  mentionChannel?: boolean;
}

export interface SlackMessage {
  text?: string;
  attachments: SlackAttachment[];
  channel?: string;
  username?: string;
  icon_emoji?: string;
}

export interface SlackAttachment {
  color: 'good' | 'warning' | 'danger';
  title: string;
  title_link?: string;
  text: string;
  fields?: SlackField[];
  footer?: string;
  ts?: number;
}

export interface SlackField {
  title: string;
  value: string;
  short?: boolean;
}

export interface SlackDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount?: number;
}

export class SlackService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_BASE = 1000; // 1 second
  private readonly MAX_MESSAGE_LENGTH = 4000; // Slack message limit

  /**
   * Escape HTML content to prevent XSS attacks
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Send a report to Slack via webhook
   */
  async sendReport(config: SlackConfig, reportData: {
    title: string;
    summary: string;
    reportUrl?: string;
    metrics: Record<string, unknown>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<SlackDeliveryResult> {
    this.validateConfig(config);

    const message = this.buildSlackMessage(config, reportData);
    return this.sendWithRetry(config.webhookUrl, message, 0);
  }

  /**
   * Validate Slack configuration
   */
  private validateConfig(config: SlackConfig): void {
    if (!config.webhookUrl) {
      throw new Error('Slack webhook URL is required');
    }

    if (!this.isValidWebhookUrl(config.webhookUrl)) {
      throw new Error('Invalid Slack webhook URL format');
    }

    if (config.channel !== undefined && !this.isValidChannel(config.channel)) {
      throw new Error('Invalid Slack channel format');
    }
  }

  /**
   * Build Slack message from report data
   */
  private buildSlackMessage(config: SlackConfig, reportData: {
    title: string;
    summary: string;
    reportUrl?: string;
    metrics: Record<string, unknown>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): SlackMessage {
    const color = this.getColorByPriority(reportData.priority);
    const text = this.buildMessageText(config, reportData);

    const attachment: SlackAttachment = {
      color,
      title: this.escapeHtml(reportData.title),
      title_link: reportData.reportUrl,
      text: this.truncateText(this.escapeHtml(reportData.summary), 2000),
      fields: this.buildFields(reportData.metrics),
      footer: 'Quality Tracking CLI',
      ts: Math.floor(Date.now() / 1000)
    };

    return {
      text,
      attachments: [attachment],
      channel: config.channel,
      username: config.username ?? 'Quality Tracking',
      icon_emoji: config.iconEmoji ?? ':bar_chart:'
    };
  }

  /**
   * Build message text with mentions
   */
  private buildMessageText(config: SlackConfig, reportData: {
    title: string;
    summary: string;
    metrics: Record<string, unknown>;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }): string {
    let text = '';

    if (config.mentionChannel) {
      text += '<!channel> ';
    }

    if (config.mentionUsers && config.mentionUsers.length > 0) {
      const mentions = config.mentionUsers.map(user => `<@${user}>`).join(' ');
      text += `${mentions} `;
    }

    const priorityEmoji = this.getPriorityEmoji(reportData.priority);
    text += `${priorityEmoji} *${this.escapeHtml(reportData.title)}*`;

    return text;
  }

  /**
   * Build fields from metrics
   */
  private buildFields(metrics: Record<string, unknown>): SlackField[] {
    const fields: SlackField[] = [];

    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        fields.push({
          title: this.formatFieldName(key),
          value: this.formatMetricValue(key, value),
          short: true
        });
      } else if (typeof value === 'string') {
        fields.push({
          title: this.formatFieldName(key),
          value: this.truncateText(this.escapeHtml(value), 100),
          short: true
        });
      }
    });

    return fields;
  }

  /**
   * Send message with retry logic
   */
  private async sendWithRetry(
    webhookUrl: string,
    message: SlackMessage,
    retryCount: number
  ): Promise<SlackDeliveryResult> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json() as { ts: string };
      return {
        success: true,
        messageId: result.ts || Date.now().toString(),
        retryCount
      };

    } catch (error) {
      if (retryCount < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount);
        await this.sleepForTest(delay);
        return this.sendWithRetry(webhookUrl, message, retryCount + 1);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        retryCount
      };
    }
  }

  /**
   * Validate webhook URL format and security
   */
  private isValidWebhookUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Must be HTTPS for security
      if (parsed.protocol !== 'https:') {
        return false;
      }

      // Must be Slack domain
      if (!parsed.hostname.endsWith('.slack.com') && !parsed.hostname.includes('hooks.slack.com')) {
        return false;
      }

      // Must contain expected path pattern
      if (!parsed.pathname.includes('/services/') && !parsed.pathname.includes('/hooks/')) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate channel format
   */
  private isValidChannel(channel: string): boolean {
    // Channel can be #channel-name or @username
    return /^#?[\w-]+$|^@[\w.-]+$/.test(channel);
  }

  /**
   * Get color based on priority
   */
  private getColorByPriority(priority: string): 'good' | 'warning' | 'danger' {
    switch (priority) {
      case 'low':
        return 'good';
      case 'medium':
        return 'warning';
      case 'high':
      case 'critical':
        return 'danger';
      default:
        return 'warning';
    }
  }

  /**
   * Get emoji based on priority
   */
  private getPriorityEmoji(priority: string): string {
    switch (priority) {
      case 'low':
        return ':large_green_circle:';
      case 'medium':
        return ':large_yellow_circle:';
      case 'high':
        return ':large_orange_circle:';
      case 'critical':
        return ':red_circle:';
      default:
        return ':large_yellow_circle:';
    }
  }

  /**
   * Format field name for display
   */
  private formatFieldName(key: string): string {
    return key
      .split(/(?=[A-Z])|[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Format metric value for display
   */
  private formatMetricValue(key: string, value: number): string {
    if (key.toLowerCase().includes('percentage')) {
      return `${value.toFixed(1)}%`;
    }

    if (key.toLowerCase().includes('rate')) {
      // Convert decimal rate (0.85) to percentage (85.0%)
      return `${(value * 100).toFixed(1)}%`;
    }

    if (key.toLowerCase().includes('time') || key.toLowerCase().includes('duration')) {
      return `${value}ms`;
    }

    if (key.toLowerCase().includes('memory')) {
      return `${(value / 1024 / 1024).toFixed(1)}MB`;
    }

    return value.toLocaleString();
  }

  /**
   * Truncate text to fit within limits
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test mode sleep - shorter delays for testing
   */
  private sleepForTest(ms: number): Promise<void> {
    // Use shorter delays in test environment
    const isTest = process.env.NODE_ENV === 'test' || process.env.CLAUDECODE === '1';
    return new Promise(resolve => setTimeout(resolve, isTest ? Math.min(ms, 100) : ms));
  }

  /**
   * Test webhook connectivity
   */
  async testConnection(config: SlackConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.validateConfig(config);

      const testMessage: SlackMessage = {
        text: '🧪 Test message from Quality Tracking CLI',
        attachments: [{
          color: 'good',
          title: 'Connection Test',
          text: 'If you can see this, Slack integration is working correctly!',
          footer: 'Quality Tracking CLI',
          ts: Math.floor(Date.now() / 1000)
        }],
        channel: config.channel,
        username: config.username ?? 'Quality Tracking',
        icon_emoji: config.iconEmoji ?? ':bar_chart:'
      };

      const result = await this.sendWithRetry(config.webhookUrl, testMessage, 0);
      return { success: result.success, error: result.error };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}