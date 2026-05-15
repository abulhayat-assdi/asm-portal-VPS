import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    output: 'standalone',
    serverExternalPackages: ['@prisma/client', 'sharp'],
    experimental: {
        serverActions: {
            allowedOrigins: ['tasm-skill.asf.bd', 'www.tasm-skill.asf.bd', '*.tasm-skill.asf.bd'],
            bodySizeLimit: '100mb',
        },
    },
    images: {
        // Enable optimization with sharp
        minimumCacheTTL: 604800,        // Cache optimized images for 7 days
        formats: ['image/avif', 'image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
            { protocol: 'https', hostname: 'img.youtube.com', pathname: '/**' },
            { protocol: 'https', hostname: 'drive.google.com', pathname: '/**' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
            { protocol: 'https', hostname: 'tasm-skill.asf.bd', pathname: '/**' },
            { protocol: 'http', hostname: 'localhost', pathname: '/**' },
        ],
    },
};

export default nextConfig;
