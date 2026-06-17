import { Finding } from '../types';
/**
 * Check if .env files are tracked by git.
 * A critical issue — .env should never be committed to version control.
 */
export declare function checkGitExposure(dir: string, envFiles: string[]): Finding[];
//# sourceMappingURL=git-exposure.d.ts.map