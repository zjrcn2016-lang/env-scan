import { Finding, ParsedEnv } from '../types';

/**
 * Check for keys defined in .env.example that are missing from .env.
 */
export function checkMissingVars(envParsed: ParsedEnv | null, exampleParsed: ParsedEnv | null): Finding[] {
  const findings: Finding[] = [];

  if (!exampleParsed) {
    return findings; // Nothing to compare against
  }

  const envKeys = envParsed?.keys ?? new Set<string>();

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
