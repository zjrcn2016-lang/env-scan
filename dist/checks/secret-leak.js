"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSecretLeak = checkSecretLeak;
const patterns_1 = require("../patterns");
const entropy_1 = require("../entropy");
const scanner_1 = require("../scanner");
/**
 * Scan source files for hardcoded secrets using three detection layers:
 *   1. Known service patterns (AWS, Stripe, GitHub, etc.)
 *   2. Keyword heuristics (SECRET=, TOKEN=, PASSWORD=, etc.)
 *   3. Shannon entropy analysis (random-looking strings)
 */
function checkSecretLeak(sourceFiles) {
    const findings = [];
    for (const filePath of sourceFiles) {
        if ((0, scanner_1.isBinaryFile)(filePath))
            continue;
        const lines = (0, scanner_1.readFileLines)(filePath);
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            // Skip comment lines
            const trimmed = line.trim();
            if (trimmed.startsWith('//') ||
                trimmed.startsWith('#') ||
                trimmed.startsWith('/*') ||
                trimmed.startsWith('*') ||
                trimmed.startsWith('<!--')) {
                continue;
            }
            // ── Layer 1: Known service patterns ──────────────
            for (const pattern of patterns_1.SECRET_PATTERNS) {
                // Reset regex lastIndex (global flag)
                pattern.regex.lastIndex = 0;
                const match = pattern.regex.exec(line);
                if (match) {
                    const snippet = maskSecret(line.trim(), match[0]);
                    findings.push({
                        rule: 'secret-leak',
                        severity: pattern.severity,
                        message: `${pattern.name} exposed: ${maskSecret(match[0])}`,
                        file: filePath,
                        line: lineNum + 1,
                        snippet,
                        suggestion: pattern.suggestion,
                    });
                }
            }
            // ── Layer 2: Keyword heuristics ──────────────────
            for (const kw of patterns_1.KEYWORD_PATTERNS) {
                kw.regex.lastIndex = 0;
                const match = kw.regex.exec(line);
                if (match) {
                    // Skip if already caught by Layer 1
                    const alreadyReported = findings.some(f => f.file === filePath && f.line === lineNum + 1);
                    if (alreadyReported)
                        continue;
                    findings.push({
                        rule: 'secret-leak',
                        severity: kw.severity,
                        message: `${kw.name} found`,
                        file: filePath,
                        line: lineNum + 1,
                        snippet: line.trim().slice(0, 120),
                        suggestion: kw.suggestion,
                    });
                }
            }
            // ── Layer 3: Entropy analysis ────────────────────
            // Extract potential string values from the line
            const stringMatches = line.matchAll(/["']([^"']{16,})["']/g);
            for (const sm of stringMatches) {
                const value = sm[1];
                const { isSecret, entropy } = (0, entropy_1.isHighEntropy)(value);
                if (isSecret) {
                    const alreadyReported = findings.some(f => f.file === filePath && f.line === lineNum + 1);
                    if (alreadyReported)
                        continue;
                    findings.push({
                        rule: 'secret-leak',
                        severity: 'high',
                        message: `High-entropy string detected (entropy: ${entropy.toFixed(2)}): ${maskSecret(value)}`,
                        file: filePath,
                        line: lineNum + 1,
                        snippet: line.trim().slice(0, 120),
                        suggestion: 'This looks like a randomly-generated secret. Move it to an environment variable.',
                    });
                }
            }
        }
    }
    // Don't flood — cap findings per file
    // Group and limit to prevent overwhelming output
    return limitFindingsPerFile(findings, 10);
}
/**
 * Mask a secret value for display: show first 4 and last 4 chars.
 */
function maskSecret(value, fullMatch) {
    const target = fullMatch || value;
    if (target.length <= 8)
        return '***';
    return target.slice(0, 4) + '...' + target.slice(-4);
}
/**
 * Limit findings per file to prevent overwhelming output.
 */
function limitFindingsPerFile(findings, maxPerFile) {
    const counts = new Map();
    return findings.filter(f => {
        const key = f.file || '';
        const count = counts.get(key) || 0;
        if (count >= maxPerFile)
            return false;
        counts.set(key, count + 1);
        return true;
    });
}
//# sourceMappingURL=secret-leak.js.map