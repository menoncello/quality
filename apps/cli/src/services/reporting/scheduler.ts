/**
 * Report Generation Scheduler
 *
 * Provides automated report generation and scheduling as required by Story 2.4 AC3.
 * Includes cron scheduling, queue management, retry mechanisms, and notifications.
 */

import { CronJob } from 'cron';
import { EventEmitter } from 'events';
import { ReportGenerator, type ReportRequest } from './report-generator';
import { SlackService, SlackConfig } from './integrations/slack-service';
import { EmailService, EmailConfig } from './integrations/email-service';
import type { AnalysisResult as CoreAnalysisResult } from '@dev-quality/core';
import type { AnalysisResult, Issue } from '../../types/analysis';
import type { DashboardMetrics } from '../../types/dashboard';

export interface ReportSchedule {
  id: string;
  name: string;
  description?: string;
  cronExpression: string;
  enabled: boolean;
  timezone?: string;
  projectId: string;
  reportConfig: ReportConfiguration;
  notifications: NotificationConfig[];
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  failureCount: number;
}

export interface ReportConfiguration {
  format: 'json' | 'html' | 'markdown' | 'pdf';
  template?: string;
  outputPath?: string;
  filters?: ReportFilters;
  includeTrends?: boolean;
  includeExecutiveSummary?: boolean;
}

export interface ReportFilters {
  severity?: Array<'error' | 'warning' | 'info'>;
  tools?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  minScore?: number;
  maxScore?: number;
}

export interface NotificationConfig {
  type: 'slack' | 'email';
  enabled: boolean;
  config: SlackConfig | EmailConfig;
  recipients: string[];
  conditions: NotificationConditions;
}

export interface NotificationConditions {
  onSuccess: boolean;
  onFailure: boolean;
  onThreshold?: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq';
    value: number;
  };
}

export interface ScheduledReportResult {
  scheduleId: string;
  success: boolean;
  reportPath?: string;
  metrics?: ReportMetrics;
  error?: string;
  duration: number;
  timestamp: Date;
  notificationsSent: number;
}

export interface ReportMetrics {
  totalIssues: number;
  criticalIssues: number;
  overallScore: number;
  duration: number;
  reportSize: number;
}

export interface QueueItem {
  id: string;
  type: 'scheduled' | 'immediate';
  priority: 'low' | 'medium' | 'high' | 'critical';
  scheduleId?: string;
  projectId: string;
  reportConfig: ReportConfiguration;
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
}

export class ReportScheduler extends EventEmitter {
  private jobs: Map<string, CronJob> = new Map();
  private queue: QueueItem[] = [];
  private processing = false;
  private maxConcurrentJobs = 3;
  private currentJobs = 0;

  constructor(
    private reportGenerator: ReportGenerator,
    private slackService?: SlackService,
    private emailService?: EmailService
  ) {
    super();
    this.startQueueProcessor();
  }

  /**
   * Add a new report schedule
   */
  async addSchedule(schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt' | 'runCount' | 'failureCount'>): Promise<ReportSchedule> {
    this.validateCronExpression(schedule.cronExpression);

    const newSchedule: ReportSchedule = {
      ...schedule,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      runCount: 0,
      failureCount: 0,
      nextRun: this.getNextRunTime(schedule.cronExpression)
    };

    if (schedule.enabled) {
      this.scheduleJob(newSchedule);
    }

    this.emit('scheduleAdded', newSchedule);
    return newSchedule;
  }

  /**
   * Update an existing schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    const existingSchedule = await this.getSchedule(scheduleId);
    if (!existingSchedule) {
      throw new Error(`Schedule ${scheduleId} not found`);
    }

    // Stop existing job if it's running
    const existingJob = this.jobs.get(scheduleId);
    if (existingJob) {
      existingJob.stop();
      this.jobs.delete(scheduleId);
    }

    const updatedSchedule: ReportSchedule = {
      ...existingSchedule,
      ...updates,
      updatedAt: new Date(),
      nextRun: updates.cronExpression ? this.getNextRunTime(updates.cronExpression) : existingSchedule.nextRun
    };

    if (updatedSchedule.enabled) {
      this.scheduleJob(updatedSchedule);
    }

    this.emit('scheduleUpdated', updatedSchedule);
    return updatedSchedule;
  }

  /**
   * Delete a schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const jobToDelete = this.jobs.get(scheduleId);
    if (jobToDelete) {
      jobToDelete.stop();
      this.jobs.delete(scheduleId);
    }

    // Remove queued items for this schedule
    this.queue = this.queue.filter(item => item.scheduleId !== scheduleId);

    this.emit('scheduleDeleted', scheduleId);
  }

  /**
   * Get schedule by ID
   */
  async getSchedule(_scheduleId: string): Promise<ReportSchedule | null> {
    // This would typically fetch from database
    // For now, return null as placeholder
    return null;
  }

  /**
   * List all schedules
   */
  async listSchedules(): Promise<ReportSchedule[]> {
    // This would typically fetch from database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Run a report immediately
   */
  async runReportImmediately(
    projectId: string,
    reportConfig: ReportConfiguration,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<string> {
    const queueItem: QueueItem = {
      id: this.generateId(),
      type: 'immediate',
      priority,
      projectId,
      reportConfig,
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    this.addToQueue(queueItem);
    return queueItem.id;
  }

  /**
   * Schedule a cron job
   */
  private scheduleJob(schedule: ReportSchedule): void {
    const job = new CronJob(
      schedule.cronExpression,
      () => this.handleScheduledRun(schedule.id),
      null,
      false,
      schedule.timezone ?? 'UTC'
    );

    this.jobs.set(schedule.id, job);
    job.start();
  }

  /**
   * Handle scheduled report run
   */
  private async handleScheduledRun(_scheduleId: string): Promise<void> {
    const schedule = await this.getSchedule(_scheduleId);
    if (!schedule?.enabled) {
      return;
    }

    const queueItem: QueueItem = {
      id: this.generateId(),
      type: 'scheduled',
      priority: 'medium',
      projectId: schedule.projectId,
      reportConfig: schedule.reportConfig,
      scheduleId: _scheduleId,
      scheduledAt: new Date(),
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date()
    };

    this.addToQueue(queueItem);
  }

  /**
   * Add item to queue with priority ordering
   */
  private addToQueue(item: QueueItem): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      existing => priorityOrder[existing.priority] > priorityOrder[item.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(insertIndex, 0, item);
    }

    this.emit('itemQueued', item);
  }

  /**
   * Start queue processor
   */
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.processing && this.queue.length > 0 && this.currentJobs < this.maxConcurrentJobs) {
        this.processQueue();
      }
    }, 1000); // Check every second
  }

  /**
   * Process queue items
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0 || this.currentJobs >= this.maxConcurrentJobs) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.currentJobs < this.maxConcurrentJobs) {
      const item = this.queue.shift();
    if (!item) return;

    this.currentJobs++;

      // Process item asynchronously
      this.processQueueItem(item).finally(() => {
        this.currentJobs--;
      });
    }

    this.processing = false;
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: QueueItem): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await this.generateReport(item);
      const duration = Date.now() - startTime;

      await this.sendNotifications(item, result);

      this.emit('reportGenerated', {
        scheduleId: item.scheduleId,
        success: true,
        duration,
        reportPath: result.reportPath,
        metrics: result.metrics
      });

      // Update schedule statistics
      if (item.scheduleId) {
        await this.updateScheduleStats(item.scheduleId, true, duration);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Retry logic
      if (item.attempts < item.maxAttempts) {
        item.attempts++;
        item.scheduledAt = new Date(Date.now() + Math.pow(2, item.attempts) * 1000); // Exponential backoff
        this.addToQueue(item);

        this.emit('reportRetry', {
          scheduleId: item.scheduleId,
          attempt: item.attempts,
          error: errorMessage
        });
      } else {
        this.emit('reportFailed', {
          scheduleId: item.scheduleId,
          error: errorMessage,
          duration
        });

        // Update schedule statistics
        if (item.scheduleId) {
          await this.updateScheduleStats(item.scheduleId, false, duration, errorMessage);
        }

        // Send failure notifications
        await this.sendFailureNotifications(item, errorMessage);
      }
    }
  }

  /**
   * Generate report
   */
  private async generateReport(item: QueueItem): Promise<{
    reportPath: string;
    metrics: ReportMetrics;
  }> {
    // Get analysis data (this would typically fetch from database)
    const analysisData = await this.getAnalysisData(item.projectId);

    const _outputPath = item.reportConfig.outputPath ??
      `/tmp/reports/${item.id}.${item.reportConfig.format}`;

    // Create mock issues and metrics for the report request
    const issues: Issue[] = []; // This would typically come from analysisData
    const metrics: DashboardMetrics = {
      totalIssues: analysisData.summary.totalIssues,
      errorCount: analysisData.summary.totalErrors,
      warningCount: analysisData.summary.totalWarnings,
      infoCount: Math.max(0, analysisData.summary.totalIssues - analysisData.summary.totalErrors - analysisData.summary.totalWarnings), // Calculate info count
      fixableCount: analysisData.summary.totalFixable,
      overallScore: analysisData.overallScore,
      coverage: null, // This would be populated from actual analysis data
      toolsAnalyzed: analysisData.summary.toolCount,
      duration: analysisData.summary.executionTime
    };

    // Convert core AnalysisResult to CLI AnalysisResult (timestamp: Date -> string)
    const cliAnalysisResult: AnalysisResult = {
      id: analysisData.id,
      projectId: analysisData.projectId,
      timestamp: analysisData.timestamp.toISOString(),
      duration: analysisData.duration,
      overallScore: analysisData.overallScore,
      toolResults: analysisData.toolResults.map(result => ({
        toolName: result.toolName,
        executionTime: result.executionTime,
        status: result.status,
        issues: result.issues,
        metrics: result.metrics,
        coverage: result.coverage
      })),
      summary: analysisData.summary,
      aiPrompts: analysisData.aiPrompts
    };

    // Create a proper ReportRequest object
    const reportRequest: ReportRequest = {
      configuration: {
        id: item.id,
        name: `Scheduled Report ${item.id}`,
        description: 'Automatically generated scheduled report',
        templateId: item.reportConfig.template ?? 'default',
        format: item.reportConfig.format,
        recipients: [], // This would be populated from schedule configuration
        filters: {
          severity: item.reportConfig.filters?.severity,
          tools: item.reportConfig.filters?.tools,
          scoreRange: item.reportConfig.filters?.minScore || item.reportConfig.filters?.maxScore ? {
            min: item.reportConfig.filters?.minScore ?? 0,
            max: item.reportConfig.filters?.maxScore ?? 100
          } : undefined,
          fixableOnly: false,
          dateRange: item.reportConfig.filters?.dateRange ? {
            start: item.reportConfig.filters.dateRange.from,
            end: item.reportConfig.filters.dateRange.to
          } : undefined
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      },
      analysisResult: cliAnalysisResult,
      issues: issues,
      metrics: metrics
    };

    const result = await this.reportGenerator.generateReport(reportRequest);

    if (!result.success) {
      throw new Error(result.error ?? 'Report generation failed');
    }

    const reportMetrics: ReportMetrics = {
      totalIssues: analysisData.summary.totalIssues,
      criticalIssues: analysisData.summary.totalErrors,
      overallScore: analysisData.overallScore,
      duration: result.duration ?? 0,
      reportSize: result.size ?? 0
    };

    return {
      reportPath: result.outputPath,
      metrics: reportMetrics
    };
  }

  /**
   * Send notifications for successful report
   */
  private async sendNotifications(item: QueueItem, result: {
    reportPath: string;
    metrics: ReportMetrics;
  }): Promise<void> {
    // This would fetch notification configs from database
    // For now, just emit event
    this.emit('notificationsQueued', {
      scheduleId: item.scheduleId,
      reportPath: result.reportPath,
      metrics: result.metrics
    });
  }

  /**
   * Send failure notifications
   */
  private async sendFailureNotifications(item: QueueItem, error: string): Promise<void> {
    this.emit('failureNotificationsQueued', {
      scheduleId: item.scheduleId,
      error,
      attempts: item.attempts
    });
  }

  /**
   * Update schedule statistics
   */
  private async updateScheduleStats(
    scheduleId: string,
    success: boolean,
    duration: number,
    error?: string
  ): Promise<void> {
    // This would typically update database
    this.emit('scheduleStatsUpdated', {
      scheduleId,
      success,
      duration,
      error
    });
  }

  /**
   * Get analysis data for project
   */
  private async getAnalysisData(projectId: string): Promise<CoreAnalysisResult> {
    // This would typically fetch from database
    // For now, return mock data with correct ResultSummary properties
    return {
      id: `analysis-${Date.now()}`,
      projectId,
      timestamp: new Date(),
      duration: 5000,
      overallScore: 85,
      toolResults: [],
      summary: {
        totalIssues: 10,
        totalErrors: 2,
        totalWarnings: 5,
        totalFixable: 7,
        overallScore: 85,
        toolCount: 3,
        executionTime: 5000
      },
      aiPrompts: []
    };
  }

  /**
   * Validate cron expression
   */
  private validateCronExpression(expression: string): void {
    try {
      new CronJob(expression, () => {}, null, false);
    } catch (_error) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }
  }

  /**
   * Get next run time for cron expression
   */
  private getNextRunTime(cronExpression: string): Date {
    try {
      const job = new CronJob(cronExpression, () => {}, null, false);
      return job.nextDate().toJSDate();
    } catch {
      return new Date();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    maxConcurrent: number;
    nextItem?: QueueItem;
  } {
    return {
      pending: this.queue.length,
      processing: this.currentJobs,
      maxConcurrent: this.maxConcurrentJobs,
      nextItem: this.queue[0]
    };
  }

  /**
   * Shutdown scheduler
   */
  async shutdown(): Promise<void> {
    // Stop all cron jobs
    for (const job of this.jobs.values()) {
      job.stop();
    }
    this.jobs.clear();

    // Wait for current jobs to complete
    while (this.currentJobs > 0) {
      await this.sleep(1000);
    }

    this.emit('shutdown');
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}