import { existsSync } from 'node:fs';
export declare const pathUtils: {
    join: (...paths: string[]) => string;
    dirname: (path: string) => string;
    basename: (path: string, suffix?: string) => string;
    extname: (path: string) => string;
    relative: (from: string, to: string) => string;
    getAppDataPath: (appName: string) => string;
    ensureDir: (dir: string) => void;
    getConfigPath: (configName: string) => string;
};
export declare const stringUtils: {
    kebabCase: (str: string) => string;
    camelCase: (str: string) => string;
    pascalCase: (str: string) => string;
    truncate: (str: string, length: number, suffix?: string) => string;
};
export declare const asyncUtils: {
    sleep: (ms: number) => Promise<void>;
    retry: <T>(fn: () => Promise<T>, maxAttempts?: number, delay?: number) => Promise<T>;
    timeout: <T>(promise: Promise<T>, ms: number, errorMessage?: string) => Promise<T>;
};
export declare const validationUtils: {
    isNonEmptyString: (value: unknown) => value is string;
    isValidVersion: (version: string) => boolean;
    isValidPackageName: (name: string) => boolean;
};
export declare const fileUtils: {
    readJsonSync: <T>(filePath: string) => T;
    writeJsonSync: <T>(filePath: string, data: T) => void;
    existsSync: typeof existsSync;
    findFileUp: (fileName: string, startDir?: string) => string | null;
};
//# sourceMappingURL=index.d.ts.map