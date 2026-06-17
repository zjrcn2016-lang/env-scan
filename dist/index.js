#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const scanner_1 = require("./scanner");
const parser_1 = require("./parser");
const git_exposure_1 = require("./checks/git-exposure");
const drift_1 = require("./checks/drift");
const missing_vars_1 = require("./checks/missing-vars");
const unused_vars_1 = require("./checks/unused-vars");
const secret_leak_1 = require("./checks/secret-leak");
const hook_installer_1 = require("./hook-installer");
const reporter_1 = require("./reporter");
const program = new commander_1.Command();
program
    .name('env-scan')
    .description('Security linter for .env files — catch leaked secrets, missing variables, and env drift')
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
    .action(async (directory, options) => {
    const projectDir = path.resolve(directory);
    // ── Hook management ──────────────────────────────────
    if (options.installHook) {
        const result = (0, hook_installer_1.installHook)(projectDir, options.strict || false);
        console.log(result);
        process.exit(0);
    }
    if (options.uninstallHook) {
        const result = (0, hook_installer_1.uninstallHook)(projectDir);
        console.log(result);
        process.exit(0);
    }
    // ── Build config ─────────────────────────────────────
    const checks = resolveChecks(options);
    const config = {
        directory: projectDir,
        checks,
        severity: options.severity,
        respectGitignore: options.ignore !== false,
        format: options.format,
        strict: options.strict || false,
    };
    // ── Scan ─────────────────────────────────────────────
    const { envFiles, sourceFiles } = (0, scanner_1.scanDirectory)(projectDir, config.respectGitignore);
    const findings = [];
    // Parse .env files
    const { env, example } = (0, parser_1.findEnvFiles)(projectDir);
    const envParsed = env ? (0, parser_1.parseEnvFile)(env) : null;
    const exampleParsed = example ? (0, parser_1.parseEnvFile)(example) : null;
    // Run selected checks
    for (const check of config.checks) {
        switch (check) {
            case 'git-exposure':
                findings.push(...(0, git_exposure_1.checkGitExposure)(projectDir, envFiles));
                break;
            case 'secret-leak':
                findings.push(...(0, secret_leak_1.checkSecretLeak)(sourceFiles));
                break;
            case 'drift':
                findings.push(...(0, drift_1.checkDrift)(envParsed, exampleParsed));
                break;
            case 'missing-vars':
                findings.push(...(0, missing_vars_1.checkMissingVars)(envParsed, exampleParsed));
                break;
            case 'unused-vars':
                findings.push(...(0, unused_vars_1.checkUnusedVars)(envParsed, sourceFiles));
                break;
        }
    }
    // Filter by minimum severity
    const filteredFindings = filterBySeverity(findings, config.severity);
    // Build result
    const result = {
        findings: filteredFindings,
        stats: {
            totalFiles: envFiles.length + sourceFiles.length,
            envFiles,
            sourceFiles: sourceFiles.length,
            errors: 0,
        },
        summary: (0, reporter_1.countSummary)(filteredFindings),
    };
    // ── Report ───────────────────────────────────────────
    const exitCode = (0, reporter_1.getExitCode)(result, config.strict);
    const reportExitCode = (0, reporter_1.report)(result, config.format);
    process.exit(config.strict ? exitCode : reportExitCode);
});
/**
 * Determine which checks to run based on CLI flags.
 * Default: all checks.
 */
function resolveChecks(options) {
    const specificChecks = [];
    if (options.secrets)
        specificChecks.push('secret-leak');
    if (options.gitExposed)
        specificChecks.push('git-exposure');
    if (options.missing)
        specificChecks.push('missing-vars');
    if (options.unused)
        specificChecks.push('unused-vars');
    if (options.drift)
        specificChecks.push('drift');
    if (specificChecks.length > 0) {
        return specificChecks;
    }
    // Default: all checks
    return ['git-exposure', 'secret-leak', 'drift', 'missing-vars', 'unused-vars'];
}
/**
 * Filter findings to only include those at or above the minimum severity.
 */
function filterBySeverity(findings, minSeverity) {
    const order = ['critical', 'high', 'medium', 'low', 'info'];
    const minIdx = order.indexOf(minSeverity);
    return findings.filter(f => order.indexOf(f.severity) <= minIdx);
}
program.parse();
//# sourceMappingURL=index.js.map