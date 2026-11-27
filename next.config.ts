import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// The browser only talks to the UI's origin: Next proxies /api to the FastAPI server, so the
// session and CSRF cookies stay first-party. API_ORIGIN is the API's production domain on Vercel,
// and localhost in development.
// A trailing slash would make "//api/…", which Vercel redirects back onto the UI's own domain (a loop).
const API_ORIGIN = (process.env.API_ORIGIN ?? "http://localhost:8000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // The dev-tools badge defaults to bottom-left, on top of the sidebar's user menu.
  devIndicators: { position: "bottom-right" },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }];
  },
};

export default withNextIntl(nextConfig);
