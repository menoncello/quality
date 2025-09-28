import { join, dirname, basename, extname, relative } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
export const pathUtils = {
    join,
    dirname,
    basename,
    extname,
    relative,
    getAppDataPath: (appName) => {
        const platform = process.platform;
        const home = homedir();
        if (platform === 'darwin') {
            return join(home, 'Library', 'Application Support', appName);
        }
        if (platform === 'win32') {
            return join(home, 'AppData', 'Roaming', appName);
        }
        return join(home, '.local', 'share', appName);
    },
    ensureDir: (dir) => {
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
    },
    getConfigPath: (configName) => {
        return join(process.cwd(), configName);
    },
};
export const stringUtils = {
    kebabCase: (str) => {
        return str
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase();
    },
    camelCase: (str) => {
        return str
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
            .replace(/[\s-]+/g, '');
    },
    pascalCase: (str) => {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/[\s-]+/g, '');
    },
    truncate: (str, length, suffix = '...') => {
        if (str.length <= length)
            return str;
        return str.slice(0, length - suffix.length) + suffix;
    },
};
export const asyncUtils = {
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    retry: async (fn, maxAttempts = 3, delay = 1000) => {
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                if (attempt === maxAttempts) {
                    throw error;
                }
                await asyncUtils.sleep(delay);
            }
        }
        throw new Error('Max retry attempts reached');
    },
    timeout: (promise, ms, errorMessage = 'Operation timed out') => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
        ]);
    },
};
export const validationUtils = {
    isNonEmptyString: (value) => {
        return typeof value === 'string' && value.trim().length > 0;
    },
    isValidVersion: (version) => {
        return /^\d+\.\d+\.\d+(-[\w\d-]+)?$/.test(version);
    },
    isValidPackageName: (name) => {
        return /^[a-z][a-z0-9-_]*$/.test(name);
    },
};
export const fileUtils = {
    readJsonSync: (filePath) => {
        const content = readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    },
    writeJsonSync: (filePath, data) => {
        const content = JSON.stringify(data, null, 2);
        writeFileSync(filePath, content, 'utf-8');
    },
    existsSync,
    findFileUp: (fileName, startDir = process.cwd()) => {
        let currentDir = startDir;
        while (currentDir !== dirname(currentDir)) {
            const filePath = join(currentDir, fileName);
            if (existsSync(filePath)) {
                return filePath;
            }
            currentDir = dirname(currentDir);
        }
        return null;
    },
};
// Node.js built-in functions are imported above
//# sourceMappingURL=index.js.map