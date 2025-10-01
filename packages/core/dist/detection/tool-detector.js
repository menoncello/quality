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
exports.ToolDetector = void 0;
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var utils_1 = require("@dev-quality/utils");
var ToolDetector = /** @class */ (function () {
    function ToolDetector() {
        this.TOOL_CONFIGS = [
            // Linting and Formatting
            {
                tool: 'eslint',
                configs: [
                    '.eslintrc',
                    '.eslintrc.json',
                    '.eslintrc.yaml',
                    '.eslintrc.yml',
                    '.eslintrc.js',
                    'eslint.config.js',
                ],
                versionDep: 'eslint',
            },
            {
                tool: 'prettier',
                configs: [
                    '.prettierrc',
                    '.prettierrc.json',
                    '.prettierrc.yaml',
                    '.prettierrc.yml',
                    '.prettierrc.js',
                    '.prettierrc.toml',
                ],
                versionDep: 'prettier',
            },
            // TypeScript
            {
                tool: 'typescript',
                configs: ['tsconfig.json', 'jsconfig.json'],
                versionDep: 'typescript',
            },
            // Testing Frameworks
            {
                tool: 'jest',
                configs: [
                    'jest.config.js',
                    'jest.config.ts',
                    'jest.config.json',
                    'jest.config.mjs',
                    'jest.config.cjs',
                ],
                versionDep: 'jest',
            },
            {
                tool: 'vitest',
                configs: ['vitest.config.ts', 'vitest.config.js', 'vitest.workspace.ts'],
                versionDep: 'vitest',
            },
            {
                tool: 'cypress',
                configs: ['cypress.config.js', 'cypress.config.ts'],
                versionDep: 'cypress',
            },
            {
                tool: 'playwright',
                configs: ['playwright.config.js', 'playwright.config.ts'],
                versionDep: '@playwright/test',
            },
            // Build Tools and Bundlers
            {
                tool: 'webpack',
                configs: [
                    'webpack.config.js',
                    'webpack.config.ts',
                    'webpack.config.mjs',
                    'webpack.config.cjs',
                ],
                versionDep: 'webpack',
            },
            {
                tool: 'vite',
                configs: ['vite.config.js', 'vite.config.ts'],
                versionDep: 'vite',
            },
            {
                tool: 'rollup',
                configs: ['rollup.config.js', 'rollup.config.ts'],
                versionDep: 'rollup',
            },
            {
                tool: 'next',
                configs: ['next.config.js', 'next.config.ts', 'next.config.mjs'],
                versionDep: 'next',
            },
            {
                tool: 'nuxt',
                configs: ['nuxt.config.ts', 'nuxt.config.js'],
                versionDep: 'nuxt',
            },
            // CSS and Styling
            {
                tool: 'tailwind',
                configs: ['tailwind.config.js', 'tailwind.config.ts'],
                versionDep: 'tailwindcss',
            },
            {
                tool: 'postcss',
                configs: ['postcss.config.js', 'postcss.config.ts', 'postcss.config.mjs'],
                versionDep: 'postcss',
            },
            {
                tool: 'babel',
                configs: ['babel.config.js', 'babel.config.json', '.babelrc', '.babelrc.js'],
                versionDep: '@babel/core',
            },
        ];
    }
    ToolDetector.prototype.detectTools = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var detectedTools, packageJson, _i, _a, toolConfig, tool;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        detectedTools = [];
                        packageJson = this.loadPackageJson(rootPath);
                        _i = 0, _a = this.TOOL_CONFIGS;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        toolConfig = _a[_i];
                        return [4 /*yield*/, this.detectSingleTool(rootPath, toolConfig, packageJson)];
                    case 2:
                        tool = _b.sent();
                        if (tool) {
                            detectedTools.push(tool);
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, detectedTools.sort(function (a, b) { return a.priority - b.priority; })];
                }
            });
        });
    };
    ToolDetector.prototype.detectConfigs = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var configFiles, _i, _a, toolConfig, _b, _c, configFile, configPath, configContent;
            return __generator(this, function (_d) {
                configFiles = [];
                for (_i = 0, _a = this.TOOL_CONFIGS; _i < _a.length; _i++) {
                    toolConfig = _a[_i];
                    for (_b = 0, _c = toolConfig.configs; _b < _c.length; _b++) {
                        configFile = _c[_b];
                        configPath = (0, node_path_1.join)(rootPath, configFile);
                        if ((0, node_fs_1.existsSync)(configPath)) {
                            try {
                                configContent = this.parseConfigFile(configPath);
                                configFiles.push({
                                    path: configPath,
                                    format: this.getConfigFormat(configFile),
                                    tool: toolConfig.tool,
                                    config: configContent,
                                });
                            }
                            catch (error) {
                                console.warn("Failed to parse config file ".concat(configPath, ":"), error);
                            }
                        }
                    }
                }
                return [2 /*return*/, configFiles];
            });
        });
    };
    ToolDetector.prototype.detectSingleTool = function (rootPath, toolConfig, packageJson) {
        return __awaiter(this, void 0, void 0, function () {
            var configPath, version, configContent;
            return __generator(this, function (_a) {
                configPath = this.findConfigPath(rootPath, toolConfig.configs);
                if (!configPath) {
                    return [2 /*return*/, null];
                }
                try {
                    version = this.extractVersion(packageJson, toolConfig.versionDep);
                    configContent = this.parseConfigFile(configPath);
                    return [2 /*return*/, {
                            name: toolConfig.tool,
                            version: version || 'unknown',
                            configPath: configPath,
                            configFormat: this.getConfigFormat((0, node_path_1.basename)(configPath)),
                            enabled: true,
                            priority: this.getToolPriority(toolConfig.tool),
                            config: configContent,
                        }];
                }
                catch (error) {
                    console.warn("Failed to detect tool ".concat(toolConfig.tool, ":"), error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    };
    ToolDetector.prototype.findConfigPath = function (rootPath, configFiles) {
        for (var _i = 0, configFiles_1 = configFiles; _i < configFiles_1.length; _i++) {
            var configFile = configFiles_1[_i];
            var configPath = (0, node_path_1.join)(rootPath, configFile);
            if ((0, node_fs_1.existsSync)(configPath)) {
                return configPath;
            }
        }
        return null;
    };
    ToolDetector.prototype.parseConfigFile = function (configPath) {
        var format = this.getConfigFormat((0, node_path_1.basename)(configPath));
        switch (format) {
            case 'json':
                return utils_1.fileUtils.readJsonSync(configPath);
            case 'js':
            case 'ts':
                // For JS/TS configs, we'd need to evaluate them
                // For now, return basic info
                return { _type: format, _path: configPath };
            case 'yaml':
                // For YAML configs, we'd need a YAML parser
                // For now, return basic info
                return { _type: format, _path: configPath };
            default:
                return { _type: 'unknown', _path: configPath };
        }
    };
    ToolDetector.prototype.getConfigFormat = function (filename) {
        var ext = (0, node_path_1.extname)(filename).toLowerCase();
        switch (ext) {
            case '.json':
                return 'json';
            case '.js':
                return 'js';
            case '.ts':
                return 'ts';
            case '.yaml':
            case '.yml':
                return 'yaml';
            default:
                if (filename.endsWith('.json'))
                    return 'json';
                if (filename.endsWith('.js'))
                    return 'js';
                if (filename.endsWith('.ts'))
                    return 'ts';
                if (filename.endsWith('.yaml') || filename.endsWith('.yml'))
                    return 'yaml';
                return 'json'; // default
        }
    };
    ToolDetector.prototype.extractVersion = function (packageJson, depName) {
        var allDeps = __assign(__assign(__assign(__assign({}, packageJson.dependencies), packageJson.devDependencies), packageJson.peerDependencies), packageJson.optionalDependencies);
        return allDeps[depName] || null;
    };
    ToolDetector.prototype.getToolPriority = function (toolName) {
        var priorities = {
            typescript: 1,
            eslint: 2,
            prettier: 3,
            jest: 4,
            vitest: 4,
            webpack: 5,
            vite: 5,
            rollup: 5,
            next: 6,
            nuxt: 6,
            tailwind: 7,
            postcss: 7,
            babel: 8,
            cypress: 9,
            playwright: 9,
        };
        return priorities[toolName] || 99;
    };
    ToolDetector.prototype.loadPackageJson = function (rootPath) {
        var packageJsonPath = (0, node_path_1.join)(rootPath, 'package.json');
        if (!(0, node_fs_1.existsSync)(packageJsonPath)) {
            return {};
        }
        try {
            return utils_1.fileUtils.readJsonSync(packageJsonPath);
        }
        catch (error) {
            console.warn("Failed to load package.json:", error);
            return {};
        }
    };
    return ToolDetector;
}());
exports.ToolDetector = ToolDetector;
