"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StructureAnalyzer = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var utils_1 = require("@dev-quality/utils");
var StructureAnalyzer = /** @class */ (function () {
    function StructureAnalyzer() {
        this.MONOREPO_PATTERNS = {
            npm: ['package.json', 'workspaces'],
            yarn: ['package.json', 'workspaces'],
            pnpm: ['pnpm-workspace.yaml'],
            nx: ['nx.json'],
            turbo: ['turbo.json'],
            lerna: ['lerna.json'],
            rush: ['rush.json'],
        };
        this.SOURCE_PATTERNS = [
            'src',
            'lib',
            'source',
            'app',
            'components',
            'pages',
            'views',
            'services',
            'utils',
            'helpers',
            'hooks',
            'types',
            'interfaces',
        ];
        this.TEST_PATTERNS = [
            'test',
            'tests',
            '__tests__',
            'spec',
            'specs',
            'e2e',
            'integration',
            'unit',
        ];
        this.CONFIG_PATTERNS = ['config', 'configs', '.config', 'configuration', 'conf'];
    }
    StructureAnalyzer.prototype.analyzeStructure = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var isMonorepo, workspaceType, _a, packages, _b, sourceDirectories, testDirectories, configDirectories, structure;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        isMonorepo = this.detectMonorepo(rootPath);
                        if (!isMonorepo) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.detectMonorepoType(rootPath)];
                    case 1:
                        _a = _c.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = null;
                        _c.label = 3;
                    case 3:
                        workspaceType = _a;
                        if (!isMonorepo) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.detectPackages(rootPath)];
                    case 4:
                        _b = _c.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _b = [];
                        _c.label = 6;
                    case 6:
                        packages = _b;
                        return [4 /*yield*/, this.findDirectoriesByPatterns(rootPath, this.SOURCE_PATTERNS)];
                    case 7:
                        sourceDirectories = _c.sent();
                        return [4 /*yield*/, this.findDirectoriesByPatterns(rootPath, this.TEST_PATTERNS)];
                    case 8:
                        testDirectories = _c.sent();
                        return [4 /*yield*/, this.findDirectoriesByPatterns(rootPath, this.CONFIG_PATTERNS)];
                    case 9:
                        configDirectories = _c.sent();
                        structure = {
                            isMonorepo: isMonorepo,
                            workspaceType: workspaceType,
                            packages: packages,
                            sourceDirectories: sourceDirectories,
                            testDirectories: testDirectories,
                            configDirectories: configDirectories,
                            complexity: 'simple',
                        };
                        structure.complexity = this.calculateComplexity(structure);
                        return [2 /*return*/, structure];
                }
            });
        });
    };
    StructureAnalyzer.prototype.detectMonorepoType = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, type, patterns, _c, patterns_1, pattern, packageJsonPath, pkgJson, packageManager;
            return __generator(this, function (_d) {
                // Check for specific monorepo tools FIRST (turbo, nx, lerna, pnpm, rush)
                // These take precedence over generic npm/yarn workspaces
                for (_i = 0, _a = Object.entries(this.MONOREPO_PATTERNS); _i < _a.length; _i++) {
                    _b = _a[_i], type = _b[0], patterns = _b[1];
                    if (type === 'npm' || type === 'yarn')
                        continue; // Handle these last
                    for (_c = 0, patterns_1 = patterns; _c < patterns_1.length; _c++) {
                        pattern = patterns_1[_c];
                        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, pattern))) {
                            return [2 /*return*/, type];
                        }
                    }
                }
                packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
                if ((0, node_fs_1.existsSync)(packageJsonPath)) {
                    try {
                        pkgJson = utils_1.fileUtils.readJsonSync(packageJsonPath);
                        // Check npm/yarn workspaces
                        if (pkgJson.workspaces) {
                            packageManager = this.detectPackageManager(rootPath);
                            return [2 /*return*/, packageManager === 'yarn' ? 'yarn' : 'npm'];
                        }
                    }
                    catch (error) {
                        console.warn('Failed to read package.json for monorepo type detection:', error);
                        // Continue
                    }
                }
                return [2 /*return*/, null];
            });
        });
    };
    StructureAnalyzer.prototype.detectMonorepo = function (rootPath) {
        // Check workspaces in package.json
        var packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
        if ((0, node_fs_1.existsSync)(packageJsonPath)) {
            try {
                var pkgJson = utils_1.fileUtils.readJsonSync(packageJsonPath);
                if (pkgJson.workspaces) {
                    return true;
                }
            }
            catch (error) {
                console.warn('Failed to read package.json:', error);
                // Continue
            }
        }
        // Check for monorepo configuration files
        var monorepoFiles = [
            'pnpm-workspace.yaml',
            'nx.json',
            'turbo.json',
            'lerna.json',
            'rush.json',
        ];
        return monorepoFiles.some(function (file) { return (0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, file)); });
    };
    StructureAnalyzer.prototype.detectPackages = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var packages, packageJsonPath, pkgJson, workspaces, pnpmWorkspacePath, content, packagesMatch, packageLines, _i, packageLines_1, line, packagePath, allPackageDirs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        packages = [];
                        packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
                        if ((0, node_fs_1.existsSync)(packageJsonPath)) {
                            try {
                                pkgJson = utils_1.fileUtils.readJsonSync(packageJsonPath);
                                // Check npm/yarn workspaces
                                if (pkgJson.workspaces) {
                                    workspaces = pkgJson.workspaces;
                                    if (Array.isArray(workspaces)) {
                                        packages.push.apply(packages, workspaces);
                                    }
                                    else if (workspaces.packages) {
                                        packages.push.apply(packages, workspaces.packages);
                                    }
                                }
                            }
                            catch (error) {
                                // Continue
                            }
                        }
                        pnpmWorkspacePath = (0, node_path_1.join)(rootPath, 'pnpm-workspace.yaml');
                        if ((0, node_fs_1.existsSync)(pnpmWorkspacePath)) {
                            try {
                                content = (0, node_fs_1.readFileSync)(pnpmWorkspacePath, 'utf-8');
                                packagesMatch = content.match(/packages:\s*\n((?:\s*-\s*[^\n]+\n?)*)/);
                                if (packagesMatch && packagesMatch[1]) {
                                    packageLines = packagesMatch[1].split('\n').filter(function (line) { return line.trim(); });
                                    for (_i = 0, packageLines_1 = packageLines; _i < packageLines_1.length; _i++) {
                                        line = packageLines_1[_i];
                                        packagePath = line.replace(/^\s*-\s*/, '').trim();
                                        if (packagePath) {
                                            packages.push(packagePath);
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                // Continue
                            }
                        }
                        return [4 /*yield*/, this.findPackageDirectories(rootPath)];
                    case 1:
                        allPackageDirs = _a.sent();
                        packages.push.apply(packages, allPackageDirs.filter(function (dir) { return dir !== '.'; }));
                        return [2 /*return*/, __spreadArray([], new Set(packages), true)];
                }
            });
        });
    };
    StructureAnalyzer.prototype.findPackageDirectories = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var packageDirs, scanDirectory;
            return __generator(this, function (_a) {
                packageDirs = [];
                scanDirectory = function (dir) {
                    var entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
                    for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                        var entry = entries_1[_i];
                        if (entry.isDirectory()) {
                            var fullPath = (0, node_path_1.join)(dir, entry.name);
                            var packageJsonPath = (0, node_path_1.join)(fullPath, 'package.json');
                            if ((0, node_fs_1.existsSync)(packageJsonPath)) {
                                var relativePath = (0, node_path_1.relative)(rootPath, fullPath);
                                packageDirs.push(relativePath);
                            }
                            // Recursively scan, but avoid node_modules
                            if (entry.name !== 'node_modules') {
                                scanDirectory(fullPath);
                            }
                        }
                    }
                };
                scanDirectory(rootPath);
                return [2 /*return*/, packageDirs];
            });
        });
    };
    StructureAnalyzer.prototype.findDirectoriesByPatterns = function (rootPath, patterns) {
        return __awaiter(this, void 0, void 0, function () {
            var directories, scanDirectory;
            return __generator(this, function (_a) {
                directories = [];
                scanDirectory = function (dir, currentDepth) {
                    if (currentDepth === void 0) { currentDepth = 0; }
                    // Limit depth to avoid excessive scanning
                    if (currentDepth > 3)
                        return;
                    var entries = (0, node_fs_1.readdirSync)(dir, { withFileTypes: true });
                    var _loop_1 = function (entry) {
                        if (entry.isDirectory()) {
                            var fullPath = (0, node_path_1.join)(dir, entry.name);
                            var relativePath = (0, node_path_1.relative)(rootPath, fullPath);
                            // Check if directory name matches any pattern
                            if (patterns.some(function (pattern) {
                                return entry.name === pattern ||
                                    entry.name.includes(pattern) ||
                                    entry.name.toLowerCase().includes(pattern.toLowerCase());
                            })) {
                                directories.push(relativePath);
                            }
                            // Recursively scan, but avoid node_modules and hidden directories
                            if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
                                scanDirectory(fullPath, currentDepth + 1);
                            }
                        }
                    };
                    for (var _i = 0, entries_2 = entries; _i < entries_2.length; _i++) {
                        var entry = entries_2[_i];
                        _loop_1(entry);
                    }
                };
                scanDirectory(rootPath);
                return [2 /*return*/, __spreadArray([], new Set(directories), true)];
            });
        });
    };
    StructureAnalyzer.prototype.detectPackageManager = function (rootPath) {
        // Only detect package manager if there's a package.json in the same directory
        var packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
        if (!(0, node_fs_1.existsSync)(packageJsonPath)) {
            return 'npm';
        }
        // Check for lock files in the specific directory only
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'bun.lockb'))) {
            return 'bun';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'pnpm-lock.yaml'))) {
            return 'pnpm';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'yarn.lock'))) {
            return 'yarn';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'bun.lock'))) {
            return 'bun';
        }
        if ((0, node_fs_1.existsSync)((0, node_path_1.join)(rootPath, 'package-lock.json'))) {
            return 'npm';
        }
        return 'npm';
    };
    StructureAnalyzer.prototype.calculateComplexity = function (structure) {
        var score = 0;
        // Base complexity from project type
        if (structure.isMonorepo) {
            score += 3;
        }
        // Package count complexity
        if (structure.packages.length > 10) {
            score += 4;
        }
        else if (structure.packages.length > 5) {
            score += 2;
        }
        else if (structure.packages.length > 2) {
            score += 1;
        }
        // Source directory complexity
        if (structure.sourceDirectories.length > 10) {
            score += 2;
        }
        else if (structure.sourceDirectories.length > 5) {
            score += 1;
        }
        // Test directory complexity
        if (structure.testDirectories.length > 5) {
            score += 2;
        }
        else if (structure.testDirectories.length > 2) {
            score += 1;
        }
        // Configuration complexity
        if (structure.configDirectories.length > 3) {
            score += 2;
        }
        else if (structure.configDirectories.length > 1) {
            score += 1;
        }
        // Workspace type complexity
        if (structure.workspaceType === 'nx' || structure.workspaceType === 'rush') {
            score += 2;
        }
        else if (structure.workspaceType === 'turbo' || structure.workspaceType === 'lerna') {
            score += 1;
        }
        // Calculate final complexity
        if (score >= 8) {
            return 'complex';
        }
        else if (score >= 4) {
            return 'medium';
        }
        else {
            return 'simple';
        }
    };
    return StructureAnalyzer;
}());
exports.StructureAnalyzer = StructureAnalyzer;
