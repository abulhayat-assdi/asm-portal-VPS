import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ConfirmProvider } from "@/contexts/ConfirmContext";
import MobileBottomNav from "@/components/ui/MobileBottomNav";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Portal",
    description: "Internal Portal",
};

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="bn" suppressHydrationWarning>
            <head>
                <style>{`
                    :root {
                        --tenant-primary: #1a56db;
                        --tenant-accent: #f3f4f6;
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
