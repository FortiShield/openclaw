/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for development to catch potential issues
  reactStrictMode: true,

  // Optimize for production
  productionBrowserSourceMaps: false,

  // Enable compression for static assets
  compress: true,

  // Poweredby header disabled for security
  poweredByHeader: false,

  // Security headers
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },

  // Redirects for old URLs or maintenance
  redirects: async () => {
    return [];
  },

  // Rewrites for API routes
  rewrites: async () => {
    return {
      beforeFiles: [],
    };
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "2.0.0-beta1",
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        // Minimize bundle size
        usedExports: true,
        sideEffects: false,
      };
    }
    return config;
  },

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
};

export default nextConfig;
