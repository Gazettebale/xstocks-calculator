import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// ── Dev-only serverless shim ────────────────────────────────────────────────
// Plain `vite` doesn't run the /api functions (those are Vercel serverless).
// This middleware mounts /api/analyst locally so `npm run dev` works without
// `vercel dev`. The handler reads ANTHROPIC_API_KEY from process.env (loaded
// from .env below) — it runs in the Node dev server, never in the browser bundle.
function devApiAnalyst() {
  return {
    name: 'dev-api-analyst',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/analyst', async (req, res) => {
        // Vercel decorates `res` with status()/json()/send(); shim them for Node.
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)) }
        res.send = (body) => { res.end(typeof body === 'string' ? body : JSON.stringify(body)) }
        try {
          const { default: handler } = await server.ssrLoadModule('/api/analyst.js')
          await handler(req, res)
        } catch (e) {
          res.statusCode = 500
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify({ error: 'dev middleware: ' + (e?.message || String(e)) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Load ALL env vars (empty prefix) so server-side keys reach the dev middleware.
  const env = loadEnv(mode, process.cwd(), '')
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY

  return {
    // @solana/web3.js (on-chain LP position decoding) needs Node's Buffer/global in
    // the browser. The polyfill plugin provides them.
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({ include: ['buffer'], globals: { Buffer: true, global: true } }),
      devApiAnalyst(),
    ],
  }
})
