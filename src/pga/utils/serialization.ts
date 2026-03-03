/**
 * Serialization Utilities
 *
 * @author DeepAgent
 * @since 2026-03-03
 */

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Serialize an object with sorted keys (deterministic)
 */
export function serializeDeterministic(obj: unknown): string {
    return JSON.stringify(sortKeys(obj));
}

/**
 * Sort object keys recursively
 */
function sortKeys(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortKeys);
    }

    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as Record<string, unknown>).sort();

    for (const key of keys) {
        sorted[key] = sortKeys((obj as Record<string, unknown>)[key]);
    }

    return sorted;
}

/**
 * Safe JSON parse with default
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
        return JSON.parse(json) as T;
    } catch {
        return defaultValue;
    }
}

/**
 * Compress JSON for storage
 */
export function compressJson(obj: unknown): string {
    return JSON.stringify(obj);
}

/**
 * Decompress JSON from storage
 */
export function decompressJson<T>(json: string): T {
    return JSON.parse(json);
}
