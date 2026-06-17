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
exports.parseEnvFile = parseEnvFile;
exports.findEnvFiles = findEnvFiles;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Parse a .env file into structured entries.
 * Handles: comments (#), inline comments, quotes, export prefix, empty lines.
 */
function parseEnvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const entries = [];
    const keys = new Set();
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
        if (eqIdx === -1)
            continue;
        const key = line.slice(0, eqIdx).trim();
        // Validate key: alphanumeric + underscore, cannot start with digit
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key))
            continue;
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
function findEnvFiles(dir) {
    const result = {};
    const candidates = ['.env', '.env.example', '.env.local', '.env.development', '.env.production'];
    for (const name of candidates) {
        const fullPath = path.join(dir, name);
        if (fs.existsSync(fullPath)) {
            if (name === '.env')
                result.env = fullPath;
            else if (name === '.env.example')
                result.example = fullPath;
        }
    }
    return result;
}
//# sourceMappingURL=parser.js.map