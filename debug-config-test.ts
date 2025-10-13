import { BunTestConfigGenerator } from './apps/cli/src/services/wizard/config-generator';
import { createTestDir, cleanupTestDir } from './apps/cli/tests/test-utils';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

async function debugConfigGeneration() {
  let testDir: string;

  try {
    // Create test directory
    testDir = createTestDir('debug-config-test');
    console.log('Test directory created:', testDir);

    // Create a minimal package.json
    writeFileSync(
      join(testDir, 'package.json'),
      JSON.stringify({
        name: 'debug-test-project',
        version: '1.0.0',
      })
    );

    // Create mock detection result
    const mockDetectionResult = {
      project: {
        name: 'debug-test-project',
        version: '1.0.0',
        type: 'typescript',
        frameworks: [],
        hasTypeScript: true,
        description: 'Debug test project',
      },
      tools: [],
      configs: [],
      dependencies: [],
      structure: {
        sourceDirectories: ['./src'],
        testDirectories: ['./tests'],
        configDirectories: ['./'],
        complexity: 'simple',
        isMonorepo: false,
        packages: [],
        workspaceType: 'npm',
      },
      issues: [],
      recommendations: [],
      timestamp: new Date().toISOString(),
    };

    // Create generator
    const bunGenerator = new BunTestConfigGenerator({
      projectPath: testDir,
      detectionResult: mockDetectionResult
    });

    console.log('Generating config...');
    const result = await bunGenerator.generate('create');
    console.log('Generation result:', result);

    // Check if file exists
    const configPath = join(testDir, 'bunfig.toml');
    console.log('Expected config path:', configPath);
    console.log('File exists:', existsSync(configPath));

    if (existsSync(configPath)) {
      const content = readFileSync(configPath, 'utf-8');
      console.log('File content:', JSON.stringify(content));
    } else {
      console.log('File was not created!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (testDir) {
      cleanupTestDir(testDir);
      console.log('Test directory cleaned up');
    }
  }
}

debugConfigGeneration().catch(console.error);