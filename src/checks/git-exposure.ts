import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { Finding } from '../types';

/**
 * Check if .env files are tracked by git.
 * A critical issue — .env should never be committed to version control.
 */
export function checkGitExposure(dir: string, envFiles: string[]): Finding[] {
  const findings: Finding[] = [];

  // Check if we're in a git repo
  const gitDir = path.join(dir, '.git');
  if (!fs.existsSync(gitDir)) {
    return findings; // Not a git repo, skip
  }

  // Run git ls-files to see which .env files are tracked
  let trackedFiles: string[] = [];
  try {
    const output = execSync('git ls-files --cached', {
      cwd: dir,
      encoding: 'utf-8',
      timeout: 5000,
    });
    trackedFiles = output.trim().split('\n').filter(Boolean);
  } catch {
    // git command failed — might not be installed or not a repo
    return findings;
  }

  for (const envFile of envFiles) {
    const relativePath = path.relative(dir, envFile).replace(/\\/g, '/');
    const fileName = path.basename(envFile);

    // .env.example is a template — it SHOULD be committed to git
    if (fileName === '.env.example') continue;

    if (trackedFiles.includes(relativePath)) {
      const suggestion = fileName === '.env'
        ? `Run: git rm --cached ${relativePath} && echo "${relativePath}" >> .gitignore`
        : `Run: git rm --cached ${relativePath} && echo "${relativePath}" >> .gitignore`;

      findings.push({
        rule: 'git-exposure',
        severity: 'critical',
        message: `${relativePath} is tracked by git`,
        file: envFile,
        suggestion,
      });
    }
  }

  // Also check .gitignore: does it have .env covered?
  // Only relevant if an actual .env file exists (not just .env.example)
  const hasEnv = envFiles.some(f => path.basename(f) === '.env');
  if (!hasEnv) return findings;

  const gitignorePath = path.join(dir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    const hasEnvInIgnore = gitignoreContent.split('\n').some(
      line => line.trim() === '.env'
    );

    if (!hasEnvInIgnore) {
      findings.push({
        rule: 'git-exposure',
        severity: 'medium',
        message: '.env is not in .gitignore — it might get committed accidentally',
        suggestion: 'Add ".env" to your .gitignore file',
      });
    }
  } else {
    findings.push({
      rule: 'git-exposure',
      severity: 'medium',
      message: 'No .gitignore found — .env may be committed accidentally',
      suggestion: 'Create a .gitignore file and add ".env" to it',
    });
  }

  return findings;
}
