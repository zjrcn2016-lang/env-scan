import * as fs from 'fs';
import * as path from 'path';
import { EnvEntry, ParsedEnv } from './types';

/**
 * Parse a .env file into structured entries.
 * Handles: comments (#), inline comments, quotes, export prefix, empty lines.
 */
export function parseEnvFile(filePath: string): ParsedEnv {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries: EnvEntry[] = [];
  const keys = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines and full-line comments
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    // Remove export prefix if present
    let line = trimmed;
    if (line.startsWith('export ')) {
      line = line.slice(7).trim();
    }

    // Must have an = sign
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;

    const key = line.slice(0, eqIdx).trim();
    // Validate key: alphanumeric + underscore, cannot start with digit
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    let value = line.slice(eqIdx + 1).trim();

    // Remove inline comments (only outside quotes)
    const quoteChar = value[0] === '"' || value[0] === "'" ? value[0] : null;
    if (!quoteChar) {
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx).trim();
      }
    }

    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    entries.push({
      key,
      value,
      line: i + 1,
      raw,
      commented: false,
    });
    keys.add(key);
  }

  return {
    path: filePath,
    entries,
    keys,
  };
}

/**
 * Find all .env files in a given directory (non-recursive — env files live at project root)
 */
export function findEnvFiles(dir: string): { env?: string; example?: string } {
  const result: { env?: string; example?: string } = {};
  const candidates = ['.env', '.env.example', '.env.local', '.env.development', '.env.production'];

  for (const name of candidates) {
    const fullPath = path.join(dir, name);
    if (fs.existsSync(fullPath)) {
      if (name === '.env') result.env = fullPath;
      else if (name === '.env.example') result.example = fullPath;
    }
  }

  return result;
}
