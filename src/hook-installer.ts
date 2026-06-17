import * as fs from 'fs';
import * as path from 'path';

const HOOK_MARKER = '# Installed by EnvGuard';

/**
 * Install a pre-commit git hook that runs envguard before each commit.
 */
export function installHook(projectDir: string, strict: boolean = false): string {
  const gitDir = path.join(projectDir, '.git');
  if (!fs.existsSync(gitDir)) {
    return 'Error: No .git directory found. Run this command from the root of a git repository.';
  }

  const hooksDir = path.join(gitDir, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }

  const hookPath = path.join(hooksDir, 'pre-commit');

  // Check if there's an existing hook
  let existingContent = '';
  if (fs.existsSync(hookPath)) {
    existingContent = fs.readFileSync(hookPath, 'utf-8');
    if (existingContent.includes(HOOK_MARKER)) {
      return 'EnvGuard hook is already installed.';
    }
    // Backup existing hook
    fs.writeFileSync(hookPath + '.backup', existingContent, { mode: 0o755 });
  }

  const strictFlag = strict ? ' --strict' : '';
  const hookScript = `#!/usr/bin/env bash
${HOOK_MARKER}
# Run EnvGuard before each commit
# To uninstall: npx envguard --uninstall-hook
# To skip this check: set SKIP_ENVGUARD=1

if [ "$SKIP_ENVGUARD" = "1" ]; then
    echo "⚠️  EnvGuard check skipped (SKIP_ENVGUARD=1)"
    exit 0
fi

echo "🔍 EnvGuard: scanning for secrets and env issues..."
RESULT=$(npx envguard --format json${strictFlag} 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ EnvGuard found critical issues"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "$RESULT" | npx envguard --format terminal 2>/dev/null || echo "$RESULT"
    echo ""
    echo "Commit blocked. Fix the issues above or use SKIP_ENVGUARD=1 to bypass."
    exit 1
fi

echo "✅ EnvGuard: no issues found"
${existingContent ? `\n# Original pre-commit hook:\n${existingContent}` : ''}
`;

  fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });

  return `✓ Git pre-commit hook installed at ${hookPath}\n  Run 'git commit' as usual — EnvGuard will scan automatically.${strict ? '\n  Strict mode: medium/low issues will also block commits.' : ''}`;
}

/**
 * Uninstall the EnvGuard pre-commit hook.
 */
export function uninstallHook(projectDir: string): string {
  const hookPath = path.join(projectDir, '.git', 'hooks', 'pre-commit');

  if (!fs.existsSync(hookPath)) {
    return 'No pre-commit hook found.';
  }

  const content = fs.readFileSync(hookPath, 'utf-8');
  if (!content.includes(HOOK_MARKER)) {
    return 'The existing pre-commit hook was not installed by EnvGuard. Remove it manually if needed.';
  }

  // Check for backup
  const backupPath = hookPath + '.backup';
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, hookPath);
    fs.unlinkSync(backupPath);
  } else {
    fs.unlinkSync(hookPath);
  }

  return '✓ EnvGuard hook uninstalled. Original hook restored if backup existed.';
}
