import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
                pathname: '/**',
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
        ],
    },
};

export default nextConfig;
