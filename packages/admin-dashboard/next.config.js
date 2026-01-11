/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@defi-quest/core'],
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

module.exports = nextConfig;
