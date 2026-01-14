/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@defi-quest/core'],
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
