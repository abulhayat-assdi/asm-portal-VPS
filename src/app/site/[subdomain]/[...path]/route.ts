export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest } from "next/server";
import { GET as serveSite } from "@/app/api/deployments/serve-site/route";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ subdomain: string; path: string[] }> }
) {
    const { subdomain, path: pathSegments } = await params;
    const reqPath = "/" + (pathSegments ? pathSegments.join("/") : "index.html");
    const url = new URL(req.url);
    url.searchParams.set("subdomain", subdomain);
    url.searchParams.set("path", reqPath);
    const newReq = new NextRequest(url, req);
    return serveSite(newReq);
}
