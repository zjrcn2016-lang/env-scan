/**
 * Shannon entropy calculator for detecting high-entropy strings
 * (likely random-generated secrets, tokens, or keys).
 *
 * Entropy > 4.5 typically indicates a random/encrypted string.
 */

/**
 * Calculate the Shannon entropy of a string.
 * Returns a value between 0 (all same character) and ~6 (completely random printable ASCII).
 */
export function shannonEntropy(str: string): number {
  if (str.length === 0) return 0;

  const charCounts = new Map<string, number>();
  for (const char of str) {
    charCounts.set(char, (charCounts.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of charCounts.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}

/**
 * Check if a string looks like a high-entropy secret.
 * Thresholds tuned for common token formats:
 *   - > 4.5: very high entropy (random hex/base64 tokens)
 *   - > 3.8: moderate entropy (could be a token)
 */
export function isHighEntropy(str: string): { isSecret: boolean; entropy: number } {
  const entropy = shannonEntropy(str);

  // Skip strings that are too short to be meaningful
  if (str.length < 16) {
    return { isSecret: false, entropy };
  }

  // Skip known non-secret high-entropy patterns
  if (isFalsePositive(str)) {
    return { isSecret: false, entropy };
  }

  return {
    isSecret: entropy > 4.5,
    entropy,
  };
}

/**
 * Common false positives: UUIDs, hashes, natural language text, etc.
 */
function isFalsePositive(str: string): boolean {
  // UUID pattern (with or without dashes)
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(str)) {
    return true;
  }

  // SHA hashes (40-64 hex chars)
  if (/^[0-9a-f]{40,64}$/i.test(str)) {
    return true;
  }

  // MD5 hash
  if (/^[0-9a-f]{32}$/i.test(str)) {
    return true;
  }

  // Semver strings
  if (/^\d+\.\d+\.\d+/.test(str)) {
    return true;
  }

  // URLs — can have high entropy due to path/query variety, but are not secrets
  if (/^https?:\/\//i.test(str)) {
    return true;
  }

  // Natural language text — real secrets (API keys, tokens, passwords)
  // never contain spaces. If the string has any spaces at all, it's a message,
  // log line, SQL query, HTML/JSON snippet, stack trace, etc.
  if (str.includes(' ')) {
    return true;
  }

  // File paths — contain multiple path segments with slashes
  if (isFilePath(str)) {
    return true;
  }

  // CJK and other non-Latin natural language text
  // Secrets/tokens are always ASCII (base64, hex, alphanumeric).
  // If more than 5% of characters are in non-ASCII ranges, it's likely human language.
  if (hasNaturalLanguageChars(str)) {
    return true;
  }

  return false;
}

/**
 * Detect file paths. Real secrets don't look like filesystem paths.
 * Matches patterns like:
 *   /usr/local/bin/..., /home/user/..., ./relative/..., ../parent/...
 *   C:\Users\..., \\server\share\...
 */
function isFilePath(str: string): boolean {
  // Unix absolute or relative paths with at least 2 segments
  if (/^(?:\/|\.\.?\/)[^\/]+\/[^\/]/.test(str)) {
    return true;
  }
  // Windows paths
  if (/^[A-Za-z]:\\[^\\]+\\[^\\]/.test(str)) {
    return true;
  }
  // UNC paths
  if (/^\\\\[^\\]+\\[^\\]/.test(str)) {
    return true;
  }
  return false;
}

/**
 * Check if a string contains natural language characters (CJK, Cyrillic, Arabic, etc.)
 * that would never appear in a real secret/token.
 */
function hasNaturalLanguageChars(str: string): boolean {
  let nonAscii = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0)!;
    if (code > 0x7F) {
      nonAscii++;
    }
  }
  // If more than 5% of chars are non-ASCII, treat as natural language
  return nonAscii > 0 && nonAscii / str.length > 0.05;
}
