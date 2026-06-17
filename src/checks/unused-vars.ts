import * as fs from 'fs';
import { Finding, ParsedEnv } from '../types';

/**
 * Check for environment variables defined in .env that are never referenced
 * in any source file. These may be obsolete/dead configuration.
 */
export function checkUnusedVars(
  envParsed: ParsedEnv | null,
  sourceFiles: string[],
): Finding[] {
  const findings: Finding[] = [];

  if (!envParsed) {
    return findings;
  }

  for (const key of envParsed.keys) {
    let used = false;

    for (const filePath of sourceFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        // Look for process.env.KEY, env.KEY, import.meta.env.KEY, $KEY, ${KEY}, %KEY%
        if (
          content.includes(`process.env.${key}`) ||
          content.includes(`env.${key}`) ||
          content.includes(`import.meta.env.${key}`) ||
          content.includes(`$${key}`) ||
          content.includes(`$\{${key}}`) ||
          content.includes(`%${key}%`)
        ) {
          used = true;
          break;
        }
      } catch {
        // Skip unreadable files
        continue;
      }
    }

    if (!used) {
      const entry = envParsed.entries.find(e => e.key === key);
      findings.push({
        rule: 'unused-vars',
        severity: 'low',
        message: `${key} is defined in ${envParsed.path} but never referenced in source code`,
        file: envParsed.path,
        line: entry?.line,
        suggestion: `Remove ${key} from .env if it's no longer needed`,
      });
    }
  }

  return findings;
}
