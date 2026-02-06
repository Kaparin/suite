'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import type { AXMPriceData } from '@/app/api/price/axm/route'

interface AXMPriceTickerProps {
  className?: string
  showVolume?: boolean
  showHighLow?: boolean
  compact?: boolean
}

export function AXMPriceTicker({
  className = '',
  showVolume = false,
  showHighLow = false,
  compact = false
}: AXMPriceTickerProps) {
  const [priceData, setPriceData] = useState<AXMPriceData | null>(null)
  const [prevPrice, setPrevPrice] = useState<number | null>(null)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrice = useCallback(async () => {
    try {
      const response = await fetch('/api/price/axm')
      if (!response.ok) throw new Error('Failed to fetch')
      const data: AXMPriceData = await response.json()

      if (priceData && data.price !== priceData.price) {
        setPrevPrice(priceData.price)
        setPriceDirection(data.price > priceData.price ? 'up' : 'down')
        // Reset direction after animation
        setTimeout(() => setPriceDirection(null), 1000)
      }

      setPriceData(data)
      setError(null)
    } catch {
      setError('Failed to load price')
    } finally {
      setLoading(false)
    }
  }, [priceData])

  useEffect(() => {
    fetchPrice()

    // Poll every 15 seconds
    const interval = setInterval(fetchPrice, 15000)
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return price.toFixed(5)
    } else if (price < 1) {
      return price.toFixed(4)
    } else if (price < 100) {
      return price.toFixed(3)
    }
    return price.toFixed(2)
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000) {
      return (volume / 1_000_000).toFixed(2) + 'M'
    } else if (volume >= 1_000) {
      return (volume / 1_000).toFixed(2) + 'K'
    }
    return volume.toFixed(2)
  }

  const formatPercent = (percent: number) => {
    const sign = percent >= 0 ? '+' : ''
    return sign + percent.toFixed(2) + '%'
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-4 w-20 bg-white/10 rounded animate-pulse" />
      </div>
    )
  }

  if (error || !priceData) {
    return null // Silently hide on error
  }

  const isPositive = priceData.changePercent24h >= 0

  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        <div className="flex items-center gap-1">
          <Image src="/axm-logo.png" alt="AXM" width={16} height={16} className="rounded-full" />
          <span className="text-white/60">AXM</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={priceData.price}
            initial={{ opacity: 0, y: priceDirection === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`font-mono font-medium ${
              priceDirection === 'up'
                ? 'text-green-400'
                : priceDirection === 'down'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            ${formatPrice(priceData.price)}
          </motion.span>
        </AnimatePresence>
        <span className={`font-mono ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {formatPercent(priceData.changePercent24h)}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex flex-wrap items-center gap-x-4 gap-y-2 ${className}`}>
      {/* Main Price */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Image
            src="/axm-logo.png"
            alt="AXM"
            width={20}
            height={20}
            className="rounded-full"
          />
          <span className="text-white/80 font-medium">AXM/USDT</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={priceData.price}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-mono text-lg font-bold ${
              priceDirection === 'up'
                ? 'text-green-400'
                : priceDirection === 'down'
                ? 'text-red-400'
                : 'text-white'
            }`}
          >
            ${formatPrice(priceData.price)}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* 24h Change */}
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-mono ${
          isPositive
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400'
        }`}
      >
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{formatPercent(priceData.changePercent24h)}</span>
      </div>

      {/* 24h High/Low */}
      {showHighLow && (
        <div className="flex items-center gap-2 text-sm text-white/60">
          <span>H: <span className="text-green-400 font-mono">${formatPrice(priceData.high24h)}</span></span>
          <span>L: <span className="text-red-400 font-mono">${formatPrice(priceData.low24h)}</span></span>
        </div>
      )}

      {/* 24h Volume */}
      {showVolume && (
        <div className="flex items-center gap-1 text-sm text-white/60">
          <span>Vol:</span>
          <span className="font-mono text-white/80">{formatVolume(priceData.volume24h)} AXM</span>
          <span className="text-white/40">≈</span>
          <span className="font-mono text-white/80">${formatVolume(priceData.volumeUSDT24h)}</span>
        </div>
      )}

      {/* MEXC Link */}
      <a
        href="https://www.mexc.com/exchange/AXM_USDT"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-white/40 hover:text-white/60 transition-colors"
      >
        MEXC ↗
      </a>
    </div>
  )
}
