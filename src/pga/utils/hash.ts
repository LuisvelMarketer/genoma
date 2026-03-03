/**
 * Hash Utilities
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

import * as crypto from 'crypto';

/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
    return crypto.randomUUID();
}

/**
 * Generate SHA-256 hash
 */
export function sha256(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

/**
 * Generate a short hash for display
 */
export function shortHash(content: string, length: number = 8): string {
    return sha256(content).substring(0, length);
}

/**
 * Generate a deterministic ID from content
 */
export function contentId(content: string): string {
    return `pga_${shortHash(content, 12)}`;
}
