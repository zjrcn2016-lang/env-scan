import { ParsedEnv } from './types';
/**
 * Parse a .env file into structured entries.
 * Handles: comments (#), inline comments, quotes, export prefix, empty lines.
 */
export declare function parseEnvFile(filePath: string): ParsedEnv;
/**
 * Find all .env files in a given directory (non-recursive — env files live at project root)
 */
export declare function findEnvFiles(dir: string): {
    env?: string;
    example?: string;
};
//# sourceMappingURL=parser.d.ts.map