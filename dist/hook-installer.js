"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.installHook = installHook;
exports.uninstallHook = uninstallHook;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const HOOK_MARKER = '# Installed by env-scan';
/**
 * Install a pre-commit git hook that runs env-scan before each commit.
 */
function installHook(projectDir, strict = false) {
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
            return 'env-scan hook is already installed.';
        }
        // Backup existing hook
        fs.writeFileSync(hookPath + '.backup', existingContent, { mode: 0o755 });
    }
    const strictFlag = strict ? ' --strict' : '';
    const hookScript = `#!/usr/bin/env bash
${HOOK_MARKER}
# Run env-scan before each commit
# To uninstall: npx env-scan --uninstall-hook
# To skip this check: set SKIP_ENVSCAN=1

if [ "$SKIP_ENVSCAN" = "1" ]; then
    echo "⚠️  env-scan check skipped (SKIP_ENVSCAN=1)"
    exit 0
fi

echo "🔍 env-scan: scanning for secrets and env issues..."
RESULT=$(npx env-scan --format json${strictFlag} 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ env-scan found critical issues"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "$RESULT" | npx env-scan --format terminal 2>/dev/null || echo "$RESULT"
    echo ""
    echo "Commit blocked. Fix the issues above or use SKIP_ENVSCAN=1 to bypass."
    exit 1
fi

echo "✅ env-scan: no issues found"
${existingContent ? `\n# Original pre-commit hook:\n${existingContent}` : ''}
`;
    fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });
    return `✓ Git pre-commit hook installed at ${hookPath}\n  Run 'git commit' as usual — env-scan will scan automatically.${strict ? '\n  Strict mode: medium/low issues will also block commits.' : ''}`;
}
/**
 * Uninstall the env-scan pre-commit hook.
 */
function uninstallHook(projectDir) {
    const hookPath = path.join(projectDir, '.git', 'hooks', 'pre-commit');
    if (!fs.existsSync(hookPath)) {
        return 'No pre-commit hook found.';
    }
    const content = fs.readFileSync(hookPath, 'utf-8');
    if (!content.includes(HOOK_MARKER)) {
        return 'The existing pre-commit hook was not installed by env-scan. Remove it manually if needed.';
    }
    // Check for backup
    const backupPath = hookPath + '.backup';
    if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, hookPath);
        fs.unlinkSync(backupPath);
    }
    else {
        fs.unlinkSync(hookPath);
    }
    return '✓ env-scan hook uninstalled. Original hook restored if backup existed.';
}
//# sourceMappingURL=hook-installer.js.map