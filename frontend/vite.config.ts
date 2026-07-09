import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Avoid native rolldown bindings issues on some CI environments (e.g. Vercel)
  // by forcing a pure-JS fallback.
  // Vite's public API doesn't expose this; we pass it through to the
  // underlying bundler.
  build: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...( { rolldown: { nativeBindings: false } } as any ),
  },
})

