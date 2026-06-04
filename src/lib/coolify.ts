/**
 * Coolify API helper — নতুন tenant subdomain রেজিস্টার করে।
 * Traefik HTTP-01 challenge দিয়ে SSL cert আপনাআপনি ইস্যু করে।
 */

const COOLIFY_API_URL  = process.env.COOLIFY_API_URL  || '';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN || '';
const COOLIFY_APP_UUID  = process.env.COOLIFY_APP_UUID  || '';

/** Coolify app-এ নতুন domain যোগ করো। Error হলে log করো, throw করো না। */
export async function registerSubdomainInCoolify(slug: string): Promise<void> {
    if (!COOLIFY_API_URL || !COOLIFY_API_TOKEN || !COOLIFY_APP_UUID) {
        console.warn('[Coolify] API credentials not configured — skipping domain registration.');
        return;
    }

    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'tasm-skill.asf.bd';
    const newDomain = `https://${slug}.${baseDomain}`;

    try {
        // 1. Current domains পড়ো
        const getRes = await fetch(`${COOLIFY_API_URL}/api/v1/applications/${COOLIFY_APP_UUID}`, {
            headers: { Authorization: `Bearer ${COOLIFY_API_TOKEN}`, Accept: 'application/json' },
        });

        if (!getRes.ok) {
            console.error('[Coolify] Failed to fetch app info:', await getRes.text());
            return;
        }

        const app = await getRes.json();
        const currentFqdn: string = app.fqdn || '';
        const domains = currentFqdn ? currentFqdn.split(',').map((d: string) => d.trim()) : [];

        if (domains.includes(newDomain)) {
            console.log(`[Coolify] Domain already registered: ${newDomain}`);
            return;
        }

        // 2. নতুন domain যোগ করো
        domains.push(newDomain);
        const updatedFqdn = domains.join(',');

        const patchRes = await fetch(`${COOLIFY_API_URL}/api/v1/applications/${COOLIFY_APP_UUID}`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${COOLIFY_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fqdn: updatedFqdn }),
        });

        if (!patchRes.ok) {
            console.error('[Coolify] Failed to update domains:', await patchRes.text());
            return;
        }

        console.log(`[Coolify] Domain registered: ${newDomain}`);
    } catch (err) {
        console.error('[Coolify] Error registering domain:', err);
    }
}
