/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["circomlibjs", "ffjavascript", "web-worker"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent server-side bundling of wasm/worker packages
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : [config.externals].filter(Boolean)),
        "circomlibjs",
        "ffjavascript",
        "web-worker",
      ];
    }
    // Suppress the critical dependency warning from web-worker
    config.module = config.module ?? {};
    config.module.exprContextCritical = false;
    return config;
  },
};

export default nextConfig;
