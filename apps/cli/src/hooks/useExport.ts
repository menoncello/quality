/**
 * Export functionality hook
 */

import { useState, useCallback } from 'react';
import { useDashboardStore } from './useDashboardStore';
import { ExportService } from '../services/export/export-service';
import {
  getFormatById,
  getOptionsForFormat,
  validateExportOptions,
} from '../services/export/report-formats';
import type { ExportRequest, ExportResult, ExportProgress, ExportOptions } from '../types/export';

export function useExport() {
  const { currentResult, filteredIssues } = useDashboardStore();
  const [isExporting, setIsExporting] = useState(false);
  const exportService = new ExportService();
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [lastExportResult, setLastExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportResults = useCallback(
    async (formatId: string, options: Partial<ExportOptions> = {}): Promise<ExportResult> => {
      if (!currentResult) {
        const error = 'No analysis results available for export';
        setExportError(error);
        const fallbackFormat = exportService.getSupportedFormats()[0];
        if (!fallbackFormat) {
          throw new Error('No export formats available');
        }
        return {
          success: false,
          outputPath: '',
          size: 0,
          format: getFormatById(formatId) ?? fallbackFormat,
          timestamp: new Date(),
          error,
        };
      }

      setIsExporting(true);
      setExportError(null);
      setExportProgress(null);

      try {
        const format = getFormatById(formatId);
        if (!format) {
          throw new Error(`Unknown export format: ${formatId}`);
        }

        // Get default options for format and merge with user options
        const defaultOptions = getOptionsForFormat(formatId);
        const exportOptions = { ...defaultOptions, ...options };

        // Validate options
        const validation = validateExportOptions(formatId, exportOptions);
        if (!validation.valid) {
          throw new Error(`Invalid export options: ${validation.errors.join(', ')}`);
        }

        // Calculate metrics for export
        const metrics = {
          totalIssues: filteredIssues.length,
          errorCount: filteredIssues.filter(issue => issue.type === 'error').length,
          warningCount: filteredIssues.filter(issue => issue.type === 'warning').length,
          infoCount: filteredIssues.filter(issue => issue.type === 'info').length,
          fixableCount: filteredIssues.filter(issue => issue.fixable).length,
          overallScore: currentResult.overallScore,
          coverage: currentResult.toolResults.find(result => result.coverage)?.coverage ?? null,
          toolsAnalyzed: currentResult.toolResults.length,
          duration: currentResult.duration,
        };

        const exportRequest: ExportRequest = {
          format,
          data: {
            analysisResult: currentResult,
            filteredIssues,
            metrics,
          },
          options: exportOptions,
        };

        const result = await exportService.exportResults(
          exportRequest,
          (progress: ExportProgress) => {
            setExportProgress(progress);
          }
        );

        setLastExportResult(result);
        if (!result.success) {
          setExportError(result.error ?? 'Export failed');
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setExportError(errorMessage);

        const fallbackFormat = exportService.getSupportedFormats()[0];
        if (!fallbackFormat) {
          throw new Error('No export formats available');
        }

        const result: ExportResult = {
          success: false,
          outputPath: '',
          size: 0,
          format: getFormatById(formatId) ?? fallbackFormat,
          timestamp: new Date(),
          error: errorMessage,
        };

        setLastExportResult(result);
        return result;
      } finally {
        setIsExporting(false);
        setExportProgress(null);
      }
    },
    [currentResult, filteredIssues, exportService]
  );

  const exportToJSON = useCallback(
    (outputPath?: string) => {
      return exportResults('json', { outputPath });
    },
    [exportResults]
  );

  const exportToText = useCallback(
    (outputPath?: string) => {
      return exportResults('txt', { outputPath });
    },
    [exportResults]
  );

  const exportToCSV = useCallback(
    (outputPath?: string) => {
      return exportResults('csv', { outputPath });
    },
    [exportResults]
  );

  const exportToMarkdown = useCallback(
    (outputPath?: string) => {
      return exportResults('md', { outputPath });
    },
    [exportResults]
  );

  const exportToJUnit = useCallback(
    (outputPath?: string) => {
      return exportResults('junit', { outputPath });
    },
    [exportResults]
  );

  const resetExportState = useCallback(() => {
    setIsExporting(false);
    setExportProgress(null);
    setLastExportResult(null);
    setExportError(null);
  }, []);

  return {
    // State
    isExporting,
    exportProgress,
    lastExportResult,
    exportError,

    // Actions
    exportResults,
    exportToJSON,
    exportToText,
    exportToCSV,
    exportToMarkdown,
    exportToJUnit,
    resetExportState,

    // Helpers
    supportedFormats: exportService.getSupportedFormats(),
    canExport: !!currentResult,
  };
}
