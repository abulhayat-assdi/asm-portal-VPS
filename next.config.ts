import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    // Prevent firebase-admin from being bundled — it uses Node.js native modules
    // that are incompatible with Next.js edge/server component bundling.
    serverExternalPackages: ['firebase-admin'],
    images: {
        minimumCacheTTL: 86400, // Cache images for 24 hours
        formats: ['image/avif', 'image/webp'], // Auto-convert to smallest format
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.app',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: '**.firebasestorage.app',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/photo-**',
            },
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/premium_photo-**',
            },
            {
                protocol: 'https',
                hostname: 'img.youtube.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                port: '',
                pathname: '/uc**',
            },
            {
                protocol: 'https',
                hostname: 'drive.google.com',
                port: '',
                pathname: '/thumbnail**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
