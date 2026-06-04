import { prisma } from './db';
import type { Tenant, TenantStatus } from '@prisma/client';

// ── In-memory LRU cache (slug → tenant, 10-min TTL) ─────────────────────────

interface CacheEntry {
  tenant: Tenant | null;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(slug: string): Tenant | null | undefined {
  const entry = cache.get(slug);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(slug);
    return undefined;
  }
  return entry.tenant;
}

function setCached(slug: string, tenant: Tenant | null) {
  cache.set(slug, { tenant, expiresAt: Date.now() + CACHE_TTL_MS });
}

export function invalidateTenantCache(slug: string) {
  cache.delete(slug);
}

export function invalidateAllTenantCache() {
  cache.clear();
}

// ── Subdomain extraction ─────────────────────────────────────────────────────

const BASE_DOMAIN = process.env.NEXT_PUBLIC_APP_URL
  ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
  : 'tasm-skill.asf.bd';

// Reserved subdomains that are NOT tenant slugs
const RESERVED_SUBDOMAINS = new Set(['www', 'saas-admin', 'api', 'mail', 'ftp', 'admin']);

export function extractSubdomain(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // localhost or IP → no subdomain
  if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null;

  // Strip the base domain to get the subdomain part
  const suffix = '.' + BASE_DOMAIN;
  if (!hostname.endsWith(suffix)) return null;

  const subdomain = hostname.slice(0, hostname.length - suffix.length);
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) return null;

  return subdomain;
}

// ── Tenant lookup ────────────────────────────────────────────────────────────

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const cached = getCached(slug);
  if (cached !== undefined) return cached;

  // Guard: prisma.tenant may be undefined during build or before migration
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!(prisma as any).tenant) {
    setCached(slug, null);
    return null;
  }

  try {
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    setCached(slug, tenant);
    return tenant;
  } catch {
    // Table may not exist yet (pre-migration local dev)
    setCached(slug, null);
    return null;
  }
}

export async function getTenantById(id: string): Promise<Tenant | null> {
  return prisma.tenant.findUnique({ where: { id } });
}

// ── Request helpers ──────────────────────────────────────────────────────────

/**
 * Extract tenant from x-tenant-id header (set by middleware).
 * Returns null if not set — callers decide how to handle.
 */
export function getTenantIdFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant-id');
}

export function getTenantSlugFromHeaders(headers: Headers): string | null {
  return headers.get('x-tenant-slug');
}

// ── Tenant status check ──────────────────────────────────────────────────────

export function isTenantActive(tenant: Tenant): boolean {
  return tenant.status === 'ACTIVE' || tenant.status === 'TRIAL';
}

// ── Default tenant fallback ──────────────────────────────────────────────────

const DEFAULT_TENANT_SLUG = 'tasm-skill';

export async function getDefaultTenant(): Promise<Tenant | null> {
  return getTenantBySlug(DEFAULT_TENANT_SLUG);
}

// ── All tenants (for SaaS admin) ─────────────────────────────────────────────

export async function getAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTenantStats(tenantId: string) {
  const [studentCount, teacherCount, batchCount, userCount] = await Promise.all([
    prisma.batchStudent.count({ where: { tenantId } }),
    prisma.teacher.count({ where: { tenantId } }),
    prisma.batch.count({ where: { tenantId } }),
    prisma.user.count({ where: { tenantId } }),
  ]);
  return { studentCount, teacherCount, batchCount, userCount };
}

export type { Tenant, TenantStatus };
