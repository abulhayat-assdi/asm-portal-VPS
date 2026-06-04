export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, isSaasOwner } from '@/lib/auth';

/** GET /api/saas/auth/verify — check if the current user is the SaaS owner */
export async function GET(req: NextRequest) {
    const user = await getSessionUser(req);
    if (!user) {
        return NextResponse.json({ isSaasOwner: false, error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({
        isSaasOwner: isSaasOwner(user),
        email: user.email,
        displayName: user.displayName,
    });
}
