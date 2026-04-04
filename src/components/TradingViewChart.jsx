import { useEffect, useRef, useState, memo } from 'react'

/**
 * TradingView Advanced Chart Widget
 * Full interactive chart with candlesticks, indicators, drawing tools
 */
function TradingViewChart({
  symbol = 'NASDAQ:AAPL',
  height = 500,
  interval = 'D',
  showToolbar = true,
  showDrawingTools = true,
  studies = [],
}) {
  const containerRef = useRef(null)
  const widgetRef = useRef(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    setError(false)

    // Clear previous widget
    containerRef.current.innerHTML = ''
    const containerId = `tv_chart_${Math.random().toString(36).slice(2, 9)}`
    const div = document.createElement('div')
    div.id = containerId
    div.style.height = `${height}px`
    containerRef.current.appendChild(div)

    const initWidget = () => {
      try {
        if (!window.TradingView || !document.getElementById(containerId)) return
        widgetRef.current = new window.TradingView.widget({
          container_id: containerId,
          symbol,
          interval,
          timezone: 'Europe/Paris',
          theme: 'dark',
          style: '1',
          locale: 'fr',
          toolbar_bg: '#0b1121',
          enable_publishing: false,
          allow_symbol_change: false,
          hide_top_toolbar: !showToolbar,
          hide_side_toolbar: !showDrawingTools,
          withdateranges: true,
          save_image: false,
          studies: studies.length > 0 ? studies : undefined,
          width: '100%',
          height,
          overrides: {
            'paneProperties.background': '#0b1121',
            'paneProperties.backgroundType': 'solid',
            'paneProperties.vertGridProperties.color': 'rgba(255,255,255,0.04)',
            'paneProperties.horzGridProperties.color': 'rgba(255,255,255,0.04)',
            'scalesProperties.textColor': '#64748b',
            'scalesProperties.lineColor': 'rgba(255,255,255,0.06)',
            'mainSeriesProperties.candleStyle.upColor': '#22c55e',
            'mainSeriesProperties.candleStyle.downColor': '#ef4444',
            'mainSeriesProperties.candleStyle.wickUpColor': '#22c55e',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ef4444',
            'mainSeriesProperties.candleStyle.borderUpColor': '#22c55e',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
          },
          loading_screen: { backgroundColor: '#0b1121', foregroundColor: '#6366f1' },
        })
      } catch (e) {
        console.warn('TradingView widget init failed:', e.message)
        setError(true)
      }
    }

    if (window.TradingView) {
      initWidget()
    } else {
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/tv.js'
      script.async = true
      script.onload = initWidget
      script.onerror = () => setError(true)
      document.head.appendChild(script)
    }

    return () => {
      try { if (widgetRef.current?.remove) widgetRef.current.remove() } catch {}
      widgetRef.current = null
    }
  }, [symbol, interval, height, showToolbar, showDrawingTools])

  if (error) {
    return (
      <div style={{
        height, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0b1121', border: '1px solid var(--border)', borderRadius: 12,
        color: 'var(--text-3)', fontSize: 13,
      }}>
        Graphique TradingView en chargement...
        <br />Ouvre le site dans un navigateur pour voir le chart interactif.
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        background: '#0b1121',
      }}
    />
  )
}

export default memo(TradingViewChart)
