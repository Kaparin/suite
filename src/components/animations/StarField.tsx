'use client'

import { useEffect, useRef } from 'react'

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let stars: { x: number; y: number; z: number; size: number }[] = []

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      stars = []
      const numStars = Math.floor((canvas.width * canvas.height) / 3000)
      for (let i = 0; i < numStars; i++) {
        stars.push({
          x: Math.random() * canvas.width - canvas.width / 2,
          y: Math.random() * canvas.height - canvas.height / 2,
          z: Math.random() * 1000,
          size: Math.random() * 2,
        })
      }
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const centerX = canvas.width / 2
      const centerY = canvas.height / 2

      stars.forEach((star) => {
        star.z -= 0.5

        if (star.z <= 0) {
          star.z = 1000
          star.x = Math.random() * canvas.width - centerX
          star.y = Math.random() * canvas.height - centerY
        }

        const x = (star.x / star.z) * 300 + centerX
        const y = (star.y / star.z) * 300 + centerY
        const size = (1 - star.z / 1000) * star.size * 3

        const opacity = 1 - star.z / 1000

        // Цвет звёзд - от белого до голубого/фиолетового
        const hue = 200 + Math.random() * 60
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${opacity})`
        ctx.fill()

        // Свечение
        if (size > 1) {
          ctx.beginPath()
          ctx.arc(x, y, size * 2, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 80%, 70%, ${opacity * 0.3})`
          ctx.fill()
        }
      })

      animationId = requestAnimationFrame(animate)
    }

    resize()
    animate()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'linear-gradient(to bottom, #030712, #0a0f1a, #030712)' }}
    />
  )
}
