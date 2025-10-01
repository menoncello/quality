"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
exports.DetectionCache = exports.StructureAnalyzer = exports.DependencyChecker = exports.ToolDetector = exports.ProjectDetector = exports.AutoConfigurationDetectionEngine = exports.pluginManager = exports.PluginManager = exports.useCoreStore = void 0;
var zustand_1 = require("zustand");
exports.useCoreStore = (0, zustand_1.create)(function (set, get) { return ({
    currentProject: null,
    plugins: new Map(),
    isLoading: false,
    error: null,
    actions: {
        setProject: function (project) { return set({ currentProject: project }); },
        registerPlugin: function (plugin) {
            var plugins = new Map(get().plugins);
            plugins.set(plugin.name, plugin);
            set({ plugins: plugins });
        },
        setLoading: function (loading) { return set({ isLoading: loading }); },
        setError: function (error) { return set({ error: error }); },
        clearError: function () { return set({ error: null }); },
    },
}); });
var PluginManager = /** @class */ (function () {
    function PluginManager() {
        this.plugins = new Map();
    }
    PluginManager.prototype.register = function (plugin) {
        this.plugins.set(plugin.name, plugin);
    };
    PluginManager.prototype.get = function (name) {
        return this.plugins.get(name);
    };
    PluginManager.prototype.list = function () {
        return Array.from(this.plugins.values());
    };
    PluginManager.prototype.executeAnalysis = function (toolName, config, options) {
        return __awaiter(this, void 0, void 0, function () {
            var plugin;
            return __generator(this, function (_a) {
                plugin = this.get(toolName);
                if (!plugin) {
                    throw new Error("Plugin '".concat(toolName, "' not found"));
                }
                return [2 /*return*/, plugin.analyze(config, options)];
            });
        });
    };
    PluginManager.prototype.validateConfiguration = function (toolName, config) {
        var plugin = this.get(toolName);
        if (!plugin) {
            return false;
        }
        return plugin.validate(config);
    };
    return PluginManager;
}());
exports.PluginManager = PluginManager;
exports.pluginManager = new PluginManager();
// Auto-Configuration Detection Engine exports
var detection_engine_1 = require("./detection/detection-engine");
Object.defineProperty(exports, "AutoConfigurationDetectionEngine", { enumerable: true, get: function () { return detection_engine_1.AutoConfigurationDetectionEngine; } });
var project_detector_1 = require("./detection/project-detector");
Object.defineProperty(exports, "ProjectDetector", { enumerable: true, get: function () { return project_detector_1.ProjectDetector; } });
var tool_detector_1 = require("./detection/tool-detector");
Object.defineProperty(exports, "ToolDetector", { enumerable: true, get: function () { return tool_detector_1.ToolDetector; } });
var dependency_checker_1 = require("./detection/dependency-checker");
Object.defineProperty(exports, "DependencyChecker", { enumerable: true, get: function () { return dependency_checker_1.DependencyChecker; } });
var structure_analyzer_1 = require("./detection/structure-analyzer");
Object.defineProperty(exports, "StructureAnalyzer", { enumerable: true, get: function () { return structure_analyzer_1.StructureAnalyzer; } });
var detection_cache_1 = require("./detection/detection-cache");
Object.defineProperty(exports, "DetectionCache", { enumerable: true, get: function () { return detection_cache_1.DetectionCache; } });
// Plugin System exports
__exportStar(require("./plugins/index.js"), exports);
// Analysis Engine exports
__exportStar(require("./analysis/index.js"), exports);
