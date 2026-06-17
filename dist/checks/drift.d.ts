import { Finding, ParsedEnv } from '../types';
/**
 * Check for structural drift between .env and .env.example.
 * Drift = keys that exist in one file but not the other.
 */
export declare function checkDrift(envParsed: ParsedEnv | null, exampleParsed: ParsedEnv | null): Finding[];
//# sourceMappingURL=drift.d.ts.map