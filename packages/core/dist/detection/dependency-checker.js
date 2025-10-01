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
exports.DependencyChecker = void 0;
var utils_1 = require("@dev-quality/utils");
var DependencyChecker = /** @class */ (function () {
    function DependencyChecker() {
        this.COMPATIBILITY_MATRIX = {
            // DevQuality tool requirements
            typescript: {
                minimum: '4.9.0',
                recommended: '5.3.3',
                incompatible: ['<4.9.0'],
            },
            eslint: {
                minimum: '8.0.0',
                recommended: '8.57.0',
                incompatible: ['<8.0.0'],
            },
            prettier: {
                minimum: '2.0.0',
                recommended: '3.0.0',
                incompatible: ['<2.0.0'],
            },
            // Testing frameworks
            jest: {
                minimum: '29.0.0',
                recommended: '29.7.0',
                incompatible: ['<29.0.0'],
            },
            vitest: {
                minimum: '0.34.0',
                recommended: '1.0.0',
                incompatible: ['<0.34.0'],
            },
            // Build tools
            webpack: {
                minimum: '5.0.0',
                recommended: '5.89.0',
                incompatible: ['<5.0.0'],
            },
            vite: {
                minimum: '4.0.0',
                recommended: '5.0.0',
                incompatible: ['<4.0.0'],
            },
            // Framework-specific
            react: {
                minimum: '16.8.0',
                recommended: '18.2.0',
                incompatible: ['<16.8.0'],
            },
            next: {
                minimum: '13.0.0',
                recommended: '14.0.0',
                incompatible: ['<13.0.0'],
            },
        };
        this.VERSION_CONFLICTS = {
            // TypeScript conflicts
            'typescript@<4.9.0': ['next@>=13.0.0', 'react@>=18.0.0'],
            'typescript@>=5.0.0': ['some-old-framework@<2.0.0'],
            // React conflicts
            'react@<16.8.0': ['react-hooks@>=1.0.0'],
            'react@>=18.0.0': ['some-old-library@<1.0.0'],
            // Build tool conflicts
            'webpack@<5.0.0': ['webpack-dev-server@>=4.0.0'],
            'vite@<3.0.0': ['@vitejs/plugin-react@>=2.0.0'],
        };
    }
    DependencyChecker.prototype.detectDependencies = function (rootPath) {
        return __awaiter(this, void 0, void 0, function () {
            var packageJson, dependencies, depTypeMap, depTypes, _i, depTypes_1, depType, _a, _b, _c, name_1, version, compatibility, issues;
            return __generator(this, function (_d) {
                packageJson = this.loadPackageJson(rootPath);
                dependencies = [];
                depTypeMap = {
                    dependencies: 'dependency',
                    devDependencies: 'devDependency',
                    peerDependencies: 'peerDependency',
                    optionalDependencies: 'devDependency', // Treat optional as dev
                };
                depTypes = Object.keys(depTypeMap);
                for (_i = 0, depTypes_1 = depTypes; _i < depTypes_1.length; _i++) {
                    depType = depTypes_1[_i];
                    if (packageJson[depType]) {
                        for (_a = 0, _b = Object.entries(packageJson[depType]); _a < _b.length; _a++) {
                            _c = _b[_a], name_1 = _c[0], version = _c[1];
                            compatibility = this.checkDependencyCompatibility(name_1, version);
                            issues = this.getCompatibilityIssues(name_1, version);
                            dependencies.push({
                                name: name_1,
                                version: version,
                                type: depTypeMap[depType],
                                compatibility: compatibility,
                                issues: issues,
                            });
                        }
                    }
                }
                return [2 /*return*/, dependencies];
            });
        });
    };
    DependencyChecker.prototype.checkCompatibility = function (deps) {
        return __awaiter(this, void 0, void 0, function () {
            var issues, recommendations, compatible, _i, deps_1, dep, conflicts, upgradeRecommendations;
            return __generator(this, function (_a) {
                issues = [];
                recommendations = [];
                compatible = true;
                // Check individual compatibility
                for (_i = 0, deps_1 = deps; _i < deps_1.length; _i++) {
                    dep = deps_1[_i];
                    if (dep.compatibility === 'incompatible') {
                        compatible = false;
                        issues.push.apply(issues, dep.issues);
                    }
                }
                conflicts = this.checkVersionConflicts(deps);
                if (conflicts.length > 0) {
                    compatible = false;
                    issues.push.apply(issues, conflicts);
                }
                upgradeRecommendations = this.generateUpgradeRecommendations(deps);
                recommendations.push.apply(recommendations, upgradeRecommendations);
                return [2 /*return*/, {
                        compatible: compatible,
                        issues: __spreadArray([], new Set(issues), true), // Remove duplicates
                        recommendations: __spreadArray([], new Set(recommendations), true),
                    }];
            });
        });
    };
    DependencyChecker.prototype.getMinimumVersion = function (tool) {
        var _a;
        return ((_a = this.COMPATIBILITY_MATRIX[tool]) === null || _a === void 0 ? void 0 : _a.minimum) || '0.0.0';
    };
    DependencyChecker.prototype.getRecommendedVersion = function (tool) {
        var _a;
        return ((_a = this.COMPATIBILITY_MATRIX[tool]) === null || _a === void 0 ? void 0 : _a.recommended) || 'latest';
    };
    DependencyChecker.prototype.checkDependencyCompatibility = function (name, version) {
        var matrix = this.COMPATIBILITY_MATRIX[name];
        if (!matrix) {
            return 'unknown';
        }
        var cleanVersion = this.cleanVersion(version);
        var minVersion = matrix.minimum;
        var incompatibleVersions = matrix.incompatible || [];
        // Check against incompatible versions
        for (var _i = 0, incompatibleVersions_1 = incompatibleVersions; _i < incompatibleVersions_1.length; _i++) {
            var incompatible = incompatibleVersions_1[_i];
            if (this.satisfiesVersion(cleanVersion, incompatible)) {
                return 'incompatible';
            }
        }
        // Check minimum version
        if (this.compareVersions(cleanVersion, minVersion) < 0) {
            return 'incompatible';
        }
        return 'compatible';
    };
    DependencyChecker.prototype.getCompatibilityIssues = function (name, version) {
        var issues = [];
        var matrix = this.COMPATIBILITY_MATRIX[name];
        if (!matrix) {
            return issues;
        }
        var cleanVersion = this.cleanVersion(version);
        var minVersion = matrix.minimum;
        if (this.compareVersions(cleanVersion, minVersion) < 0) {
            issues.push("".concat(name, "@").concat(version, " is below minimum required version ").concat(minVersion));
        }
        return issues;
    };
    DependencyChecker.prototype.checkVersionConflicts = function (deps) {
        var conflicts = [];
        var depMap = new Map(deps.map(function (d) { return [d.name, d.version]; }));
        for (var _i = 0, _a = Object.entries(this.VERSION_CONFLICTS); _i < _a.length; _i++) {
            var _b = _a[_i], conflictPattern = _b[0], conflictingDeps = _b[1];
            var _c = conflictPattern.split('@'), depName = _c[0], versionRange = _c[1];
            if (!depName || !versionRange)
                continue;
            var currentDep = depMap.get(depName);
            if (currentDep && this.satisfiesVersion(currentDep, versionRange)) {
                for (var _d = 0, conflictingDeps_1 = conflictingDeps; _d < conflictingDeps_1.length; _d++) {
                    var conflictingDep = conflictingDeps_1[_d];
                    var _e = conflictingDep.split('@'), conflictingName = _e[0], conflictingRange = _e[1];
                    if (!conflictingName || !conflictingRange)
                        continue;
                    var conflictingVersion = depMap.get(conflictingName);
                    if (conflictingVersion && this.satisfiesVersion(conflictingVersion, conflictingRange)) {
                        conflicts.push("Version conflict: ".concat(depName, "@").concat(currentDep, " conflicts with ").concat(conflictingName, "@").concat(conflictingVersion));
                    }
                }
            }
        }
        return conflicts;
    };
    DependencyChecker.prototype.generateUpgradeRecommendations = function (deps) {
        var recommendations = [];
        for (var _i = 0, deps_2 = deps; _i < deps_2.length; _i++) {
            var dep = deps_2[_i];
            var matrix = this.COMPATIBILITY_MATRIX[dep.name];
            if (matrix && dep.compatibility === 'incompatible') {
                var recommended = matrix.recommended;
                recommendations.push("Upgrade ".concat(dep.name, " from ").concat(dep.version, " to ").concat(recommended));
            }
        }
        return recommendations;
    };
    DependencyChecker.prototype.cleanVersion = function (version) {
        // Remove npm version prefixes and suffixes
        return (version
            .replace(/^[\^~]/, '')
            .replace(/-.*$/, '')
            .split(' ')[0] || '0.0.0');
    };
    DependencyChecker.prototype.compareVersions = function (version1, version2) {
        var v1 = version1.split('.').map(Number);
        var v2 = version2.split('.').map(Number);
        for (var i = 0; i < Math.max(v1.length, v2.length); i++) {
            var num1 = v1[i] || 0;
            var num2 = v2[i] || 0;
            if (num1 > num2)
                return 1;
            if (num1 < num2)
                return -1;
        }
        return 0;
    };
    DependencyChecker.prototype.satisfiesVersion = function (version, range) {
        var cleanVersion = this.cleanVersion(version);
        if (range.startsWith('>=')) {
            return this.compareVersions(cleanVersion, range.substring(2)) >= 0;
        }
        else if (range.startsWith('>')) {
            return this.compareVersions(cleanVersion, range.substring(1)) > 0;
        }
        else if (range.startsWith('<=')) {
            return this.compareVersions(cleanVersion, range.substring(2)) <= 0;
        }
        else if (range.startsWith('<')) {
            return this.compareVersions(cleanVersion, range.substring(1)) < 0;
        }
        else if (range.includes('-')) {
            // Handle range like "1.0.0-2.0.0"
            var _a = range.split('-'), min = _a[0], max = _a[1];
            if (!min || !max)
                return false;
            return (this.compareVersions(cleanVersion, min) >= 0 && this.compareVersions(cleanVersion, max) <= 0);
        }
        else {
            // Exact version
            return cleanVersion === range;
        }
    };
    DependencyChecker.prototype.loadPackageJson = function (rootPath) {
        var packageJsonPath = "".concat(rootPath, "/package.json");
        try {
            return utils_1.fileUtils.readJsonSync(packageJsonPath);
        }
        catch (error) {
            return {};
        }
    };
    return DependencyChecker;
}());
exports.DependencyChecker = DependencyChecker;
