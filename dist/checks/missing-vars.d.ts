import { Finding, ParsedEnv } from '../types';
/**
 * Check for keys defined in .env.example that are missing from .env.
 */
export declare function checkMissingVars(envParsed: ParsedEnv | null, exampleParsed: ParsedEnv | null): Finding[];
//# sourceMappingURL=missing-vars.d.ts.map