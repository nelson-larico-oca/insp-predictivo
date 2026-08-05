import { defineConfig } from 'vitest/config'
import path from 'node:path'
import fs from 'node:fs'

const envPath = path.resolve(__dirname, '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const [, key, rawValue] = match
      process.env[key.trim()] = rawValue.trim().replace(/^"(.*)"$/, '$1')
    }
  }
}

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    // Integration tests share one Postgres database (Neon), so run them
    // sequentially to avoid cross-file races on create/cleanup.
    fileParallelism: false,
    // Neon can take a moment to wake a suspended connection, so allow more
    // headroom than vitest's 5s default.
    testTimeout: 20000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
