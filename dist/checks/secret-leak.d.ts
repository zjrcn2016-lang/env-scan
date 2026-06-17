import { Finding } from '../types';
/**
 * Scan source files for hardcoded secrets using three detection layers:
 *   1. Known service patterns (AWS, Stripe, GitHub, etc.)
 *   2. Keyword heuristics (SECRET=, TOKEN=, PASSWORD=, etc.)
 *   3. Shannon entropy analysis (random-looking strings)
 */
export declare function checkSecretLeak(sourceFiles: string[]): Finding[];
//# sourceMappingURL=secret-leak.d.ts.map