import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { StructureAnalyzer } from '../../src/detection/structure-analyzer';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createTestDir } from '../test-utils';
describe('StructureAnalyzer', () => {
    let analyzer;
    let testDir;
    beforeEach(() => {
        analyzer = new StructureAnalyzer();
        testDir = createTestDir('test-structure');
    });
    afterEach(() => {
        cleanupTestDir(testDir);
    });
    describe('analyzeStructure', () => {
        it('should detect a simple project structure', async () => {
            setupSimpleProject(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.isMonorepo).toBe(false);
            expect(structure.workspaceType).toBeNull();
            expect(structure.packages).toHaveLength(0);
            expect(structure.sourceDirectories).toContain('src');
            expect(structure.testDirectories).toContain('test');
            expect(structure.configDirectories).toContain('config');
            expect(structure.complexity).toBe('simple');
        });
        it('should detect npm workspaces', async () => {
            setupNpmWorkspace(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.isMonorepo).toBe(true);
            expect(structure.workspaceType).toBe('npm');
            expect(structure.packages).toContain('packages/*');
        });
        it('should detect pnpm workspaces', async () => {
            setupPnpmWorkspace(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.isMonorepo).toBe(true);
            expect(structure.workspaceType).toBe('pnpm');
        });
        it('should detect Nx monorepo', async () => {
            setupNxWorkspace(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.isMonorepo).toBe(true);
            expect(structure.workspaceType).toBe('nx');
        });
        it('should detect Turbo monorepo', async () => {
            setupTurboWorkspace(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.isMonorepo).toBe(true);
            expect(structure.workspaceType).toBe('turbo');
        });
        it('should find packages in monorepo', async () => {
            setupComplexMonorepo(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.packages.length).toBeGreaterThan(0);
            expect(structure.packages.some(p => p.includes('packages'))).toBe(true);
        });
        it('should calculate complexity correctly', async () => {
            // Simple project
            setupSimpleProject(testDir);
            let structure = await analyzer.analyzeStructure(testDir);
            expect(structure.complexity).toBe('simple');
            // Medium complexity project
            cleanupTestDir(testDir);
            setupMediumProject(testDir);
            structure = await analyzer.analyzeStructure(testDir);
            expect(structure.complexity).toBe('simple');
            // Complex project
            cleanupTestDir(testDir);
            setupComplexProject(testDir);
            structure = await analyzer.analyzeStructure(testDir);
            expect(structure.complexity).toBe('complex');
        });
        it('should find various directory patterns', async () => {
            setupProjectWithMultipleDirs(testDir);
            const structure = await analyzer.analyzeStructure(testDir);
            expect(structure.sourceDirectories).toEqual(expect.arrayContaining(['src', 'lib', 'components']));
            expect(structure.testDirectories).toEqual(expect.arrayContaining(['test', 'tests', '__tests__']));
            expect(structure.configDirectories).toEqual(expect.arrayContaining(['config', 'configs']));
        });
    });
    describe('detectMonorepoType', () => {
        it('should detect npm workspaces from package.json', async () => {
            setupNpmWorkspace(testDir);
            const type = await analyzer.detectMonorepoType(testDir);
            expect(type).toBe('npm');
        });
        it('should detect pnpm workspaces', async () => {
            setupPnpmWorkspace(testDir);
            const type = await analyzer.detectMonorepoType(testDir);
            expect(type).toBe('pnpm');
        });
        it('should return null for non-monorepo', async () => {
            setupSimpleProject(testDir);
            const type = await analyzer.detectMonorepoType(testDir);
            expect(type).toBeNull();
        });
    });
    describe('calculateComplexity', () => {
        it('should return simple for basic project', () => {
            const structure = {
                isMonorepo: false,
                workspaceType: null,
                packages: [],
                sourceDirectories: ['src'],
                testDirectories: ['test'],
                configDirectories: ['config'],
            };
            const complexity = analyzer.calculateComplexity(structure);
            expect(complexity).toBe('simple');
        });
        it('should return complex for monorepo with many packages', () => {
            const structure = {
                isMonorepo: true,
                workspaceType: 'nx',
                packages: Array(15).fill('package'),
                sourceDirectories: ['src'],
                testDirectories: ['test'],
                configDirectories: ['config'],
            };
            const complexity = analyzer.calculateComplexity(structure);
            expect(complexity).toBe('complex');
        });
        it('should return medium for moderate complexity', () => {
            const structure = {
                isMonorepo: false,
                workspaceType: null,
                packages: [],
                sourceDirectories: ['src', 'lib', 'components'],
                testDirectories: ['test', 'tests'],
                configDirectories: ['config', 'configs'],
            };
            const complexity = analyzer.calculateComplexity(structure);
            expect(complexity).toBe('simple');
        });
    });
    function setupSimpleProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'simple-project',
            version: '1.0.0',
        }));
        if (!existsSync(join(dir, 'src'))) {
            mkdirSync(join(dir, 'src'));
        }
        if (!existsSync(join(dir, 'test'))) {
            mkdirSync(join(dir, 'test'));
        }
        if (!existsSync(join(dir, 'config'))) {
            mkdirSync(join(dir, 'config'));
        }
    }
    function setupNpmWorkspace(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'npm-workspace',
            version: '1.0.0',
            workspaces: ['packages/*'],
        }));
    }
    function setupPnpmWorkspace(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'pnpm-workspace',
            version: '1.0.0',
        }));
        writeFileSync(join(dir, 'pnpm-workspace.yaml'), `packages:
  - 'packages/*'
  - 'apps/*'`);
    }
    function setupNxWorkspace(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'nx-workspace',
            version: '1.0.0',
        }));
        writeFileSync(join(dir, 'nx.json'), JSON.stringify({
            extends: 'nx/presets/npm.json',
        }));
    }
    function setupTurboWorkspace(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'turbo-workspace',
            version: '1.0.0',
        }));
        writeFileSync(join(dir, 'turbo.json'), JSON.stringify({
            pipeline: {},
        }));
    }
    function setupComplexMonorepo(dir) {
        setupTurboWorkspace(dir);
        // Create packages directory
        const packagesDir = join(dir, 'packages');
        mkdirSync(packagesDir, { recursive: true });
        // Create some package directories
        const packages = ['core', 'ui', 'utils'];
        packages.forEach(pkg => {
            const pkgDir = join(packagesDir, pkg);
            mkdirSync(pkgDir, { recursive: true });
            writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
                name: `@monorepo/${pkg}`,
                version: '1.0.0',
            }));
        });
    }
    function setupMediumProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'medium-project',
            version: '1.0.0',
            devDependencies: {
                typescript: '^5.3.3',
                eslint: '^8.57.0',
            },
        }));
        // Multiple source directories
        if (!existsSync(join(dir, 'src'))) {
            mkdirSync(join(dir, 'src'));
        }
        if (!existsSync(join(dir, 'lib'))) {
            mkdirSync(join(dir, 'lib'));
        }
        if (!existsSync(join(dir, 'components'))) {
            mkdirSync(join(dir, 'components'));
        }
        // Multiple test directories
        if (!existsSync(join(dir, 'test'))) {
            mkdirSync(join(dir, 'test'));
        }
        if (!existsSync(join(dir, 'tests'))) {
            mkdirSync(join(dir, 'tests'));
        }
        // Multiple config directories
        if (!existsSync(join(dir, 'config'))) {
            mkdirSync(join(dir, 'config'));
        }
        if (!existsSync(join(dir, 'configs'))) {
            mkdirSync(join(dir, 'configs'));
        }
        // Add config files
        writeFileSync(join(dir, 'tsconfig.json'), '{}');
        writeFileSync(join(dir, '.eslintrc.json'), '{}');
    }
    function setupComplexProject(dir) {
        setupComplexMonorepo(dir);
        // Add more directories
        mkdirSync(join(dir, 'src'));
        mkdirSync(join(dir, 'test'));
        mkdirSync(join(dir, 'config'));
        // Add many more packages
        const packagesDir = join(dir, 'packages');
        for (let i = 0; i < 12; i++) {
            const pkgDir = join(packagesDir, `package${i}`);
            mkdirSync(pkgDir, { recursive: true });
            writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
                name: `@monorepo/package${i}`,
                version: '1.0.0',
            }));
        }
    }
    function setupProjectWithMultipleDirs(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'multi-dirs-project',
            version: '1.0.0',
        }));
        // Source directories
        mkdirSync(join(dir, 'src'));
        mkdirSync(join(dir, 'lib'));
        mkdirSync(join(dir, 'components'));
        mkdirSync(join(dir, 'services'));
        mkdirSync(join(dir, 'utils'));
        // Test directories
        mkdirSync(join(dir, 'test'));
        mkdirSync(join(dir, 'tests'));
        mkdirSync(join(dir, '__tests__'));
        mkdirSync(join(dir, 'spec'));
        mkdirSync(join(dir, 'e2e'));
        // Config directories
        mkdirSync(join(dir, 'config'));
        mkdirSync(join(dir, 'configs'));
        mkdirSync(join(dir, 'configuration'));
    }
    function cleanupTestDir(dir) {
        if (existsSync(dir)) {
            // This is a simple cleanup - in real tests you'd use proper cleanup libraries
            try {
                const { execSync } = require('child_process');
                execSync(`rm -rf ${dir}`);
            }
            catch {
                // Ignore cleanup errors
            }
        }
    }
});
//# sourceMappingURL=structure-analyzer.test.js.map