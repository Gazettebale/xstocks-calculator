import { useEffect, useRef, memo } from 'react'

/**
 * TradingView Mini Chart Widget — Compact sparkline for tables/cards
 *
 * @param {string} symbol - TradingView symbol (e.g. 'NASDAQ:AAPL')
 * @param {number} width - Widget width (default 160)
 * @param {number} height - Widget height (default 46)
 * @param {string} dateRange - '1D', '1M', '3M', '12M', '60M', 'ALL'
 * @param {string} trendLineColor - Line color (default green)
 * @param {string} underLineColor - Area fill color
 */
function TradingViewMiniChart({
  symbol = 'NASDAQ:AAPL',
  width = 160,
  height = 46,
  dateRange = '1M',
  trendLineColor = 'rgba(34, 197, 94, 1)',
  underLineColor = 'rgba(34, 197, 94, 0.12)',
}) {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    containerRef.current.innerHTML = ''

    const div = document.createElement('div')
    div.className = 'tradingview-widget-container'
    containerRef.current.appendChild(div)

    const widgetDiv = document.createElement('div')
    widgetDiv.className = 'tradingview-widget-container__widget'
    div.appendChild(widgetDiv)

    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.async = true
    script.textContent = JSON.stringify({
      symbol,
      width: '100%',
      height,
      locale: 'fr',
      dateRange,
      colorTheme: 'dark',
      trendLineColor,
      underLineColor,
      underLineBottomColor: 'rgba(0,0,0,0)',
      isTransparent: true,
      autosize: false,
      largeChartUrl: '',
      noTimeScale: true,
    })

    div.appendChild(script)

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = ''
    }
  }, [symbol, dateRange, trendLineColor, underLineColor, height])

  return (
    <div
      ref={containerRef}
      style={{ width, height, overflow: 'hidden', pointerEvents: 'none' }}
    />
  )
}

export default memo(TradingViewMiniChart)
