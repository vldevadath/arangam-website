import { copyFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves the site from /<repo>/, so the build needs a base path.
// The deploy workflow sets VITE_BASE; local dev and Netlify stay at the root.
const base = process.env.VITE_BASE ?? '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    {
      // Pages has no redirect rules, but it does serve 404.html for any
      // unknown path — so an identical copy of the app resolves deep links.
      name: 'spa-fallback-404',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
        writeFileSync('dist/.nojekyll', '')
      },
    },
  ],
})
