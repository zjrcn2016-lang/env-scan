import { Finding, ParsedEnv } from '../types';

/**
 * Check for structural drift between .env and .env.example.
 * Drift = keys that exist in one file but not the other.
 */
export function checkDrift(envParsed: ParsedEnv | null, exampleParsed: ParsedEnv | null): Finding[] {
  const findings: Finding[] = [];

  if (!envParsed || !exampleParsed) {
    return findings; // Need both files to compare
  }

  const envKeys = envParsed.keys;
  const exampleKeys = exampleParsed.keys;

  // Keys in .env but NOT in .env.example
  const onlyInEnv = new Set([...envKeys].filter(k => !exampleKeys.has(k)));
  for (const key of onlyInEnv) {
    findings.push({
      rule: 'drift',
      severity: 'medium',
      message: `${key} is in ${envParsed.path} but not in ${exampleParsed.path}`,
      file: envParsed.path,
      suggestion: `Either add ${key} to .env.example as a documented variable, or remove it from .env if unused`,
    });
  }

  // Keys in .env.example but NOT in .env
  const onlyInExample = new Set([...exampleKeys].filter(k => !envKeys.has(k)));
  for (const key of onlyInExample) {
    findings.push({
      rule: 'drift',
      severity: 'medium',
      message: `${key} is in ${exampleParsed.path} but missing from ${envParsed.path}`,
      file: exampleParsed.path,
      suggestion: `Add ${key}=<value> to your .env file`,
    });
  }

  if (onlyInEnv.size === 0 && onlyInExample.size === 0) {
    findings.push({
      rule: 'drift',
      severity: 'info',
      message: '.env and .env.example are in sync',
    });
  }

  return findings;
}
