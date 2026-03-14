'use client'

import { motion } from 'framer-motion'

/**
 * Animated mesh gradient background.
 * Uses blurred, slowly-moving gradient orbs for a modern ambient effect.
 * Lightweight — CSS blur + framer-motion transforms only.
 */
export function MeshGradient({ className = '' }: { className?: string }) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden pointer-events-none ${className}`}>
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-[#020a18]" />

      {/* Orb 1 — top-left, blue */}
      <motion.div
        className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(32, 129, 226, 0.12) 0%, rgba(32, 129, 226, 0.04) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orb 2 — top-right, cyan/teal */}
      <motion.div
        className="absolute -top-[5%] -right-[15%] w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.10) 0%, rgba(6, 182, 212, 0.03) 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.95, 1.08, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />

      {/* Orb 3 — center, purple (very subtle) */}
      <motion.div
        className="absolute top-[30%] left-[40%] w-[700px] h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 40%, transparent 70%)',
          filter: 'blur(100px)',
        }}
        animate={{
          x: [0, -40, 50, 0],
          y: [0, -30, 40, 0],
          scale: [1, 1.05, 0.97, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />

      {/* Orb 4 — bottom-left, blue (very subtle) */}
      <motion.div
        className="absolute bottom-[5%] -left-[10%] w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(32, 129, 226, 0.08) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
