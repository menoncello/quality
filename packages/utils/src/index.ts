import { join, dirname, basename, extname, relative } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';

export const pathUtils = {
  join,
  dirname,
  basename,
  extname,
  relative,

  getAppDataPath: (appName: string): string => {
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

  ensureDir: (dir: string): void => {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  },

  getConfigPath: (configName: string): string => {
    return join(process.cwd(), configName);
  },
};

export const stringUtils = {
  kebabCase: (str: string): string => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  },

  camelCase: (str: string): string => {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/[\s-]+/g, '');
  },

  pascalCase: (str: string): string => {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase()).replace(/[\s-]+/g, '');
  },

  truncate: (str: string, length: number, suffix = '...'): string => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  },
};

export const asyncUtils = {
  sleep: (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  retry: async <T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        await asyncUtils.sleep(delay);
      }
    }
    throw new Error('Max retry attempts reached');
  },

  timeout: <T>(
    promise: Promise<T>,
    ms: number,
    errorMessage = 'Operation timed out'
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms)),
    ]);
  },
};

export const validationUtils = {
  isNonEmptyString: (value: unknown): value is string => {
    return typeof value === 'string' && value.trim().length > 0;
  },

  isValidVersion: (version: string): boolean => {
    return /^\d+\.\d+\.\d+(-[\w\d-]+)?$/.test(version);
  },

  isValidPackageName: (name: string): boolean => {
    return /^[a-z][a-z0-9-_]*$/.test(name);
  },
};

export const fileUtils = {
  readJsonSync: <T>(filePath: string): T => {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  },

  writeJsonSync: <T>(filePath: string, data: T): void => {
    const content = JSON.stringify(data, null, 2);
    writeFileSync(filePath, content, 'utf-8');
  },

  existsSync,

  findFileUp: (fileName: string, startDir: string = process.cwd()): string | null => {
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
