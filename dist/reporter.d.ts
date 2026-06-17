import { Finding, ScanResult, Severity } from './types';
/**
 * Main reporter: renders scan results in the chosen format.
 * Returns the exit code (0 = clean, 1 = issues found).
 */
export declare function report(result: ScanResult, format: 'terminal' | 'json' | 'markdown'): number;
export declare function getExitCode(result: ScanResult, strict: boolean): number;
export declare function countSummary(findings: Finding[]): Record<Severity, number>;
//# sourceMappingURL=reporter.d.ts.map