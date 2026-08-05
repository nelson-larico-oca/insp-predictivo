/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@sparticuz/chromium', 'puppeteer-core', 'puppeteer'],
    // @sparticuz/chromium's binary is loaded from disk at runtime, not required(),
    // so Next's file tracer won't pick it up on its own — force it in.
    outputFileTracingIncludes: {
      // `[id]` is glob syntax (character class) here, so it must be escaped
      // to match the literal dynamic-segment folder name.
      '/api/reportes/\\[id\\]/pdf': ['./node_modules/@sparticuz/chromium/bin/**'],
    },
  },
}
export default nextConfig
