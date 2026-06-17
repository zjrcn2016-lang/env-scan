"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.report = report;
exports.getExitCode = getExitCode;
exports.countSummary = countSummary;
const chalk_1 = __importDefault(require("chalk"));
const SEVERITY_CONFIG = {
    critical: { label: 'Critical', color: chalk_1.default.red, icon: '❌', exitCode: 1 },
    high: { label: 'High', color: chalk_1.default.yellow, icon: '⚠️ ', exitCode: 1 },
    medium: { label: 'Medium', color: chalk_1.default.cyan, icon: '○', exitCode: 0 },
    low: { label: 'Low', color: chalk_1.default.gray, icon: '  ', exitCode: 0 },
    info: { label: 'Info', color: chalk_1.default.dim, icon: 'ℹ️ ', exitCode: 0 },
};
const SEVERITY_BAR = {
    critical: chalk_1.default.red('🔴'),
    high: chalk_1.default.yellow('🟠'),
    medium: chalk_1.default.cyan('🟡'),
    low: chalk_1.default.gray('🟢'),
    info: chalk_1.default.dim('🔵'),
};
/**
 * Main reporter: renders scan results in the chosen format.
 * Returns the exit code (0 = clean, 1 = issues found).
 */
function report(result, format) {
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
function reportTerminal(result) {
    // Header
    console.log('');
    console.log(chalk_1.default.bold.white('env-scan v1.0.0'));
    console.log(chalk_1.default.dim(`   Scanned ${result.stats.totalFiles} files `) +
        chalk_1.default.dim(`(${result.stats.envFiles.length} env, ${result.stats.sourceFiles} source)`));
    if (result.findings.length === 0) {
        console.log(chalk_1.default.green('\n✨ No issues found. Your .env is clean!\n'));
        return 0;
    }
    // Group by severity
    const grouped = groupBySeverity(result.findings);
    for (const severity of ['critical', 'high', 'medium', 'low', 'info']) {
        const items = grouped.get(severity);
        if (!items || items.length === 0)
            continue;
        const cfg = SEVERITY_CONFIG[severity];
        console.log('');
        console.log(chalk_1.default.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
        console.log(chalk_1.default.bold(`  ${SEVERITY_BAR[severity]} ${cfg.color(severity.toUpperCase())} (${items.length})`));
        console.log(chalk_1.default.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
        for (const finding of items) {
            console.log('');
            console.log(`  ${cfg.icon}  ${cfg.color(finding.message)}`);
            if (finding.file) {
                const location = finding.line
                    ? chalk_1.default.dim(`  └─ ${finding.file}:${finding.line}`)
                    : chalk_1.default.dim(`  └─ ${finding.file}`);
                console.log(location);
            }
            if (finding.snippet) {
                console.log(chalk_1.default.dim(`     ${finding.snippet}`));
            }
            if (finding.suggestion) {
                console.log(chalk_1.default.green(`     💡 ${finding.suggestion}`));
            }
        }
    }
    // Summary
    console.log('');
    console.log(chalk_1.default.bold(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`));
    const parts = [];
    for (const severity of ['critical', 'high', 'medium', 'low']) {
        const count = result.summary[severity];
        if (count > 0) {
            parts.push(`${SEVERITY_BAR[severity]} ${count} ${severity}`);
        }
    }
    console.log(chalk_1.default.bold(`  📊 Summary: ${parts.join(' · ')}`));
    console.log('');
    // Exit code
    const hasBlocking = result.summary.critical > 0 || result.summary.high > 0;
    return hasBlocking ? 1 : 0;
}
// ─── JSON ──────────────────────────────────────────────────
function reportJson(result) {
    console.log(JSON.stringify(result, null, 2));
    return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}
// ─── Markdown ──────────────────────────────────────────────
function reportMarkdown(result) {
    console.log('# env-scan Report');
    console.log('');
    console.log(`**Files scanned:** ${result.stats.totalFiles} (${result.stats.envFiles.length} env, ${result.stats.sourceFiles} source)`);
    console.log('');
    if (result.findings.length === 0) {
        console.log('✅ **No issues found.** Your .env configuration is clean.');
        return 0;
    }
    const grouped = groupBySeverity(result.findings);
    for (const severity of ['critical', 'high', 'medium', 'low', 'info']) {
        const items = grouped.get(severity);
        if (!items || items.length === 0)
            continue;
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
    for (const severity of ['critical', 'high', 'medium', 'low']) {
        console.log(`| ${severity} | ${result.summary[severity]} |`);
    }
    console.log('');
    return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}
// ─── Helpers ───────────────────────────────────────────────
function groupBySeverity(findings) {
    const map = new Map();
    for (const f of findings) {
        const list = map.get(f.severity) || [];
        list.push(f);
        map.set(f.severity, list);
    }
    return map;
}
function getExitCode(result, strict) {
    if (strict) {
        return result.findings.length > 0 ? 1 : 0;
    }
    return result.summary.critical > 0 || result.summary.high > 0 ? 1 : 0;
}
function countSummary(findings) {
    const summary = {
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
//# sourceMappingURL=reporter.js.map