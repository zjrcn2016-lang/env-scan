import { SecretPattern, Severity } from './types';
/**
 * 30+ known secret patterns for popular services.
 * Each pattern includes a name, regex, severity, and fix suggestion.
 */
export declare const SECRET_PATTERNS: SecretPattern[];
/**
 * Generic credential keyword patterns (Layer 2 heuristics).
 * Matches variable-like assignments with sensitive names.
 */
export declare const KEYWORD_PATTERNS: {
    name: string;
    regex: RegExp;
    severity: Severity;
    suggestion: string;
}[];
//# sourceMappingURL=patterns.d.ts.map