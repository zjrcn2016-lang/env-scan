interface ScannerResult {
    envFiles: string[];
    sourceFiles: string[];
}
/**
 * Scan a directory recursively, collecting .env files and source files.
 */
export declare function scanDirectory(dir: string, respectGitignore?: boolean): ScannerResult;
/**
 * Check if a file is binary (vs text).
 * Quick check: read first 8KB and look for null bytes.
 */
export declare function isBinaryFile(filePath: string): boolean;
/**
 * Read a text file as lines.
 */
export declare function readFileLines(filePath: string): string[];
export {};
//# sourceMappingURL=scanner.d.ts.map