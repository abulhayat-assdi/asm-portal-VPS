import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['@prisma/client'],
    experimental: {
        serverActions: {
            allowedOrigins: ['tasm-skill.asf.bd', 'www.tasm-skill.asf.bd', '*.tasm-skill.asf.bd'],
            bodySizeLimit: '100mb',
        },
    },
    images: {
        unoptimized: true,
        minimumCacheTTL: 86400,
        formats: ['image/avif', 'image/webp'],
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-**' },
            { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/premium_photo-**' },
            { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
            { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
        ],
    },
};

export default nextConfig;
