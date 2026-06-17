// ─── Severity ───────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

// ─── Finding ────────────────────────────────────────────
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

// ─── Scan Result ────────────────────────────────────────
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

// ─── Config ─────────────────────────────────────────────
export type OutputFormat = 'terminal' | 'json' | 'markdown';

export type CheckName =
  | 'secret-leak'
  | 'git-exposure'
  | 'missing-vars'
  | 'unused-vars'
  | 'drift';

export interface ScanConfig {
  directory: string;
  checks: CheckName[];
  severity: Severity;
  respectGitignore: boolean;
  format: OutputFormat;
  strict: boolean;
}

// ─── Parsed .env ────────────────────────────────────────
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

// ─── Secret Pattern ─────────────────────────────────────
export interface SecretPattern {
  name: string;
  regex: RegExp;
  severity: Severity;
  suggestion: string;
}
