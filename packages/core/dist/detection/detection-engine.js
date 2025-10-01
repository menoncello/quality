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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoConfigurationDetectionEngine = void 0;
var project_detector_1 = require("./project-detector");
var tool_detector_1 = require("./tool-detector");
var dependency_checker_1 = require("./dependency-checker");
var structure_analyzer_1 = require("./structure-analyzer");
var detection_cache_1 = require("./detection-cache");
var AutoConfigurationDetectionEngine = /** @class */ (function () {
    function AutoConfigurationDetectionEngine(cache) {
        this.projectDetector = new project_detector_1.ProjectDetector();
        this.toolDetector = new tool_detector_1.ToolDetector();
        this.dependencyChecker = new dependency_checker_1.DependencyChecker();
        this.structureAnalyzer = new structure_analyzer_1.StructureAnalyzer();
        this.cache = cache !== null && cache !== void 0 ? cache : new detection_cache_1.DetectionCache();
    }
    AutoConfigurationDetectionEngine.prototype.detectProject = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.projectDetector.detectProject(rootPath)];
            });
        });
    };
    AutoConfigurationDetectionEngine.prototype.detectTools = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.toolDetector.detectTools(rootPath)];
            });
        });
    };
    AutoConfigurationDetectionEngine.prototype.detectConfigs = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.toolDetector.detectConfigs(rootPath)];
            });
        });
    };
    AutoConfigurationDetectionEngine.prototype.detectDependencies = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.dependencyChecker.detectDependencies(rootPath)];
            });
        });
    };
    AutoConfigurationDetectionEngine.prototype.detectStructure = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.structureAnalyzer.analyzeStructure(rootPath)];
            });
        });
    };
    AutoConfigurationDetectionEngine.prototype.detectAll = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var cachedResult, _a, project, tools, configs, dependencies, structure, compatibility, issues, recommendations, result, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        cachedResult = this.cache.getCachedResult(rootPath);
                        if (cachedResult) {
                            return [2 /*return*/, cachedResult];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.projectDetector.detectProject(rootPath),
                                this.toolDetector.detectTools(rootPath),
                                this.toolDetector.detectConfigs(rootPath),
                                this.dependencyChecker.detectDependencies(rootPath),
                                this.structureAnalyzer.analyzeStructure(rootPath),
                            ])];
                    case 1:
                        _a = _b.sent(), project = _a[0], tools = _a[1], configs = _a[2], dependencies = _a[3], structure = _a[4];
                        return [4 /*yield*/, this.dependencyChecker.checkCompatibility(dependencies)];
                    case 2:
                        compatibility = _b.sent();
                        issues = this.generateIssues(project, tools, configs, dependencies, structure, compatibility);
                        recommendations = this.generateRecommendations(project, tools, configs, dependencies, structure, compatibility);
                        result = {
                            project: project,
                            tools: tools,
                            configs: configs,
                            dependencies: dependencies,
                            structure: structure,
                            issues: issues,
                            recommendations: recommendations,
                            timestamp: new Date().toISOString(),
                        };
                        // Cache the result
                        this.cache.setCachedResult(rootPath, result);
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _b.sent();
                        throw new Error("Detection failed: ".concat(error_1));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear cache for a specific path or all caches
     */
    AutoConfigurationDetectionEngine.prototype.clearCache = function (rootPath) {
        if (rootPath) {
            this.cache.invalidate(rootPath);
        }
        else {
            this.cache.clear();
        }
    };
    /**
     * Get cache statistics
     */
    AutoConfigurationDetectionEngine.prototype.getCacheStats = function () {
        return this.cache.getStats();
    };
    AutoConfigurationDetectionEngine.prototype.generateIssues = function (project, tools, _configs, _dependencies, structure, compatibility) {
        var issues = [];
        // Project type issues
        if (project.type === 'unknown') {
            issues.push('Could not determine project type');
        }
        // Tool configuration issues
        var enabledTools = tools.filter(function (t) { return t.enabled; });
        if (enabledTools.length === 0) {
            issues.push('No development tools detected');
        }
        // Dependency issues
        if (compatibility.issues.length > 0) {
            issues.push.apply(issues, compatibility.issues);
        }
        // Structure issues
        if (structure.sourceDirectories.length === 0) {
            issues.push('No source directories found');
        }
        if (structure.testDirectories.length === 0) {
            issues.push('No test directories found - consider adding tests');
        }
        // Configuration issues
        var hasLinting = tools.some(function (t) { return t.name === 'eslint' && t.enabled; });
        var hasFormatting = tools.some(function (t) { return t.name === 'prettier' && t.enabled; });
        if (!hasLinting) {
            issues.push('No linting tool detected - consider adding ESLint');
        }
        if (!hasFormatting) {
            issues.push('No formatting tool detected - consider adding Prettier');
        }
        return issues;
    };
    AutoConfigurationDetectionEngine.prototype.generateRecommendations = function (project, tools, _configs, _dependencies, structure, compatibility) {
        var recommendations = [];
        // Add compatibility recommendations
        recommendations.push.apply(recommendations, compatibility.recommendations);
        // Tool recommendations
        var toolNames = tools.map(function (t) { return t.name; });
        if (!toolNames.includes('typescript') && project.hasTypeScript) {
            recommendations.push('Add TypeScript configuration');
        }
        if (!toolNames.includes('vitest') && !toolNames.includes('jest')) {
            recommendations.push('Add a testing framework (Vitest or Jest)');
        }
        // Basic tool recommendations for minimal projects
        if (!toolNames.includes('eslint')) {
            recommendations.push('Add ESLint for code linting and quality checks');
        }
        if (!toolNames.includes('prettier')) {
            recommendations.push('Add Prettier for consistent code formatting');
        }
        // Structure recommendations
        if (structure.complexity === 'complex' && !structure.isMonorepo) {
            recommendations.push('Consider converting to monorepo structure for better organization');
        }
        // Performance recommendations
        if (structure.packages.length > 5 && structure.workspaceType === 'npm') {
            recommendations.push('Consider using pnpm or yarn workspaces for better performance');
        }
        // Configuration recommendations
        if (toolNames.includes('eslint') && !toolNames.includes('prettier')) {
            recommendations.push('Add Prettier for consistent code formatting');
        }
        // Testing recommendations
        if (structure.testDirectories.length === 0) {
            recommendations.push('Set up testing structure with unit and integration tests');
        }
        return recommendations;
    };
    return AutoConfigurationDetectionEngine;
}());
exports.AutoConfigurationDetectionEngine = AutoConfigurationDetectionEngine;
