import { useState } from 'react'

// Real xStock PNG logo (from xstocks-metadata.backed.fi) with emoji fallback.
export default function StockLogo({ stock, size = 22 }) {
  const [err, setErr] = useState(false)
  if (!stock?.image || err) {
    return <span style={{ fontSize: Math.round(size * 0.85), lineHeight: 1 }}>{stock?.logo || '📈'}</span>
  }
  return (
    <img
      src={stock.image}
      alt={stock.symbol || ''}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setErr(true)}
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        display: 'block', flexShrink: 0, background: 'rgba(255,255,255,0.06)',
      }}
    />
  )
}
