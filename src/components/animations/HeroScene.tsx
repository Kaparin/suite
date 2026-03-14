'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Image from 'next/image'

/**
 * Interactive 3D Hero Scene
 * - Central floating token with mouse-tracking tilt
 * - Orbiting rings and geometric shapes
 * - Glowing particles
 * - Everything responds to cursor position
 */
export function HeroScene({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  // Mouse position relative to container center (-1 to 1)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Smoothed values for fluid movement
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  // 3D rotations based on mouse
  const rotateX = useTransform(smoothY, [-1, 1], [15, -15])
  const rotateY = useTransform(smoothX, [-1, 1], [-15, 15])

  // Parallax offsets for different layers
  const layer1X = useTransform(smoothX, [-1, 1], [-20, 20])
  const layer1Y = useTransform(smoothY, [-1, 1], [-20, 20])
  const layer2X = useTransform(smoothX, [-1, 1], [-35, 35])
  const layer2Y = useTransform(smoothY, [-1, 1], [-35, 35])
  const layer3X = useTransform(smoothX, [-1, 1], [-50, 50])
  const layer3Y = useTransform(smoothY, [-1, 1], [-50, 50])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY])

  // Subtle idle animation when not hovered
  useEffect(() => {
    if (isHovered) return
    let frame: number
    let t = 0
    const animate = () => {
      t += 0.008
      mouseX.set(Math.sin(t) * 0.15)
      mouseY.set(Math.cos(t * 0.7) * 0.1)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isHovered, mouseX, mouseY])

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-[480px] mx-auto ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1000px' }}
    >
      {/* ── Glow backdrop ── */}
      <motion.div
        className="absolute inset-[10%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(32, 129, 226, 0.2) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(40px)',
          x: layer1X,
          y: layer1Y,
        }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Outer orbit ring ── */}
      <motion.div
        className="absolute inset-[5%] pointer-events-none"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          className="w-full h-full rounded-full border border-accent/15"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          {/* Orbiting dot 1 */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-3 h-3 rounded-full bg-accent/60 shadow-[0_0_12px_rgba(32,129,226,0.5)]" />
          </div>
          {/* Orbiting dot 2 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-2 h-2 rounded-full bg-purple-400/50 shadow-[0_0_10px_rgba(139,92,246,0.4)]" />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Middle orbit ring ── */}
      <motion.div
        className="absolute inset-[15%] pointer-events-none"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        <motion.div
          className="w-full h-full rounded-full border border-purple-500/10"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {/* Orbiting element */}
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-accent/20 to-purple-500/20 border border-accent/20 backdrop-blur-sm"
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          {/* Orbiting element 2 */}
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/20 border border-cyan-400/20"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Floating geometric shapes (layer 3 — most parallax) ── */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: layer3X, y: layer3Y }}>
        {/* Hexagon top-right */}
        <motion.div
          className="absolute top-[8%] right-[12%] w-6 h-6"
          animate={{ rotate: 360, y: [0, -8, 0] }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-accent/30">
            <path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </motion.div>

        {/* Triangle bottom-left */}
        <motion.div
          className="absolute bottom-[15%] left-[10%] w-5 h-5"
          animate={{ rotate: -360, y: [0, 6, 0] }}
          transition={{ rotate: { duration: 15, repeat: Infinity, ease: 'linear' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-400/25">
            <path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </motion.div>

        {/* Plus sign top-left */}
        <motion.div
          className="absolute top-[20%] left-[8%] w-4 h-4 text-cyan-400/20"
          animate={{ rotate: 180, scale: [1, 1.2, 1] }}
          transition={{ rotate: { duration: 10, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </motion.div>

        {/* Diamond bottom-right */}
        <motion.div
          className="absolute bottom-[22%] right-[8%] w-4 h-4"
          animate={{ rotate: [0, 45, 0], y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full bg-accent/15 rotate-45 rounded-sm border border-accent/20" />
        </motion.div>
      </motion.div>

      {/* ── Floating particles (layer 2) ── */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: layer2X, y: layer2Y }}>
        {[
          { top: '18%', left: '25%', size: 3, delay: 0, dur: 5 },
          { top: '70%', left: '20%', size: 2, delay: 1, dur: 4 },
          { top: '30%', left: '80%', size: 2.5, delay: 2, dur: 6 },
          { top: '75%', left: '75%', size: 2, delay: 0.5, dur: 3.5 },
          { top: '50%', left: '10%', size: 1.5, delay: 3, dur: 4.5 },
          { top: '12%', left: '60%', size: 2, delay: 1.5, dur: 5.5 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-accent/40"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.5, 1],
              y: [0, -10, 0],
            }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}
      </motion.div>

      {/* ── Central Token (main 3D element) ── */}
      <motion.div
        className="absolute inset-[22%] flex items-center justify-center"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Token shadow/glow */}
        <motion.div
          className="absolute inset-[-10%] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(32, 129, 226, 0.3) 0%, rgba(139, 92, 246, 0.15) 40%, transparent 70%)',
            filter: 'blur(20px)',
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Token body */}
        <motion.div
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 50%, var(--surface-2) 100%)',
            border: '2px solid rgba(32, 129, 226, 0.25)',
            boxShadow: '0 0 40px rgba(32, 129, 226, 0.15), inset 0 0 30px rgba(32, 129, 226, 0.05)',
          }}
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Shine sweep effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 55%, transparent 70%)',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
          />

          {/* Logo inside token */}
          <div className="absolute inset-0 flex items-center justify-center p-[18%]">
            <Image
              src="/axiome-launch-suite-logo.png"
              alt="Axiome Launch Suite"
              width={300}
              height={300}
              className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(32,129,226,0.3)]"
              priority
            />
          </div>
        </motion.div>

        {/* Inner ring */}
        <motion.div
          className="absolute inset-[-8%] rounded-full border border-accent/10 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent/40" />
        </motion.div>
      </motion.div>

      {/* ── Interaction hint ── */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 text-text-tertiary text-xs flex items-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0 : [0, 0.6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        Move cursor
      </motion.div>
    </div>
  )
}
