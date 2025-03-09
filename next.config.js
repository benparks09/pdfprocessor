/** @type {import('next').NextConfig} */
const nextConfig = {
  // Your configuration options here
  env: {
    // Add Mistral API key as a server-side environment variable
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  },
  // Optional: If you need to specify image domains for Mistral API
  images: {
    domains: ['api.mistral.ai'],
  }
};

module.exports = nextConfig; 