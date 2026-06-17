"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMissingVars = checkMissingVars;
/**
 * Check for keys defined in .env.example that are missing from .env.
 */
function checkMissingVars(envParsed, exampleParsed) {
    const findings = [];
    if (!exampleParsed) {
        return findings; // Nothing to compare against
    }
    const envKeys = envParsed?.keys ?? new Set();
    for (const key of exampleParsed.keys) {
        if (!envKeys.has(key)) {
            // Look up the example value for context
            const entry = exampleParsed.entries.find(e => e.key === key);
            const context = entry ? ` (example: ${entry.value})` : '';
            findings.push({
                rule: 'missing-vars',
                severity: 'medium',
                message: `${key} is defined in ${exampleParsed.path} but missing from .env${context}`,
                file: exampleParsed.path,
                line: entry?.line,
                suggestion: `Add ${key}=<value> to your .env file`,
            });
        }
    }
    return findings;
}
//# sourceMappingURL=missing-vars.js.map