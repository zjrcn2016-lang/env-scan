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
exports.checkGitExposure = checkGitExposure;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Check if .env files are tracked by git.
 * A critical issue — .env should never be committed to version control.
 */
function checkGitExposure(dir, envFiles) {
    const findings = [];
    // Check if we're in a git repo
    const gitDir = path.join(dir, '.git');
    if (!fs.existsSync(gitDir)) {
        return findings; // Not a git repo, skip
    }
    // Run git ls-files to see which .env files are tracked
    let trackedFiles = [];
    try {
        const output = (0, child_process_1.execSync)('git ls-files --cached', {
            cwd: dir,
            encoding: 'utf-8',
            timeout: 5000,
        });
        trackedFiles = output.trim().split('\n').filter(Boolean);
    }
    catch {
        // git command failed — might not be installed or not a repo
        return findings;
    }
    for (const envFile of envFiles) {
        const relativePath = path.relative(dir, envFile).replace(/\\/g, '/');
        const fileName = path.basename(envFile);
        // .env.example is a template — it SHOULD be committed to git
        if (fileName === '.env.example')
            continue;
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
    if (!hasEnv)
        return findings;
    const gitignorePath = path.join(dir, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        const hasEnvInIgnore = gitignoreContent.split('\n').some(line => line.trim() === '.env');
        if (!hasEnvInIgnore) {
            findings.push({
                rule: 'git-exposure',
                severity: 'medium',
                message: '.env is not in .gitignore — it might get committed accidentally',
                suggestion: 'Add ".env" to your .gitignore file',
            });
        }
    }
    else {
        findings.push({
            rule: 'git-exposure',
            severity: 'medium',
            message: 'No .gitignore found — .env may be committed accidentally',
            suggestion: 'Create a .gitignore file and add ".env" to it',
        });
    }
    return findings;
}
//# sourceMappingURL=git-exposure.js.map