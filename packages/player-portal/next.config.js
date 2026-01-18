/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@defi-quest/core'],
    images: {
        domains: ['arweave.net', 'raw.githubusercontent.com'],
    },
};

module.exports = nextConfig;
