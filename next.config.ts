import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Prevent these packages from being bundled for server-side rendering
    serverExternalPackages: ['firebase-admin', '@prisma/client', '@react-pdf/renderer', 'sharp', 'unzipper', 'cheerio'],
    experimental: {
        serverActions: {
            allowedOrigins: ['tasm-skill.asf.bd', 'www.tasm-skill.asf.bd', '*.tasm-skill.asf.bd', 'localhost:3000'],
            bodySizeLimit: '100mb',
        },
    },
    images: {
        minimumCacheTTL: 604800,
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com', pathname: '/**' },
            { protocol: 'https', hostname: 'firebasestorage.app', pathname: '/**' },
            { protocol: 'https', hostname: '**.firebasestorage.app', pathname: '/**' },
            { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
            { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
            { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
            { protocol: 'https', hostname: 'tasm-skill.asf.bd', pathname: '/**' },
            { protocol: 'http', hostname: 'localhost', pathname: '/**' },
        ],
    },
    async rewrites() {
        return [
            // Serve uploaded files through API route (standalone mode doesn't serve
            // runtime-written public/ files reliably as static assets)
            {
                source: '/uploads/:path*',
                destination: '/api/uploads/:path*',
            },
            {
                source: '/storage/public/:path*',
                destination: '/:path*',
            },
            {
                source: '/storage/private/homework/:path*',
                destination: '/homework/:path*',
            },
        ];
    },
};

export default nextConfig;
