import type { NextConfig } from "next";

// ── Security headers ──────────────────────────────────────────────────────────
// Sent on every response. The CSP only sets the directives that cannot break the
// site (no script-src yet: a nonce-based script policy comes with user login).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // Widgets use fullscreen and clipboard (left at their defaults); nothing else.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // ── The courses moved to From Scratch Lab (2026-10-18) ──────────────────────
  // Same paths there, without the /learn prefix (query strings, like the old
  // ?chapter= links, are passed along and handled by that site). permanent =
  // 308, which search engines treat as a permanent move.
  async redirects() {
    const LEARN = "https://www.fromscratchlab.com";
    return [
      { source: "/learn", destination: LEARN, permanent: true },
      { source: "/learn/:path*", destination: `${LEARN}/:path*`, permanent: true },
      { source: "/pt/learn", destination: `${LEARN}/pt`, permanent: true },
      { source: "/pt/learn/:path*", destination: `${LEARN}/pt/:path*`, permanent: true },
    ];
  },
};

export default nextConfig;
