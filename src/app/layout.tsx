import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import { headers } from "next/headers";
import { getTenantBySlug } from "@/lib/tenant";
import MobileBottomNav from "@/components/ui/MobileBottomNav";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
    try {
        const headersList = await headers();
        const tenantSlug = headersList.get("x-tenant-slug") || "tasm-skill";
        const tenant = await getTenantBySlug(tenantSlug);
        return {
            title: tenant?.name || "Portal",
            description: tenant?.tagline || "Internal Portal",
        };
    } catch {
        return { title: "Portal", description: "Internal Portal" };
    }
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    let primaryColor = "#1a56db";
    let accentColor = "#f3f4f6";

    try {
        const headersList = await headers();
        const tenantSlug = headersList.get("x-tenant-slug") || "tasm-skill";
        const tenant = await getTenantBySlug(tenantSlug);
        if (tenant) {
            primaryColor = tenant.primaryColor;
            accentColor = tenant.accentColor;
        }
    } catch {
        // Fallback to defaults if tenant lookup fails (e.g. pre-migration dev env)
    }

    return (
        <html lang="bn" suppressHydrationWarning>
            <head>
                <style>{`
                    :root {
                        --tenant-primary: ${primaryColor};
                        --tenant-accent: ${accentColor};
                    }
                `}</style>
            </head>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
            >
                <AuthProvider>
                    <ConfirmProvider>
                        {children}
                        <MobileBottomNav />
                    </ConfirmProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
