'use client'

import { motion } from 'framer-motion'

interface GlowingOrbProps {
  className?: string
  color?: 'blue' | 'purple' | 'cyan' | 'pink'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  delay?: number
}

const colors = {
  blue: 'from-blue-500/30 via-blue-600/20 to-transparent',
  purple: 'from-purple-500/30 via-purple-600/20 to-transparent',
  cyan: 'from-cyan-500/30 via-cyan-600/20 to-transparent',
  pink: 'from-pink-500/30 via-pink-600/20 to-transparent',
}

const sizes = {
  sm: 'w-32 h-32',
  md: 'w-64 h-64',
  lg: 'w-96 h-96',
  xl: 'w-[500px] h-[500px]',
}

export function GlowingOrb({
  className = '',
  color = 'blue',
  size = 'md',
  delay = 0
}: GlowingOrbProps) {
  return (
    <motion.div
      className={`absolute rounded-full bg-gradient-radial ${colors[color]} ${sizes[size]} blur-3xl ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  )
}
