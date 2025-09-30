import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from 'node:fs';
import * as path from 'node:path';

export interface BackupFile {
  path: string;
  originalContent: string;
  existed: boolean;
}

export interface BackupMetadata {
  timestamp: Date;
  files: BackupFile[];
  wizardStep: string;
}

export interface RollbackResult {
  success: boolean;
  restoredFiles: string[];
  errors: string[];
}

/**
 * Rollback service for wizard configuration changes
 */
export class RollbackService {
  private projectPath: string;
  private backupDir: string;
  private metadata?: BackupMetadata;

  constructor(projectPath: string) {
    this.projectPath = path.resolve(projectPath);
    this.backupDir = path.join(this.projectPath, '.devquality-backup');
  }

  /**
   * Create backup of existing files before modification
   */
  async createBackup(files: string[], wizardStep: string): Promise<BackupMetadata> {
    const backupFiles: BackupFile[] = [];

    // Ensure backup directory exists
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true });
    }

    for (const file of files) {
      const filePath = this.sanitizePath(file);
      const existed = existsSync(filePath);

      let originalContent = '';
      if (existed) {
        try {
          originalContent = readFileSync(filePath, 'utf-8');
        } catch (error) {
          throw new Error(
            `Failed to read file for backup ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      backupFiles.push({
        path: filePath,
        originalContent,
        existed,
      });
    }

    this.metadata = {
      timestamp: new Date(),
      files: backupFiles,
      wizardStep,
    };

    // Save metadata to backup directory
    await this.saveMetadata();

    return this.metadata;
  }

  /**
   * Restore files from backup (atomic operation)
   */
  async rollback(): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: true,
      restoredFiles: [],
      errors: [],
    };

    if (!this.metadata) {
      // Try to load metadata from disk
      await this.loadMetadata();

      if (!this.metadata) {
        result.success = false;
        result.errors.push('No backup metadata found');
        return result;
      }
    }

    // Perform atomic rollback - all or nothing
    const restoreOperations: Array<() => void> = [];

    for (const backupFile of this.metadata.files) {
      try {
        if (backupFile.existed) {
          // Restore original content
          restoreOperations.push(() => {
            writeFileSync(backupFile.path, backupFile.originalContent, 'utf-8');
          });
        } else {
          // Delete file that didn't exist before
          if (existsSync(backupFile.path)) {
            restoreOperations.push(() => {
              unlinkSync(backupFile.path);
            });
          }
        }
      } catch (error) {
        result.success = false;
        result.errors.push(
          `Failed to prepare restore for ${backupFile.path}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    // Execute all restore operations if no errors
    if (result.success) {
      try {
        for (const operation of restoreOperations) {
          operation();
        }

        result.restoredFiles = this.metadata.files.map(f => f.path);
      } catch (error) {
        result.success = false;
        result.errors.push(
          `Rollback execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    return result;
  }

  /**
   * Clean up backup files after successful wizard completion
   */
  async cleanupBackup(): Promise<void> {
    if (existsSync(this.backupDir)) {
      try {
        // Remove metadata file
        const metadataPath = path.join(this.backupDir, 'metadata.json');
        if (existsSync(metadataPath)) {
          unlinkSync(metadataPath);
        }

        // Note: We keep the backup directory for debugging
        // User can manually delete it if needed
      } catch {
        // Non-critical error, silently ignore
      }
    }
  }

  /**
   * Get current backup metadata
   */
  getMetadata(): BackupMetadata | undefined {
    return this.metadata;
  }

  /**
   * Check if backup exists
   */
  hasBackup(): boolean {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    return existsSync(metadataPath);
  }

  private async saveMetadata(): Promise<void> {
    if (!this.metadata) {
      return;
    }

    const metadataPath = path.join(this.backupDir, 'metadata.json');

    try {
      const content = JSON.stringify(this.metadata, null, 2);
      writeFileSync(metadataPath, content, 'utf-8');
    } catch (error) {
      throw new Error(
        `Failed to save backup metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async loadMetadata(): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'metadata.json');

    if (!existsSync(metadataPath)) {
      return;
    }

    try {
      const content = readFileSync(metadataPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Convert timestamp string back to Date
      this.metadata = {
        ...parsed,
        timestamp: new Date(parsed.timestamp),
      };
    } catch (error) {
      throw new Error(
        `Failed to load backup metadata: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private sanitizePath(filePath: string): string {
    const resolved = path.resolve(this.projectPath, filePath);

    // Prevent path traversal attacks
    if (!resolved.startsWith(this.projectPath)) {
      throw new Error(`Invalid path: ${filePath} is outside project directory`);
    }

    return resolved;
  }
}
