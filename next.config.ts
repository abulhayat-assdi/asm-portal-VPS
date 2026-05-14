import type { NextConfig } from "next";

process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

const nextConfig: NextConfig = {
    output: 'standalone',
    // Prevent firebase-admin from being bundled — it uses Node.js native modules
    // that are incompatible with Next.js edge/server component bundling.
    serverExternalPackages: ['firebase-admin', '@prisma/client'],
    experimental: {
        serverActions: {
            allowedOrigins: ['tasm-skill.asf.bd', 'www.tasm-skill.asf.bd', '*.tasm-skill.asf.bd'],
            // Allow up to 100MB for server actions (homework file uploads)
            bodySizeLimit: '100mb',
        },
    },
    images: {
        unoptimized: true, // Disable image optimization for cPanel performance
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
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    async rewrites() {
        return [
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
    webpack: (config) => {
        config.externals.push({
            'prisma': 'commonjs prisma',
            '@prisma/client': 'commonjs @prisma/client',
        });
        return config;
    },
};

export default nextConfig;
