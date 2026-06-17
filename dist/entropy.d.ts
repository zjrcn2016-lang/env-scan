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
export declare function shannonEntropy(str: string): number;
/**
 * Check if a string looks like a high-entropy secret.
 * Thresholds tuned for common token formats:
 *   - > 4.5: very high entropy (random hex/base64 tokens)
 *   - > 3.8: moderate entropy (could be a token)
 */
export declare function isHighEntropy(str: string): {
    isSecret: boolean;
    entropy: number;
};
//# sourceMappingURL=entropy.d.ts.map