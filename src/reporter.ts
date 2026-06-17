import chalk from 'chalk';
import { Finding, ScanResult, Severity } from './types';

const SEVERITY_CONFIG: Record<Severity, { label: string; color: (s: string) => string; icon: string; exitCode: number }> = {
  critical: { label: 'Critical', color: chalk.red, icon: '❌', exitCode: 1 },
  high:     { label: 'High',     color: chalk.yellow, icon: '⚠️ ', exitCode: 1 },
  medium:   { label: 'Medium',   color: chalk.cyan, icon: '○', exitCode: 0 },
  low:      { label: 'Low',      color: chalk.gray, icon: '  ', exitCode: 0 },
  info:     { label: 'Info',     color: chalk.dim, icon: 'ℹ️ ', exitCode: 0 },
};

const SEVERITY_BAR = {
  critical: chalk.red('🔴'),
  high: chalk.yellow('🟠'),
  medium: chalk.cyan('🟡'),
  low: chalk.gray('🟢'),
  info: chalk.dim('🔵'),
};

/**
 * Main reporter: renders scan results in the chosen format.
 * Returns the exit code (0 = clean, 1 = issues found).
 */
export function report(result: ScanResult, format: 'terminal' | 'json' | 'markdown'): number {
  switch (format) {
    case 'json':
      return reportJson(result);
    case 'markdown':
      return reportMarkdown(result);
    default:
      return reportTerminal(result);
  }
}

// ─── Terminal ──────────────────────────────────────────────

function reportTerminal(result: ScanResult): number {
  // Header
  console.log('');
  console.log(chalk.bold.white('env-scan v1.0.0'));
  console.log(
    chalk.dim(`   Scanned ${result.stats.totalFiles} files `) +
    chalk.dim(`(${result.stats.envFiles.length} env, ${result.stats.sourceFiles} source)`)
  );

  if (result.findings.length === 0) {
    console.log(chalk.green('\n✨ No issues found. Your .env is clean!\n'));
    return 0;
  }

  // Group by severity
  const grouped = groupBySeverity(result.findings);

  for (const severity of ['critical', 'high', 'medium', 'low', 'info'] as Severity[]) {
    const items = grouped.get(severity);
    if (!items || items.length === 0) continue;

    const cfg = SEVERITY_CONFIG[severity];
    console.log('');
    console.log(chalk.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    console.log(chalk.bold(`  ${SEVERITY_BAR[severity]} ${cfg.color(severity.toUpperCase())} (${items.length})`));
    console.log(chalk.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));

    for (const finding of items) {
      console.log('');
      console.log(`  ${cfg.icon}  ${cfg.color(finding.message)}`);

      if (finding.file) {
        const location = finding.line
          ? chalk.dim(`  └─ ${finding.file}:${finding.line}`)
          : chalk.dim(`  └─ ${finding.file}`);
        console.log(location);
      }

      if (finding.snippet) {
        console.log(chalk.dim(`     ${finding.snippet}`));
      }

      if (finding.suggestion) {
        console.log(chalk.green(`     💡 ${finding.suggestion}`));
      }
    }
  }

  // Summary
  console.log('');
  console.log(chalk.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
  const parts: string[] = [];
  for (const severity of ['critical', 'high', 'medium', 'low'] as Severity[]) {
    const count = result.summary[severity];
    if (count > 0) {
      parts.push(`${SEVERITY_BAR[severity]} ${count} ${severity}`);
    }
  }
  console.log(chalk.bold(`  📊 Summary: ${parts.join(' · ')}`));
  console.log('');

  // Exit code
  const hasBlocking = result.summary.critical > 0 || result.summary.high > 0;
  return hasBlocking ? 1 : 0;
}

// ─── JSON ──────────────────────────────────────────────────

function reportJson(result: ScanResult): number {
  console.log(JSON.stringify(result, null, 2));
  return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}

// ─── Markdown ──────────────────────────────────────────────

function reportMarkdown(result: ScanResult): number {
  console.log('# env-scan Report');
  console.log('');
  console.log(`**Files scanned:** ${result.stats.totalFiles} (${result.stats.envFiles.length} env, ${result.stats.sourceFiles} source)`);
  console.log('');

  if (result.findings.length === 0) {
    console.log('✅ **No issues found.** Your .env configuration is clean.');
    return 0;
  }

  const grouped = groupBySeverity(result.findings);

  for (const severity of ['critical', 'high', 'medium', 'low', 'info'] as Severity[]) {
    const items = grouped.get(severity);
    if (!items || items.length === 0) continue;

    const cfg = SEVERITY_CONFIG[severity];
    console.log(`## ${cfg.icon} ${severity.toUpperCase()} (${items.length})`);
    console.log('');

    for (const finding of items) {
      console.log(`- **${finding.message}**`);
      if (finding.file) {
        const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
        console.log(`  - 📁 \`${location}\``);
      }
      if (finding.snippet) {
        console.log(`  - 📝 \`${finding.snippet}\``);
      }
      if (finding.suggestion) {
        console.log(`  - 💡 ${finding.suggestion}`);
      }
      console.log('');
    }
  }

  // Summary table
  console.log('## 📊 Summary');
  console.log('');
  console.log('| Severity | Count |');
  console.log('|----------|-------|');
  for (const severity of ['critical', 'high', 'medium', 'low'] as Severity[]) {
    console.log(`| ${severity} | ${result.summary[severity]} |`);
  }
  console.log('');

  return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}

// ─── Helpers ───────────────────────────────────────────────

function groupBySeverity(findings: Finding[]): Map<Severity, Finding[]> {
  const map = new Map<Severity, Finding[]>();
  for (const f of findings) {
    const list = map.get(f.severity) || [];
    list.push(f);
    map.set(f.severity, list);
  }
  return map;
}

export function getExitCode(result: ScanResult, strict: boolean): number {
  if (strict) {
    return result.findings.length > 0 ? 1 : 0;
  }
  return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}

export function countSummary(findings: Finding[]): Record<Severity, number> {
  const summary: Record<Severity, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const f of findings) {
    summary[f.severity] = (summary[f.severity] || 0) + 1;
  }
  return summary;
}
