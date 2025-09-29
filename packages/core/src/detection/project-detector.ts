import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileUtils, pathUtils } from '@dev-quality/utils';
import { DetectedProject } from './types';

export class ProjectDetector {
  private readonly CONFIG_FILES = [
    'package.json',
    'tsconfig.json',
    'jsconfig.json',
    'angular.json',
    'nuxt.config.ts',
    'next.config.js',
    'vite.config.ts',
    'webpack.config.js',
    'rollup.config.js',
  ];

  private readonly FRAMEWORK_PATTERNS = {
    react: ['react', 'react-dom', '@types/react', 'next', 'gatsby', 'remix'],
    vue: ['vue', 'nuxt', '@nuxt/core', 'quasar'],
    angular: ['@angular/core', '@angular/common', '@angular/platform-browser'],
    svelte: ['svelte', 'svelte-kit'],
    node: ['express', 'fastify', 'koa', 'nestjs', 'hapi'],
  };

  private readonly BUILD_SYSTEMS = [
    { name: 'vite', files: ['vite.config.ts', 'vite.config.js'] },
    { name: 'webpack', files: ['webpack.config.js', 'webpack.config.ts'] },
    { name: 'rollup', files: ['rollup.config.js', 'rollup.config.ts'] },
    { name: 'next', files: ['next.config.js', 'next.config.ts'] },
    { name: 'nuxt', files: ['nuxt.config.ts', 'nuxt.config.js'] },
    { name: 'angular', files: ['angular.json'] },
    { name: 'parcel', files: ['.parcelrc'] },
  ];

  async detectProject(rootPath: string): Promise<DetectedProject> {
    const packageJsonPath = join(rootPath, 'package.json');

    if (!existsSync(packageJsonPath)) {
      throw new Error('No package.json found in project root');
    }

    const packageJson = this.parsePackageJson(packageJsonPath);
    const projectType = this.determineProjectType(packageJson, rootPath);
    const frameworks = this.detectFrameworks(packageJson);
    const buildSystems = this.detectBuildSystems(rootPath);
    const packageManager = this.detectPackageManager(rootPath);
    const hasTypeScript = this.hasTypeScript(packageJson, rootPath);
    const hasTests = this.hasTests(packageJson, rootPath);

    return {
      name: packageJson.name || 'unknown-project',
      version: packageJson.version || '1.0.0',
      description: packageJson.description || '',
      type: projectType,
      frameworks,
      buildSystems,
      packageManager,
      hasTypeScript,
      hasTests,
      isMonorepo: projectType === 'monorepo',
      root: rootPath,
    };
  }

  private parsePackageJson(packageJsonPath: string): any {
    try {
      return fileUtils.readJsonSync(packageJsonPath);
    } catch (error) {
      throw new Error(`Failed to parse package.json: ${error}`);
    }
  }

  private determineProjectType(packageJson: any, rootPath: string): DetectedProject['type'] {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(dependencies);

    // Check for monorepo
    if (packageJson.workspaces || this.hasMonorepoConfig(rootPath)) {
      return 'monorepo';
    }

    // Check for frontend frameworks
    const frontendFrameworks = ['react', 'vue', 'angular', 'svelte'];
    const hasFrontendDeps = frontendFrameworks.some(framework =>
      depNames.some(dep => dep.includes(framework))
    );

    // Check for backend frameworks
    const backendFrameworks = ['express', 'fastify', 'koa', 'nestjs', 'hapi'];
    const hasBackendDeps = backendFrameworks.some(framework =>
      depNames.some(dep => dep.includes(framework))
    );

    if (hasFrontendDeps && hasBackendDeps) {
      return 'fullstack';
    } else if (hasFrontendDeps) {
      return 'frontend';
    } else {
      return 'backend';
    }
  }

  private detectFrameworks(packageJson: any): string[] {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    const depNames = Object.keys(dependencies);
    const frameworks: string[] = [];

    for (const [framework, patterns] of Object.entries(this.FRAMEWORK_PATTERNS)) {
      if (patterns.some(pattern => depNames.some(dep => dep.includes(pattern)))) {
        frameworks.push(framework);
      }
    }

    return frameworks;
  }

  private detectBuildSystems(rootPath: string): string[] {
    const buildSystems: string[] = [];

    for (const system of this.BUILD_SYSTEMS) {
      for (const file of system.files) {
        if (existsSync(join(rootPath, file))) {
          buildSystems.push(system.name);
          break;
        }
      }
    }

    return buildSystems;
  }

  private detectPackageManager(rootPath: string): DetectedProject['packageManager'] {
    if (existsSync(join(rootPath, 'bun.lockb'))) {
      return 'bun';
    }
    if (existsSync(join(rootPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (existsSync(join(rootPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  private hasTypeScript(packageJson: any, rootPath: string): boolean {
    const hasTypeScriptDep = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).some(dep => dep === 'typescript' || dep.startsWith('@types/'));

    const hasTsConfig =
      existsSync(join(rootPath, 'tsconfig.json')) || existsSync(join(rootPath, 'jsconfig.json'));

    return hasTypeScriptDep || hasTsConfig;
  }

  private hasTests(packageJson: any, rootPath: string): boolean {
    const testScripts = packageJson.scripts
      ? Object.keys(packageJson.scripts).filter(key => key.includes('test') || key.includes('spec'))
      : [];

    const testDeps = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }).filter(
      dep =>
        dep.includes('jest') ||
        dep.includes('vitest') ||
        dep.includes('mocha') ||
        dep.includes('cypress') ||
        dep.includes('playwright') ||
        dep.includes('test') ||
        dep.includes('bun-test')
    );

    const hasTestDir =
      existsSync(join(rootPath, 'test')) ||
      existsSync(join(rootPath, 'tests')) ||
      existsSync(join(rootPath, '__tests__'));

    return testScripts.length > 0 || testDeps.length > 0 || hasTestDir;
  }

  private hasMonorepoConfig(rootPath: string): boolean {
    const monorepoFiles = [
      'pnpm-workspace.yaml',
      'nx.json',
      'turbo.json',
      'lerna.json',
      'rush.json',
    ];

    return monorepoFiles.some(file => existsSync(join(rootPath, file)));
  }
}
