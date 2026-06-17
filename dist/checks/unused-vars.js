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
exports.checkUnusedVars = checkUnusedVars;
const fs = __importStar(require("fs"));
/**
 * Check for environment variables defined in .env that are never referenced
 * in any source file. These may be obsolete/dead configuration.
 */
function checkUnusedVars(envParsed, sourceFiles) {
    const findings = [];
    if (!envParsed) {
        return findings;
    }
    for (const key of envParsed.keys) {
        let used = false;
        for (const filePath of sourceFiles) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                // Look for process.env.KEY, env.KEY, import.meta.env.KEY, $KEY, ${KEY}, %KEY%
                if (content.includes(`process.env.${key}`) ||
                    content.includes(`env.${key}`) ||
                    content.includes(`import.meta.env.${key}`) ||
                    content.includes(`$${key}`) ||
                    content.includes(`$\{${key}}`) ||
                    content.includes(`%${key}%`)) {
                    used = true;
                    break;
                }
            }
            catch {
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
//# sourceMappingURL=unused-vars.js.map