import { Buffer } from 'buffer'
// @solana/web3.js (used for on-chain LP position decoding) expects a global Buffer
if (typeof globalThis.Buffer === 'undefined') globalThis.Buffer = Buffer

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
