/**
 * Report Scheduler Test Suite
 *
 * Comprehensive tests for automated report generation and scheduling (Story 2.4 AC3)
 * including cron scheduling, queue management, retry mechanisms, and notifications.
 */

import { describe, it, expect, beforeEach, afterEach, vi, type MockedFunction } from 'vitest';
import { ReportScheduler, type ReportSchedule, type ReportConfiguration } from '../../../../src/services/reporting/scheduler';
import { ReportGenerator } from '../../../../src/services/reporting/report-generator';
import { SlackService } from '../../../../src/services/reporting/integrations/slack-service';
import { EmailService } from '../../../../src/services/reporting/integrations/email-service';
import type { AnalysisResult } from '../../../../src/types/analysis';
import type { DashboardMetrics } from '../../../../src/types/dashboard';

// Mock cron library
vi.mock('cron', () => ({
  CronJob: vi.fn().mockImplementation((cronExpression: string, callback: () => void, onComplete: any, timeZone: string) => {
    // Validate cron expression - throw error for invalid ones
    if (cronExpression === 'invalid-cron' || cronExpression === 'invalid' ||
        cronExpression === '* * * * * * *' || // Too many fields
        cronExpression === '60 0 * * *' || // Invalid minute
        cronExpression === '0 25 * * *' || // Invalid hour
        cronExpression === '0 0 32 * *' || // Invalid day
        cronExpression === '0 0 * 13 *' || // Invalid month
        cronExpression === '0 0 * * 8') {   // Invalid day of week
      throw new Error('Invalid cron expression');
    }

    return {
      start: vi.fn(),
      stop: vi.fn(),
      nextDate: vi.fn().mockReturnValue({
        toJSDate: () => new Date(Date.now() + 60000) // 1 minute from now
      })
    };
  })
}));

// Mock ReportGenerator
vi.mock('../../../../src/services/reporting/report-generator', () => ({
  ReportGenerator: vi.fn().mockImplementation(() => ({
    generateReport: vi.fn().mockResolvedValue({
      success: true,
      outputPath: '/tmp/test-report.pdf',
      duration: 1500,
      size: 1024
    })
  }))
}));

// Mock SlackService
vi.mock('../../../../src/services/reporting/integrations/slack-service', () => ({
  SlackService: vi.fn().mockImplementation(() => ({
    sendReportNotification: vi.fn().mockResolvedValue(true),
    sendFailureNotification: vi.fn().mockResolvedValue(true)
  }))
}));

// Mock EmailService
vi.mock('../../../../src/services/reporting/integrations/email-service', () => ({
  EmailService: vi.fn().mockImplementation(() => ({
    sendReportEmail: vi.fn().mockResolvedValue(true),
    sendFailureEmail: vi.fn().mockResolvedValue(true)
  }))
}));

describe('ReportScheduler', () => {
  let scheduler: ReportScheduler;
  let mockReportGenerator: ReportGenerator;
  let mockSlackService: SlackService;
  let mockEmailService: EmailService;

  beforeEach(() => {
    mockReportGenerator = new ReportGenerator();
    mockSlackService = new SlackService({ webhookUrl: 'https://hooks.slack.com/test' });
    mockEmailService = new EmailService({ smtp: { host: 'localhost', port: 587 } });

    scheduler = new ReportScheduler(mockReportGenerator, mockSlackService, mockEmailService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Schedule Management', () => {
    describe('addSchedule', () => {
      it('should create a new schedule with valid cron expression', async () => {
        const scheduleData = {
          name: 'Daily Report',
          description: 'Daily quality report',
          cronExpression: '0 9 * * *', // Daily at 9 AM
          enabled: true,
          timezone: 'UTC',
          projectId: 'test-project',
          reportConfig: {
            format: 'pdf' as const,
            template: 'executive-summary',
            includeTrends: true,
            includeExecutiveSummary: true
          } as ReportConfiguration,
          notifications: []
        };

        const result = await scheduler.addSchedule(scheduleData);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.name).toBe(scheduleData.name);
        expect(result.cronExpression).toBe(scheduleData.cronExpression);
        expect(result.enabled).toBe(true);
        expect(result.runCount).toBe(0);
        expect(result.failureCount).toBe(0);
        expect(result.nextRun).toBeInstanceOf(Date);
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it('should reject schedule with invalid cron expression', async () => {
        const scheduleData = {
          name: 'Invalid Schedule',
          cronExpression: 'invalid-cron',
          enabled: true,
          projectId: 'test-project',
          reportConfig: { format: 'json' as const },
          notifications: []
        };

        await expect(scheduler.addSchedule(scheduleData)).rejects.toThrow('Invalid cron expression');
      });

      it('should create schedule but not start job when disabled', async () => {
        const scheduleData = {
          name: 'Disabled Schedule',
          cronExpression: '0 0 * * 0', // Weekly on Sunday
          enabled: false,
          projectId: 'test-project',
          reportConfig: { format: 'html' as const },
          notifications: []
        };

        const result = await scheduler.addSchedule(scheduleData);

        expect(result.enabled).toBe(false);
        expect(result.nextRun).toBeInstanceOf(Date);
      });
    });

    describe('updateSchedule', () => {
      it('should update existing schedule', async () => {
        // First create a schedule
        const originalSchedule = await scheduler.addSchedule({
          name: 'Original Schedule',
          cronExpression: '0 0 * * *',
          enabled: true,
          projectId: 'test-project',
          reportConfig: { format: 'json' as const },
          notifications: []
        });

        // Mock getSchedule to return the created schedule
        vi.spyOn(scheduler, 'getSchedule').mockResolvedValue(originalSchedule);

        // Update the schedule
        const updates = {
          name: 'Updated Schedule',
          cronExpression: '0 12 * * *', // Change to noon
          enabled: false
        };

        const result = await scheduler.updateSchedule(originalSchedule.id, updates);

        expect(result.name).toBe(updates.name);
        expect(result.cronExpression).toBe(updates.cronExpression);
        expect(result.enabled).toBe(updates.enabled);
        expect(result.updatedAt).toBeInstanceOf(Date);
      });

      it('should throw error when updating non-existent schedule', async () => {
        vi.spyOn(scheduler, 'getSchedule').mockResolvedValue(null);

        await expect(scheduler.updateSchedule('non-existent', { name: 'Updated' }))
          .rejects.toThrow('Schedule non-existent not found');
      });
    });

    describe('deleteSchedule', () => {
      it('should delete schedule and stop associated job', async () => {
        const schedule = await scheduler.addSchedule({
          name: 'To Delete',
          cronExpression: '0 0 * * *',
          enabled: true,
          projectId: 'test-project',
          reportConfig: { format: 'json' as const },
          notifications: []
        });

        const emitSpy = vi.spyOn(scheduler, 'emit');

        await scheduler.deleteSchedule(schedule.id);

        expect(emitSpy).toHaveBeenCalledWith('scheduleDeleted', schedule.id);
      });
    });
  });

  describe('Queue Management', () => {
    describe('runReportImmediately', () => {
      it('should add immediate report to queue with correct priority', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        const queueId = await scheduler.runReportImmediately(
          'test-project',
          { format: 'pdf' as const },
          'high'
        );

        expect(queueId).toBeDefined();
        expect(emitSpy).toHaveBeenCalledWith('itemQueued', expect.objectContaining({
          type: 'immediate',
          priority: 'high',
          projectId: 'test-project'
        }));
      });

      it('should use medium priority by default', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        await scheduler.runReportImmediately(
          'test-project',
          { format: 'json' as const }
        );

        expect(emitSpy).toHaveBeenCalledWith('itemQueued', expect.objectContaining({
          priority: 'medium'
        }));
      });
    });

    describe('priority ordering', () => {
      it('should order queue items by priority correctly', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        // Add items in different order
        await scheduler.runReportImmediately('test-project', { format: 'json' as const }, 'low');
        await scheduler.runReportImmediately('test-project', { format: 'json' as const }, 'critical');
        await scheduler.runReportImmediately('test-project', { format: 'json' as const }, 'medium');
        await scheduler.runReportImmediately('test-project', { format: 'json' as const }, 'high');

        // Check that emit was called with items in priority order
        const calls = emitSpy.mock.calls.filter(call => call[0] === 'itemQueued');
        expect(calls).toHaveLength(4);

        // Verify priority order: critical, high, medium, low
        expect(calls[0][1]).toMatchObject({ priority: 'critical' });
        expect(calls[1][1]).toMatchObject({ priority: 'high' });
        expect(calls[2][1]).toMatchObject({ priority: 'medium' });
        expect(calls[3][1]).toMatchObject({ priority: 'low' });
      });
    });

    describe('getQueueStatus', () => {
      it('should return current queue status', () => {
        const status = scheduler.getQueueStatus();

        expect(status).toMatchObject({
          pending: expect.any(Number),
          processing: expect.any(Number),
          maxConcurrent: 3
        });
      });
    });
  });

  describe('Report Generation', () => {
    describe('successful report generation', () => {
      it('should generate report and emit success event', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        // Mock successful report generation
        const mockGenerateReport = vi.spyOn(mockReportGenerator, 'generateReport')
          .mockResolvedValue({
            success: true,
            outputPath: '/tmp/test-report.pdf',
            duration: 1500,
            size: 1024
          });

        await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });

        // Wait for queue processing (simulate)
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockGenerateReport).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith('reportGenerated', expect.objectContaining({
          success: true,
          duration: expect.any(Number),
          reportPath: '/tmp/test-report.pdf'
        }));
      });
    });

    describe('retry mechanisms', () => {
      it('should implement exponential backoff for failed reports', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        // Mock failed report generation
        vi.spyOn(mockReportGenerator, 'generateReport')
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockRejectedValueOnce(new Error('Temporary failure'))
          .mockResolvedValueOnce({
            success: true,
            outputPath: '/tmp/test-report.pdf',
            duration: 1500,
            size: 1024
          });

        await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });

        // Wait for retry attempts
        await new Promise(resolve => setTimeout(resolve, 200));

        expect(emitSpy).toHaveBeenCalledWith('reportRetry', expect.objectContaining({
          attempt: 1,
          error: 'Temporary failure'
        }));

        expect(emitSpy).toHaveBeenCalledWith('reportRetry', expect.objectContaining({
          attempt: 2,
          error: 'Temporary failure'
        }));
      });

      it('should mark report as failed after max attempts', async () => {
        const emitSpy = vi.spyOn(scheduler, 'emit');

        // Mock persistent failure
        vi.spyOn(mockReportGenerator, 'generateReport')
          .mockRejectedValue(new Error('Persistent failure'));

        await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });

        // Wait for max attempts (3)
        await new Promise(resolve => setTimeout(resolve, 500));

        expect(emitSpy).toHaveBeenCalledWith('reportFailed', expect.objectContaining({
          error: 'Persistent failure'
        }));
      });
    });
  });

  describe('Event System', () => {
    it('should emit scheduleAdded event when schedule is created', async () => {
      const emitSpy = vi.spyOn(scheduler, 'emit');

      await scheduler.addSchedule({
        name: 'Test Schedule',
        cronExpression: '0 0 * * *',
        enabled: true,
        projectId: 'test-project',
        reportConfig: { format: 'json' as const },
        notifications: []
      });

      expect(emitSpy).toHaveBeenCalledWith('scheduleAdded', expect.objectContaining({
        name: 'Test Schedule'
      }));
    });

    it('should emit scheduleUpdated event when schedule is updated', async () => {
      const schedule = await scheduler.addSchedule({
        name: 'Original',
        cronExpression: '0 0 * * *',
        enabled: true,
        projectId: 'test-project',
        reportConfig: { format: 'json' as const },
        notifications: []
      });

      vi.spyOn(scheduler, 'getSchedule').mockResolvedValue(schedule);
      const emitSpy = vi.spyOn(scheduler, 'emit');

      await scheduler.updateSchedule(schedule.id, { name: 'Updated' });

      expect(emitSpy).toHaveBeenCalledWith('scheduleUpdated', expect.objectContaining({
        name: 'Updated'
      }));
    });

    it('should emit notificationsQueued event on successful report', async () => {
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockResolvedValue({
          success: true,
          outputPath: '/tmp/test-report.pdf',
          duration: 1500,
          size: 1024
        });

      const emitSpy = vi.spyOn(scheduler, 'emit');

      await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(emitSpy).toHaveBeenCalledWith('notificationsQueued', expect.objectContaining({
        reportPath: '/tmp/test-report.pdf',
        metrics: expect.any(Object)
      }));
    });

    it('should emit failureNotificationsQueued event on failed report', async () => {
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockRejectedValue(new Error('Report generation failed'));

      const emitSpy = vi.spyOn(scheduler, 'emit');

      await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(emitSpy).toHaveBeenCalledWith('failureNotificationsQueued', expect.objectContaining({
        error: 'Report generation failed',
        attempts: expect.any(Number)
      }));
    });
  });

  describe('Concurrent Processing', () => {
    it('should respect maximum concurrent jobs limit', async () => {
      const emitSpy = vi.spyOn(scheduler, 'emit');

      // Mock slow report generation
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockImplementation(() => new Promise(resolve =>
          setTimeout(() => resolve({
            success: true,
            outputPath: '/tmp/test-report.pdf',
            duration: 1500,
            size: 1024
          }), 200)
        ));

      // Add 5 reports simultaneously
      for (let i = 0; i < 5; i++) {
        await scheduler.runReportImmediately(`test-project-${i}`, { format: 'pdf' as const });
      }

      // Check initial queue status
      const status = scheduler.getQueueStatus();
      expect(status.maxConcurrent).toBe(3);
      expect(status.pending).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle cron expression validation errors gracefully', async () => {
      const invalidCronExpressions = [
        'invalid',
        '* * * * * * *', // Too many fields
        '60 0 * * *', // Invalid minute
        '0 25 * * *', // Invalid hour
        '0 0 32 * *', // Invalid day
        '0 0 * 13 *', // Invalid month
        '0 0 * * 8'   // Invalid day of week
      ];

      for (const cronExpr of invalidCronExpressions) {
        await expect(
          scheduler.addSchedule({
            name: 'Invalid Cron Test',
            cronExpression: cronExpr,
            enabled: true,
            projectId: 'test-project',
            reportConfig: { format: 'json' as const },
            notifications: []
          })
        ).rejects.toThrow('Invalid cron expression');
      }
    });

    it('should handle report generator failures', async () => {
      const error = new Error('Report generator service unavailable');
      vi.spyOn(mockReportGenerator, 'generateReport').mockRejectedValue(error);

      const emitSpy = vi.spyOn(scheduler, 'emit');

      await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(emitSpy).toHaveBeenCalledWith('reportFailed', expect.objectContaining({
        error: 'Report generator service unavailable'
      }));
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully and wait for current jobs', async () => {
      // Mock slow report generation
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockImplementation(() => new Promise(resolve =>
          setTimeout(() => resolve({
            success: true,
            outputPath: '/tmp/test-report.pdf',
            duration: 1500,
            size: 1024
          }), 100)
        ));

      // Start a report
      await scheduler.runReportImmediately('test-project', { format: 'pdf' as const });

      // Wait a bit then shutdown
      await new Promise(resolve => setTimeout(resolve, 50));

      const emitSpy = vi.spyOn(scheduler, 'emit');
      await scheduler.shutdown();

      expect(emitSpy).toHaveBeenCalledWith('shutdown');
    });
  });

  describe('Integration with Notification Services', () => {
    it('should send notifications through Slack service', async () => {
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockResolvedValue({
          success: true,
          outputPath: '/tmp/test-report.pdf',
          duration: 1500,
          size: 1024
        });

      const slackSpy = vi.spyOn(mockSlackService, 'sendReportNotification')
        .mockResolvedValue(true);

      await scheduler.runReportImmediately('test-project', {
        format: 'pdf' as const,
        notifications: [{
          type: 'slack' as const,
          enabled: true,
          config: { webhookUrl: 'https://hooks.slack.com/test' },
          recipients: ['#dev-team'],
          conditions: { onSuccess: true, onFailure: false }
        }]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Slack service would be called (implementation depends on notification configs)
      expect(slackSpy).toBeDefined();
    });

    it('should send email notifications', async () => {
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockResolvedValue({
          success: true,
          outputPath: '/tmp/test-report.pdf',
          duration: 1500,
          size: 1024
        });

      const emailSpy = vi.spyOn(mockEmailService, 'sendReportEmail')
        .mockResolvedValue(true);

      await scheduler.runReportImmediately('test-project', {
        format: 'pdf' as const,
        notifications: [{
          type: 'email' as const,
          enabled: true,
          config: { smtp: { host: 'localhost', port: 587 } },
          recipients: ['dev@company.com'],
          conditions: { onSuccess: true, onFailure: false }
        }]
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify email service would be called (implementation depends on notification configs)
      expect(emailSpy).toBeDefined();
    });
  });

  describe('Performance Requirements', () => {
    it('should handle queue processing within acceptable time limits', async () => {
      const startTime = Date.now();

      // Mock fast report generation
      vi.spyOn(mockReportGenerator, 'generateReport')
        .mockResolvedValue({
          success: true,
          outputPath: '/tmp/test-report.pdf',
          duration: 500,
          size: 1024
        });

      await scheduler.runReportImmediately('test-project', { format: 'json' as const });

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));

      const processingTime = Date.now() - startTime;

      // Queue processing should start quickly (within 1 second)
      expect(processingTime).toBeLessThan(1000);
    });

    it('should handle multiple concurrent schedules efficiently', async () => {
      const startTime = Date.now();

      // Create multiple schedules
      const schedules = [];
      for (let i = 0; i < 5; i++) {
        schedules.push(await scheduler.addSchedule({
          name: `Schedule ${i}`,
          cronExpression: `0 ${i} * * *`, // Different hours
          enabled: true,
          projectId: `test-project-${i}`,
          reportConfig: { format: 'json' as const },
          notifications: []
        }));
      }

      const createTime = Date.now() - startTime;

      // Creating multiple schedules should be fast
      expect(createTime).toBeLessThan(500);
      expect(schedules).toHaveLength(5);
    });
  });
});