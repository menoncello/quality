"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectDetector = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var utils_1 = require("@dev-quality/utils");
var ProjectDetector = /** @class */ (function () {
    function ProjectDetector() {
        this.FRAMEWORK_PATTERNS = {
            react: ['react', 'react-dom', '@types/react', 'next', 'gatsby', 'remix'],
            vue: ['vue', 'nuxt', '@nuxt/core', 'quasar'],
            angular: ['@angular/core', '@angular/common', '@angular/platform-browser'],
            svelte: ['svelte', 'svelte-kit'],
            node: ['express', 'fastify', 'koa', 'nestjs', 'hapi'],
        };
        this.BUILD_SYSTEMS = [
            { name: 'vite', files: ['vite.config.ts', 'vite.config.js'] },
            { name: 'webpack', files: ['webpack.config.js', 'webpack.config.ts'] },
            { name: 'rollup', files: ['rollup.config.js', 'rollup.config.ts'] },
            { name: 'next', files: ['next.config.js', 'next.config.ts'] },
            { name: 'nuxt', files: ['nuxt.config.ts', 'nuxt.config.js'] },
            { name: 'angular', files: ['angular.json'] },
            { name: 'parcel', files: ['.parcelrc'] },
        ];
    }
    ProjectDetector.prototype.detectProject = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var packageJsonPath, packageJson, projectType, frameworks, buildSystems, packageManager, hasTypeScript, hasTests;
            return __generator(this, function (_a) {
                packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
                if (!(0, node_fs_1.existsSync)(packageJsonPath)) {
                    throw new Error('No package.json found in project root');
                }
                packageJson = this.parsePackageJson(packageJsonPath);
                projectType = this.determineProjectType(packageJson, rootPath);
                frameworks = this.detectFrameworks(packageJson);
                buildSystems = this.detectBuildSystems(rootPath);
                packageManager = this.detectPackageManager(rootPath);
                hasTypeScript = this.hasTypeScript(packageJson, rootPath);
                hasTests = this.hasTests(packageJson, rootPath);
                return [2 /*return*/, {
                        name: packageJson.name || 'unknown-project',
                        version: packageJson.version || '1.0.0',
                        description: packageJson.description || '',
                        type: projectType,
                        frameworks: frameworks,
                        buildSystems: buildSystems,
                        packageManager: packageManager,
                        hasTypeScript: hasTypeScript,
                        hasTests: hasTests,
                        isMonorepo: projectType === 'monorepo',
                        root: rootPath,
                    }];
            });
        });
    };
    ProjectDetector.prototype.parsePackageJson = function (packageJsonPath) {
        try {
            return utils_1.fileUtils.readJsonSync(packageJsonPath);
        }
        catch (error) {
            throw new Error("Failed to parse package.json: ".concat(error));
        }
    };
    ProjectDetector.prototype.determineProjectType = function (packageJson, rootPath) {
        var dependencies = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
        var depNames = Object.keys(dependencies);
        // Check for monorepo
        if (packageJson.workspaces || this.hasMonorepoConfig(rootPath)) {
            return 'monorepo';
        }
        // Check for frontend frameworks
        var frontendFrameworks = ['react', 'vue', 'angular', 'svelte'];
        var hasFrontendDeps = frontendFrameworks.some(function (framework) {
            return depNames.some(function (dep) { return dep.includes(framework); });
        });
        // Check for backend frameworks
        var backendFrameworks = ['express', 'fastify', 'koa', 'nestjs', 'hapi'];
        var hasBackendDeps = backendFrameworks.some(function (framework) {
            return depNames.some(function (dep) { return dep.includes(framework); });
        });
        if (hasFrontendDeps && hasBackendDeps) {
            return 'fullstack';
        }
        else if (hasFrontendDeps) {
            return 'frontend';
        }
        else {
            return 'backend';
        }
    };
    ProjectDetector.prototype.detectFrameworks = function (packageJson) {
        var dependencies = __assign(__assign({}, packageJson.dependencies), packageJson.devDependencies);
        var depNames = Object.keys(dependencies);
        var frameworks = [];
        for (var _i = 0, _a = Object.entries(this.FRAMEWORK_PATTERNS); _i < _a.length; _i++) {
            var _b = _a[_i], framework = _b[0], patterns = _b[1];
            if (patterns.some(function (pattern) { return depNames.some(function (dep) { return dep.includes(pattern); }); })) {
                frameworks.push(framework);
            }
        }
        return frameworks;
    };
    ProjectDetector.prototype.detectBuildSystems = function (rootPath) {
        var buildSystems = [];
        for (var _i = 0, _a = this.BUILD_SYSTEMS; _i < _a.length; _i++) {
            var system = _a[_i];
            for (var _b = 0, _c = system.files; _b < _c.length; _b++) {
                var file = _c[_b];
                if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, file))) {
                    buildSystems.push(system.name);
                    break;
                }
            }
        }
        return buildSystems;
    };
    ProjectDetector.prototype.detectPackageManager = function (rootPath) {
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'bun.lockb'))) {
            return 'bun';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'yarn.lock'))) {
            return 'yarn';
        }
        return 'npm';
    };
    ProjectDetector.prototype.hasTypeScript = function (packageJson, rootPath) {
        var hasTypeScriptDep = Object.keys(__assign(__assign({}, packageJson.dependencies), packageJson.devDependencies)).some(function (dep) { return dep === 'typescript' || dep.startsWith('@types/'); });
        var hasTsConfig = (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'tsconfig.json')) || (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'jsconfig.json'));
        return hasTypeScriptDep || hasTsConfig;
    };
    ProjectDetector.prototype.hasTests = function (packageJson, rootPath) {
        var testScripts = packageJson.scripts
            ? Object.keys(packageJson.scripts).filter(function (key) { return key.includes('test') || key.includes('spec'); })
            : [];
        var testDeps = Object.keys(__assign(__assign({}, packageJson.dependencies), packageJson.devDependencies)).filter(function (dep) {
            return dep.includes('jest') ||
                dep.includes('vitest') ||
                dep.includes('mocha') ||
                dep.includes('cypress') ||
                dep.includes('playwright') ||
                dep.includes('test') ||
                dep.includes('bun-test');
        });
        var hasTestDir = (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'test')) ||
            (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'tests')) ||
            (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, '__tests__'));
        return testScripts.length > 0 || testDeps.length > 0 || hasTestDir;
    };
    ProjectDetector.prototype.hasMonorepoConfig = function (rootPath) {
        var monorepoFiles = [
            'pnpm-workspace.yaml',
            'nx.json',
            'turbo.json',
            'lerna.json',
            'rush.json',
        ];
        return monorepoFiles.some(function (file) { return (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, file)); });
    };
    return ProjectDetector;
}());
exports.ProjectDetector = ProjectDetector;
