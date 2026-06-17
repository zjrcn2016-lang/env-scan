import { Finding, ParsedEnv } from '../types';
/**
 * Check for environment variables defined in .env that are never referenced
 * in any source file. These may be obsolete/dead configuration.
 */
export declare function checkUnusedVars(envParsed: ParsedEnv | null, sourceFiles: string[]): Finding[];
//# sourceMappingURL=unused-vars.d.ts.map