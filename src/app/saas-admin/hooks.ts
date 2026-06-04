"use client";

import { useEffect, useState } from "react";

function isAdminSubdomain(): boolean {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname;
    const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || "tasm-skill.asf.bd";
    return hostname === `admin.${baseDomain}` || hostname === "admin.localhost";
}

export function useAdminBasePath() {
    const [base, setBase] = useState("/saas-admin");
    useEffect(() => {
        setBase(isAdminSubdomain() ? "" : "/saas-admin");
    }, []);
    return base;
}
