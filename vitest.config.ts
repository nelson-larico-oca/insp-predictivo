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
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
