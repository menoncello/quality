import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { RollbackService } from '../../../src/services/wizard/rollback';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createTestDir, cleanupTestDir } from '../../test-utils';

describe('RollbackService', () => {
  let testDir: string;
  let rollbackService: RollbackService;

  beforeEach(() => {
    testDir = createTestDir('rollback-test');
    rollbackService = new RollbackService(testDir);
  });

  afterEach(() => {
    cleanupTestDir(testDir);
  });

  it('should create backup of existing files', async () => {
    const testFile = join(testDir, 'test.txt');
    writeFileSync(testFile, 'original content');

    const metadata = await rollbackService.createBackup(['test.txt'], 'step1');

    expect(metadata.files).toHaveLength(1);
    expect(metadata.files[0].path).toContain('test.txt');
    expect(metadata.files[0].originalContent).toBe('original content');
    expect(metadata.files[0].existed).toBe(true);
  });

  it('should backup non-existent files', async () => {
    const metadata = await rollbackService.createBackup(['nonexistent.txt'], 'step1');

    expect(metadata.files).toHaveLength(1);
    expect(metadata.files[0].existed).toBe(false);
    expect(metadata.files[0].originalContent).toBe('');
  });

  it('should restore original content', async () => {
    const testFile = join(testDir, 'test.txt');
    writeFileSync(testFile, 'original content');

    await rollbackService.createBackup(['test.txt'], 'step1');

    // Modify file
    writeFileSync(testFile, 'modified content');

    // Rollback
    const result = await rollbackService.rollback();

    expect(result.success).toBe(true);
    expect(result.restoredFiles).toHaveLength(1);

    const restoredContent = readFileSync(testFile, 'utf-8');
    expect(restoredContent).toBe('original content');
  });

  it('should delete files that did not exist before', async () => {
    await rollbackService.createBackup(['newfile.txt'], 'step1');

    // Create file
    const testFile = join(testDir, 'newfile.txt');
    writeFileSync(testFile, 'new content');

    // Rollback
    const result = await rollbackService.rollback();

    expect(result.success).toBe(true);
    expect(existsSync(testFile)).toBe(false);
  });

  it('should handle multiple files atomically', async () => {
    const file1 = join(testDir, 'file1.txt');
    const file2 = join(testDir, 'file2.txt');

    writeFileSync(file1, 'content1');
    writeFileSync(file2, 'content2');

    await rollbackService.createBackup(['file1.txt', 'file2.txt'], 'step1');

    writeFileSync(file1, 'modified1');
    writeFileSync(file2, 'modified2');

    const result = await rollbackService.rollback();

    expect(result.success).toBe(true);
    expect(result.restoredFiles).toHaveLength(2);

    expect(readFileSync(file1, 'utf-8')).toBe('content1');
    expect(readFileSync(file2, 'utf-8')).toBe('content2');
  });

  it('should save and load metadata', async () => {
    const testFile = join(testDir, 'test.txt');
    writeFileSync(testFile, 'original');

    await rollbackService.createBackup(['test.txt'], 'step1');

    const metadata = rollbackService.getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata?.wizardStep).toBe('step1');

    // Create new service instance
    const newService = new RollbackService(testDir);
    const hasBackup = newService.hasBackup();
    expect(hasBackup).toBe(true);
  });

  it('should check if backup exists', () => {
    const hasBackup = rollbackService.hasBackup();
    expect(hasBackup).toBe(false);
  });

  it('should cleanup backup after successful completion', async () => {
    const testFile = join(testDir, 'test.txt');
    writeFileSync(testFile, 'original');

    await rollbackService.createBackup(['test.txt'], 'step1');

    const backupDir = join(testDir, '.devquality-backup');
    expect(existsSync(backupDir)).toBe(true);

    await rollbackService.cleanupBackup();

    const metadataPath = join(backupDir, 'metadata.json');
    expect(existsSync(metadataPath)).toBe(false);
  });

  it('should handle rollback without backup gracefully', async () => {
    const result = await rollbackService.rollback();

    expect(result.success).toBe(false);
    expect(result.errors).toContain('No backup metadata found');
  });

  it('should store timestamp in backup metadata', async () => {
    const before = new Date();
    const metadata = await rollbackService.createBackup(['test.txt'], 'step1');
    const after = new Date();

    expect(metadata.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(metadata.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
