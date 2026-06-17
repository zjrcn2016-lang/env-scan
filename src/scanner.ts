import * as fs from 'fs';
import * as path from 'path';
import ignore from 'ignore';

/**
 * Discover .env files and source files in a directory tree.
 * Respects .gitignore rules and skips common noise directories.
 */
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  '__pycache__', '.venv', 'venv', 'target', 'coverage',
  '.cache', '.turbo', '.yarn', 'vendor',
]);

const ENV_FILE_NAMES = new Set([
  '.env', '.env.example', '.env.local', '.env.development', '.env.production',
  '.env.test', '.env.staging',
]);

const SOURCE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.kt',
  '.yaml', '.yml', '.toml', '.json',
  '.sh', '.bash', '.zsh', '.envrc',
  '.cfg', '.conf', '.ini',
]);

interface ScannerResult {
  envFiles: string[];
  sourceFiles: string[];
}
/**
 * Scan a directory recursively, collecting .env files and source files.
 */
export function scanDirectory(dir: string, respectGitignore: boolean = true): ScannerResult {
  const envFiles: string[] = [];
  const sourceFiles: string[] = [];

  // Load .gitignore if available
  let ig: ReturnType<typeof ignore> | null = null;
  const gitignorePath = path.join(dir, '.gitignore');
  if (respectGitignore && fs.existsSync(gitignorePath)) {
    ig = ignore().add(fs.readFileSync(gitignorePath, 'utf-8'));
    // Always ignore .git directory
    ig.add('.git/');
  }

  walk(dir, dir, envFiles, sourceFiles, ig);

  return { envFiles, sourceFiles };
}

function walk(
  rootDir: string,
  currentDir: string,
  envFiles: string[],
  sourceFiles: string[],
  ig: ReturnType<typeof ignore> | null,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(currentDir, { withFileTypes: true });
  } catch {
    return; // Permission errors, etc.
  }

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    // Check gitignore
    if (ig && ig.ignores(relativePath + (entry.isDirectory() ? '/' : ''))) {
      continue;
    }

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (entry.name.startsWith('.')) continue; // skip hidden dirs except those in SKIP_DIRS
      walk(rootDir, fullPath, envFiles, sourceFiles, ig);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      const base = path.basename(entry.name);

      if (ENV_FILE_NAMES.has(base)) {
        envFiles.push(fullPath);
      } else if (SOURCE_EXTENSIONS.has(ext)) {
        sourceFiles.push(fullPath);
      }
    }
  }
}

/**
 * Check if a file is binary (vs text).
 * Quick check: read first 8KB and look for null bytes.
 */
export function isBinaryFile(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8192);
    const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  } catch {
    return true; // If we can't read, treat as binary (skip it)
  }
}

/**
 * Read a text file as lines.
 */
export function readFileLines(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n');
}
