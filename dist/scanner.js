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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanDirectory = scanDirectory;
exports.isBinaryFile = isBinaryFile;
exports.readFileLines = readFileLines;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ignore_1 = __importDefault(require("ignore"));
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
/**
 * Scan a directory recursively, collecting .env files and source files.
 */
function scanDirectory(dir, respectGitignore = true) {
    const envFiles = [];
    const sourceFiles = [];
    // Load .gitignore if available
    let ig = null;
    const gitignorePath = path.join(dir, '.gitignore');
    if (respectGitignore && fs.existsSync(gitignorePath)) {
        ig = (0, ignore_1.default)().add(fs.readFileSync(gitignorePath, 'utf-8'));
        // Always ignore .git directory
        ig.add('.git/');
    }
    walk(dir, dir, envFiles, sourceFiles, ig);
    return { envFiles, sourceFiles };
}
function walk(rootDir, currentDir, envFiles, sourceFiles, ig) {
    let entries;
    try {
        entries = fs.readdirSync(currentDir, { withFileTypes: true });
    }
    catch {
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
            if (SKIP_DIRS.has(entry.name))
                continue;
            if (entry.name.startsWith('.'))
                continue; // skip hidden dirs except those in SKIP_DIRS
            walk(rootDir, fullPath, envFiles, sourceFiles, ig);
        }
        else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            const base = path.basename(entry.name);
            if (ENV_FILE_NAMES.has(base)) {
                envFiles.push(fullPath);
            }
            else if (SOURCE_EXTENSIONS.has(ext)) {
                sourceFiles.push(fullPath);
            }
        }
    }
}
/**
 * Check if a file is binary (vs text).
 * Quick check: read first 8KB and look for null bytes.
 */
function isBinaryFile(filePath) {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8192);
        const bytesRead = fs.readSync(fd, buffer, 0, 8192, 0);
        fs.closeSync(fd);
        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0)
                return true;
        }
        return false;
    }
    catch {
        return true; // If we can't read, treat as binary (skip it)
    }
}
/**
 * Read a text file as lines.
 */
function readFileLines(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n');
}
//# sourceMappingURL=scanner.js.map