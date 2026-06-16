import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  // @solana/web3.js (on-chain LP position decoding) needs Node's Buffer/global in
  // the browser. The polyfill plugin provides them.
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({ include: ['buffer'], globals: { Buffer: true, global: true } }),
  ],
})
