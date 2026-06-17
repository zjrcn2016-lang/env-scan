#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { scanDirectory } from './scanner';
import { parseEnvFile, findEnvFiles } from './parser';
import { checkGitExposure } from './checks/git-exposure';
import { checkDrift } from './checks/drift';
import { checkMissingVars } from './checks/missing-vars';
import { checkUnusedVars } from './checks/unused-vars';
import { checkSecretLeak } from './checks/secret-leak';
import { installHook, uninstallHook } from './hook-installer';
import { report, getExitCode, countSummary } from './reporter';
import {
  CheckName,
  Finding,
  OutputFormat,
  ScanConfig,
  ScanResult,
  Severity,
} from './types';

const program = new Command();

program
  .name('envguard')
  .description('🔍 Security linter for .env files — catch leaked secrets, missing variables, and env drift')
  .version('1.0.0')
  .argument('[directory]', 'Target directory to scan', '.')
  .option('-a, --all', 'Run all checks (default)')
  .option('-s, --secrets', 'Check for hardcoded secrets in source files')
  .option('-g, --git-exposed', 'Check if .env files are tracked by git')
  .option('-m, --missing', 'Check for variables missing from .env')
  .option('-u, --unused', 'Check for unused environment variables')
  .option('-d, --drift', 'Check .env and .env.example for drift')
  .option('-f, --format <type>', 'Output format: terminal (default), json, markdown', 'terminal')
  .option('--severity <level>', 'Minimum severity: critical, high, medium, low, info', 'low')
  .option('--no-ignore', 'Do not respect .gitignore')
  .option('--install-hook', 'Install pre-commit git hook')
  .option('--uninstall-hook', 'Uninstall pre-commit git hook')
  .option('--strict', 'Strict mode: treat medium/low issues as blocking (for hooks)')
  .action(async (directory: string, options: Record<string, any>) => {
    const projectDir = path.resolve(directory);

    // ── Hook management ──────────────────────────────────
    if (options.installHook) {
      const result = installHook(projectDir, options.strict || false);
      console.log(result);
      process.exit(0);
    }

    if (options.uninstallHook) {
      const result = uninstallHook(projectDir);
      console.log(result);
      process.exit(0);
    }

    // ── Build config ─────────────────────────────────────
    const checks = resolveChecks(options);
    const config: ScanConfig = {
      directory: projectDir,
      checks,
      severity: options.severity as Severity,
      respectGitignore: options.ignore !== false,
      format: options.format as OutputFormat,
      strict: options.strict || false,
    };

    // ── Scan ─────────────────────────────────────────────
    const { envFiles, sourceFiles } = scanDirectory(projectDir, config.respectGitignore);

    const findings: Finding[] = [];

    // Parse .env files
    const { env, example } = findEnvFiles(projectDir);
    const envParsed = env ? parseEnvFile(env) : null;
    const exampleParsed = example ? parseEnvFile(example) : null;

    // Run selected checks
    for (const check of config.checks) {
      switch (check) {
        case 'git-exposure':
          findings.push(...checkGitExposure(projectDir, envFiles));
          break;
        case 'secret-leak':
          findings.push(...checkSecretLeak(sourceFiles));
          break;
        case 'drift':
          findings.push(...checkDrift(envParsed, exampleParsed));
          break;
        case 'missing-vars':
          findings.push(...checkMissingVars(envParsed, exampleParsed));
          break;
        case 'unused-vars':
          findings.push(...checkUnusedVars(envParsed, sourceFiles));
          break;
      }
    }

    // Filter by minimum severity
    const filteredFindings = filterBySeverity(findings, config.severity);

    // Build result
    const result: ScanResult = {
      findings: filteredFindings,
      stats: {
        totalFiles: envFiles.length + sourceFiles.length,
        envFiles,
        sourceFiles: sourceFiles.length,
        errors: 0,
      },
      summary: countSummary(filteredFindings),
    };

    // ── Report ───────────────────────────────────────────
    const exitCode = getExitCode(result, config.strict);
    const reportExitCode = report(result, config.format);

    process.exit(config.strict ? exitCode : reportExitCode);
  });

/**
 * Determine which checks to run based on CLI flags.
 * Default: all checks.
 */
function resolveChecks(options: Record<string, any>): CheckName[] {
  const specificChecks: CheckName[] = [];

  if (options.secrets) specificChecks.push('secret-leak');
  if (options.gitExposed) specificChecks.push('git-exposure');
  if (options.missing) specificChecks.push('missing-vars');
  if (options.unused) specificChecks.push('unused-vars');
  if (options.drift) specificChecks.push('drift');

  if (specificChecks.length > 0) {
    return specificChecks;
  }

  // Default: all checks
  return ['git-exposure', 'secret-leak', 'drift', 'missing-vars', 'unused-vars'];
}

/**
 * Filter findings to only include those at or above the minimum severity.
 */
function filterBySeverity(findings: Finding[], minSeverity: Severity): Finding[] {
  const order: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];
  const minIdx = order.indexOf(minSeverity);
  return findings.filter(f => order.indexOf(f.severity) <= minIdx);
}

program.parse();
