/**
 * In-memory one-time impersonation tokens।
 * Single VPS-এর জন্য যথেষ্ট। Multi-process setup হলে Redis-এ migrate করতে হবে।
 */
interface ImpersonationEntry {
    userId: string;
    tenantSlug: string;
    expiresAt: number;
}

const store = new Map<string, ImpersonationEntry>();
const TTL_MS = 5 * 60 * 1000; // 5 মিনিট

export function createImpersonationToken(userId: string, tenantSlug: string): string {
    // পুরনো expired entries পরিষ্কার করো
    const now = Date.now();
    for (const [key, entry] of store) {
        if (entry.expiresAt < now) store.delete(key);
    }

    const token = crypto.randomUUID();
    store.set(token, { userId, tenantSlug, expiresAt: now + TTL_MS });
    return token;
}

export function consumeImpersonationToken(token: string): ImpersonationEntry | null {
    const entry = store.get(token);
    if (!entry) return null;
    if (entry.expiresAt < Date.now()) {
        store.delete(token);
        return null;
    }
    store.delete(token); // one-time use
    return entry;
}
