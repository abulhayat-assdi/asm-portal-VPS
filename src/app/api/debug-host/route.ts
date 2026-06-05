export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => { headers[key] = value; });

    return NextResponse.json({
        url: req.url,
        host: req.headers.get('host'),
        xForwardedHost: req.headers.get('x-forwarded-host'),
        xRealIp: req.headers.get('x-real-ip'),
        xForwardedFor: req.headers.get('x-forwarded-for'),
        allHeaders: headers,
    });
}
