export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export declare const SEVERITY_ORDER: Record<Severity, number>;
export interface Finding {
    rule: string;
    severity: Severity;
    message: string;
    file?: string;
    line?: number;
    column?: number;
    snippet?: string;
    suggestion?: string;
}
export interface ScanStats {
    totalFiles: number;
    envFiles: string[];
    sourceFiles: number;
    errors: number;
}
export interface ScanResult {
    findings: Finding[];
    stats: ScanStats;
    summary: Record<Severity, number>;
}
export type OutputFormat = 'terminal' | 'json' | 'markdown';
export type CheckName = 'secret-leak' | 'git-exposure' | 'missing-vars' | 'unused-vars' | 'drift';
export interface ScanConfig {
    directory: string;
    checks: CheckName[];
    severity: Severity;
    respectGitignore: boolean;
    format: OutputFormat;
    strict: boolean;
}
export interface EnvEntry {
    key: string;
    value: string;
    line: number;
    raw: string;
    commented: boolean;
}
export interface ParsedEnv {
    path: string;
    entries: EnvEntry[];
    keys: Set<string>;
}
export interface SecretPattern {
    name: string;
    regex: RegExp;
    severity: Severity;
    suggestion: string;
}
//# sourceMappingURL=types.d.ts.map