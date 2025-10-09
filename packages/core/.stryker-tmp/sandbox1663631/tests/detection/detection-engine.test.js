import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AutoConfigurationDetectionEngine } from '../../src/detection/detection-engine';
import { join } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createTestDir, cleanupTestDir } from '../test-utils';
describe('AutoConfigurationDetectionEngine', () => {
    let engine;
    let testDir;
    beforeEach(() => {
        engine = new AutoConfigurationDetectionEngine();
        testDir = createTestDir('test-detection-engine');
    });
    afterEach(() => {
        cleanupTestDir(testDir);
    });
    describe('detectAll', () => {
        it('should perform complete detection on a React project', async () => {
            setupReactProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.name).toBe('react-project');
            expect(result.project.type).toBe('frontend');
            expect(result.project.frameworks).toContain('react');
            expect(result.project.hasTypeScript).toBe(true);
            expect(result.project.hasTests).toBe(true);
            expect(result.tools.some(t => t.name === 'typescript')).toBe(true);
            expect(result.tools.some(t => t.name === 'eslint')).toBe(true);
            expect(result.tools.some(t => t.name === 'prettier')).toBe(true);
            expect(result.dependencies.some(d => d.name === 'react')).toBe(true);
            expect(result.dependencies.some(d => d.name === 'typescript')).toBe(true);
            expect(result.structure.sourceDirectories).toContain('src');
            expect(result.structure.testDirectories).toContain('test');
            expect(result.issues.length).toBe(0);
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
            expect(result.timestamp).toBeDefined();
        });
        it('should detect issues in incompatible project', async () => {
            setupIncompatibleProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues.some(issue => issue.includes('below minimum'))).toBe(true);
            expect(result.recommendations.some(rec => rec.includes('Upgrade'))).toBe(true);
        });
        it('should generate recommendations for missing tools', async () => {
            setupMinimalProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.recommendations.some(rec => rec.includes('ESLint'))).toBe(true);
            expect(result.recommendations.some(rec => rec.includes('Prettier'))).toBe(true);
            expect(result.recommendations.some(rec => rec.includes('testing'))).toBe(true);
        });
        it('should detect monorepo structure correctly', async () => {
            setupMonorepoProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.type).toBe('monorepo');
            expect(result.structure.isMonorepo).toBe(true);
            expect(result.structure.workspaceType).toBe('turbo');
            expect(result.structure.packages.length).toBeGreaterThan(0);
        });
        it('should handle missing package.json gracefully', async () => {
            setupEmptyProject(testDir);
            await expect(engine.detectAll(testDir)).rejects.toThrow('No package.json found');
        });
        it('should detect Node.js backend project', async () => {
            setupNodeBackendProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.type).toBe('backend');
            expect(result.project.frameworks).toContain('node');
            expect(result.project.hasTypeScript).toBe(true);
        });
        it('should detect fullstack project', async () => {
            setupFullstackProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.type).toBe('fullstack');
            expect(result.project.frameworks).toContain('react');
            expect(result.project.frameworks).toContain('node');
        });
        it('should detect build systems', async () => {
            setupViteProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.buildSystems).toContain('vite');
            expect(result.tools.some(t => t.name === 'vite')).toBe(true);
        });
        it('should detect testing frameworks', async () => {
            setupJestProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.tools.some(t => t.name === 'jest')).toBe(true);
            expect(result.project.hasTests).toBe(true);
        });
        it('should detect package manager', async () => {
            setupPnpmProject(testDir);
            const result = await engine.detectAll(testDir);
            expect(result.project.packageManager).toBe('pnpm');
        });
    });
    describe('individual detection methods', () => {
        it('should detect project individually', async () => {
            setupReactProject(testDir);
            const project = await engine.detectProject(testDir);
            expect(project.name).toBe('react-project');
            expect(project.type).toBe('frontend');
        });
        it('should detect tools individually', async () => {
            setupReactProject(testDir);
            const tools = await engine.detectTools(testDir);
            expect(tools.length).toBeGreaterThan(0);
            expect(tools.some(t => t.name === 'typescript')).toBe(true);
        });
        it('should detect configs individually', async () => {
            setupReactProject(testDir);
            const configs = await engine.detectConfigs(testDir);
            expect(configs.length).toBeGreaterThan(0);
            expect(configs.some(c => c.tool === 'typescript')).toBe(true);
        });
        it('should detect dependencies individually', async () => {
            setupReactProject(testDir);
            const dependencies = await engine.detectDependencies(testDir);
            expect(dependencies.length).toBeGreaterThan(0);
            expect(dependencies.some(d => d.name === 'react')).toBe(true);
        });
        it('should detect structure individually', async () => {
            setupReactProject(testDir);
            const structure = await engine.detectStructure(testDir);
            expect(structure.sourceDirectories).toContain('src');
            expect(structure.testDirectories).toContain('test');
        });
    });
    function setupReactProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'react-project',
            version: '1.0.0',
            description: 'A React project',
            dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
            },
            devDependencies: {
                typescript: '^5.3.3',
                eslint: '^8.57.0',
                prettier: '^3.0.0',
                '@types/react': '^18.2.0',
                jest: '^29.7.0',
            },
            scripts: {
                test: 'jest',
                build: 'tsc',
                start: 'react-scripts start',
            },
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
        writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify({
            compilerOptions: {
                target: 'es2020',
                lib: ['dom', 'dom.iterable', 'es6'],
                allowJs: true,
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                strict: true,
                forceConsistentCasingInFileNames: true,
                noFallthroughCasesInSwitch: true,
                module: 'esnext',
                moduleResolution: 'node',
                resolveJsonModule: true,
                isolatedModules: true,
                noEmit: true,
                jsx: 'react-jsx',
            },
            include: ['src'],
        }));
        writeFileSync(join(dir, '.eslintrc.json'), JSON.stringify({
            extends: ['react-app', 'react-app/jest'],
        }));
        writeFileSync(join(dir, '.prettierrc'), JSON.stringify({
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
        }));
        writeFileSync(join(dir, 'jest.config.js'), 'module.exports = {};');
    }
    function setupIncompatibleProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'incompatible-project',
            version: '1.0.0',
            devDependencies: {
                typescript: '^4.0.0', // Below minimum
                eslint: '^7.0.0', // Below minimum
            },
        }));
    }
    function setupMinimalProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'minimal-project',
            version: '1.0.0',
        }));
        if (!existsSync(join(dir, 'src'))) {
            mkdirSync(join(dir, 'src'));
        }
    }
    function setupMonorepoProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'monorepo-project',
            version: '1.0.0',
            workspaces: ['packages/*', 'apps/*'],
        }));
        writeFileSync(join(dir, 'turbo.json'), JSON.stringify({
            pipeline: {
                build: {
                    dependsOn: ['^build'],
                },
                test: {
                    dependsOn: ['build'],
                },
            },
        }));
        // Create packages
        const packagesDir = join(dir, 'packages');
        mkdirSync(packagesDir, { recursive: true });
        const pkgDirs = ['core', 'ui', 'utils'];
        pkgDirs.forEach(pkg => {
            const pkgDir = join(packagesDir, pkg);
            mkdirSync(pkgDir, { recursive: true });
            writeFileSync(join(pkgDir, 'package.json'), JSON.stringify({
                name: `@monorepo/${pkg}`,
                version: '1.0.0',
            }));
            if (!existsSync(join(pkgDir, 'src'))) {
                mkdirSync(join(pkgDir, 'src'));
            }
        });
    }
    function setupEmptyProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    }
    function setupNodeBackendProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'node-backend',
            version: '1.0.0',
            dependencies: {
                express: '^4.18.0',
            },
            devDependencies: {
                typescript: '^5.3.3',
                '@types/node': '^20.0.0',
                '@types/express': '^4.17.0',
            },
        }));
        if (!existsSync(join(dir, 'src'))) {
            mkdirSync(join(dir, 'src'));
        }
        writeFileSync(join(dir, 'tsconfig.json'), '{}');
    }
    function setupFullstackProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'fullstack-project',
            version: '1.0.0',
            dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                express: '^4.18.0',
            },
            devDependencies: {
                typescript: '^5.3.3',
                '@types/react': '^18.2.0',
                '@types/node': '^20.0.0',
                '@types/express': '^4.17.0',
            },
        }));
        if (!existsSync(join(dir, 'src'))) {
            mkdirSync(join(dir, 'src'));
        }
        if (!existsSync(join(dir, 'server'))) {
            mkdirSync(join(dir, 'server'));
        }
        writeFileSync(join(dir, 'tsconfig.json'), '{}');
    }
    function setupViteProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'vite-project',
            version: '1.0.0',
            devDependencies: {
                vite: '^5.0.0',
            },
        }));
        writeFileSync(join(dir, 'vite.config.ts'), 'export default {};');
    }
    function setupJestProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'jest-project',
            version: '1.0.0',
            devDependencies: {
                jest: '^29.7.0',
            },
            scripts: {
                test: 'jest',
            },
        }));
        writeFileSync(join(dir, 'jest.config.js'), 'module.exports = {};');
        if (!existsSync(join(dir, 'test'))) {
            mkdirSync(join(dir, 'test'));
        }
    }
    function setupPnpmProject(dir) {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(join(dir, 'package.json'), JSON.stringify({
            name: 'pnpm-project',
            version: '1.0.0',
        }));
        writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    }
});
//# sourceMappingURL=detection-engine.test.js.map