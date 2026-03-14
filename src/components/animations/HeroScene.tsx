'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

/* ── Project data for orbiting items ── */
const PROJECTS = [
  {
    id: 'heads-or-tails',
    name: 'Heads or Tails',
    status: 'Live',
    statusColor: 'text-[var(--success)]',
    statusBg: 'bg-[var(--success-bg)]',
    description: 'PvP coin flip game with real AXM stakes',
    logo: '/coin-token-logo.png',
    logoBack: '/coin-token-logo.back.png',
    href: 'https://coinflip.axiome-launch.com/game',
    external: true,
    glowColor: 'rgba(245, 158, 11, 0.4)',
    borderColor: 'border-amber-400/30',
    ringBorder: 'border-amber-400/10',
  },
]

export function HeroScene({ className = '' }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  const rotateX = useTransform(smoothY, [-1, 1], [12, -12])
  const rotateY = useTransform(smoothX, [-1, 1], [-12, 12])

  const layer2X = useTransform(smoothX, [-1, 1], [-30, 30])
  const layer2Y = useTransform(smoothY, [-1, 1], [-30, 30])
  const layer3X = useTransform(smoothX, [-1, 1], [-45, 45])
  const layer3Y = useTransform(smoothY, [-1, 1], [-45, 45])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2)
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }, [mouseX, mouseY])

  useEffect(() => {
    if (isHovered) return
    let frame: number
    let t = 0
    const animate = () => {
      t += 0.006
      mouseX.set(Math.sin(t) * 0.12)
      mouseY.set(Math.cos(t * 0.7) * 0.08)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [isHovered, mouseX, mouseY])

  const selectedData = PROJECTS.find(p => p.id === selectedProject)

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-square max-w-[520px] mx-auto ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
    >
      {/* ── Glow backdrop ── */}
      <motion.div
        className="absolute inset-[5%] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(32, 129, 226, 0.25) 0%, rgba(139, 92, 246, 0.12) 40%, transparent 70%)',
          filter: 'blur(50px)',
        }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Project orbit ring — Heads or Tails ── */}
      <motion.div
        className="absolute inset-[4%] z-30"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d', pointerEvents: 'none' }}
      >
        <motion.div
          className={`w-full h-full rounded-full ${PROJECTS[0].ringBorder} border`}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        >
          {PROJECTS.map((project) => (
            <div key={project.id} className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ pointerEvents: 'auto' }}>
              {/* Coin — clickable, self-rotating like a planet */}
              <motion.button
                onClick={() => setSelectedProject(prev => prev === project.id ? null : project.id)}
                className="relative w-12 h-12 sm:w-14 sm:h-14 cursor-pointer z-10 focus:outline-none"
                style={{ transformStyle: 'preserve-3d' }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {/* Self-rotation wrapper — spins on Y (coin flip) + Z (face spin) like a planet */}
                <motion.div
                  className="w-full h-full"
                  animate={{
                    rotateY: [0, 360],
                    rotateZ: [0, 360],
                  }}
                  transition={{
                    rotateY: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                    rotateZ: { duration: 12, repeat: Infinity, ease: 'linear' },
                  }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Front side */}
                  <div
                    className={`absolute inset-0 rounded-full overflow-hidden border-2 ${project.borderColor}`}
                    style={{ backfaceVisibility: 'hidden', boxShadow: `0 0 ${selectedProject === project.id ? '30' : '20'}px ${project.glowColor}` }}
                  >
                    <Image src={project.logo} alt={project.name} width={56} height={56} className="w-full h-full object-cover" />
                  </div>
                  {/* Back side */}
                  {project.logoBack && (
                    <div
                      className={`absolute inset-0 rounded-full overflow-hidden border-2 ${project.borderColor}`}
                      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: `0 0 ${selectedProject === project.id ? '30' : '20'}px ${project.glowColor}` }}
                    >
                      <Image src={project.logoBack} alt={`${project.name} back`} width={56} height={56} className="w-full h-full object-cover" />
                    </div>
                  )}
                </motion.div>

                {/* Selected glow ring */}
                <AnimatePresence>
                  {selectedProject === project.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-[-6px] rounded-full border-2 border-amber-400/40 pointer-events-none"
                      style={{ boxShadow: `0 0 25px ${project.glowColor}` }}
                    />
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          ))}

          {/* Opposite accent dot */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Decorative orbit ring ── */}
      <motion.div
        className="absolute inset-[16%] pointer-events-none"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="w-full h-full rounded-full border border-purple-500/8"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-5 h-5 rounded-[3px] bg-gradient-to-br from-accent/15 to-purple-500/15 border border-accent/15"
              animate={{ rotate: [0, 90, 180, 270, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/10 border border-cyan-400/15"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Floating geometric shapes (layer 3) ── */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: layer3X, y: layer3Y }}>
        <motion.div className="absolute top-[6%] right-[10%] w-6 h-6"
          animate={{ rotate: 360, y: [0, -8, 0] }}
          transition={{ rotate: { duration: 12, repeat: Infinity, ease: 'linear' }, y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-accent/25"><path d="M12 2l9 5v10l-9 5-9-5V7l9-5z" stroke="currentColor" strokeWidth="1.5" /></svg>
        </motion.div>
        <motion.div className="absolute bottom-[12%] left-[8%] w-5 h-5"
          animate={{ rotate: -360, y: [0, 6, 0] }}
          transition={{ rotate: { duration: 15, repeat: Infinity, ease: 'linear' }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-400/20"><path d="M12 3l10 18H2L12 3z" stroke="currentColor" strokeWidth="1.5" /></svg>
        </motion.div>
        <motion.div className="absolute top-[18%] left-[6%] w-4 h-4 text-cyan-400/15"
          animate={{ rotate: 180, scale: [1, 1.2, 1] }}
          transition={{ rotate: { duration: 10, repeat: Infinity, ease: 'linear' }, scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </motion.div>
        <motion.div className="absolute bottom-[20%] right-[6%] w-4 h-4"
          animate={{ rotate: [0, 45, 0], y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-full h-full bg-accent/12 rotate-45 rounded-sm border border-accent/15" />
        </motion.div>
      </motion.div>

      {/* ── Floating particles (layer 2) ── */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: layer2X, y: layer2Y }}>
        {[
          { top: '15%', left: '22%', size: 3, delay: 0, dur: 5 },
          { top: '68%', left: '18%', size: 2, delay: 1, dur: 4 },
          { top: '28%', left: '82%', size: 2.5, delay: 2, dur: 6 },
          { top: '78%', left: '78%', size: 2, delay: 0.5, dur: 3.5 },
          { top: '48%', left: '8%', size: 1.5, delay: 3, dur: 4.5 },
          { top: '10%', left: '58%', size: 2, delay: 1.5, dur: 5.5 },
        ].map((p, i) => (
          <motion.div key={i} className="absolute rounded-full bg-accent/40"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.5, 1], y: [0, -10, 0] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}
      </motion.div>

      {/* ── CENTRAL TOKEN ── */}
      <motion.div
        className="absolute inset-[25%] flex items-center justify-center"
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Glow */}
        <motion.div className="absolute inset-[-20%] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(32, 129, 226, 0.35) 0%, rgba(139, 92, 246, 0.18) 40%, transparent 70%)', filter: 'blur(25px)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.85, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Token circle */}
        <motion.div className="relative w-full h-full rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 50%, var(--surface-2) 100%)', border: '2px solid rgba(32, 129, 226, 0.3)', boxShadow: '0 0 60px rgba(32, 129, 226, 0.2), inset 0 0 40px rgba(32, 129, 226, 0.06)' }}
          animate={{ rotate: [0, 2, -2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Shine sweep */}
          <motion.div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 42%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 58%, transparent 70%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', repeatDelay: 2 }}
          />
          {/* Logo — no padding, fills the circle */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image src="/axiome-launch-suite-logo.png" alt="Axiome Launch Suite" width={500} height={333}
              className="w-[90%] object-contain drop-shadow-[0_0_15px_rgba(32,129,226,0.25)]" priority
            />
          </div>
        </motion.div>
        {/* Inner orbit ring — tight to token edge */}
        <motion.div className="absolute inset-[-3px] rounded-full border border-accent/10 pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent/30" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1 h-1 rounded-full bg-purple-400/25" />
        </motion.div>
      </motion.div>

      {/* ── Project info card — anchored to bottom center of scene, always readable ── */}
      <AnimatePresence>
        {selectedData && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50"
            style={{ pointerEvents: 'auto' }}
          >
            <div className="glass-card rounded-[var(--radius-md)] px-4 py-3 flex items-center gap-3 w-max max-w-[calc(100%-16px)]">
              {/* Mini logo */}
              <div className="w-9 h-9 rounded-full overflow-hidden border border-amber-400/30 flex-shrink-0"
                style={{ boxShadow: `0 0 12px ${selectedData.glowColor}` }}
              >
                <Image src={selectedData.logo} alt={selectedData.name} width={36} height={36} className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary">{selectedData.name}</span>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold rounded-full ${selectedData.statusBg} ${selectedData.statusColor}`}>
                    <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                    {selectedData.status}
                  </span>
                </div>
                <p className="text-[11px] text-text-tertiary truncate">{selectedData.description}</p>
              </div>

              {/* CTA */}
              {selectedData.external ? (
                <a href={selectedData.href} target="_blank" rel="noopener noreferrer"
                  className="glass-btn px-3 py-1.5 text-xs flex-shrink-0 inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Play
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              ) : (
                <Link href={selectedData.href}
                  className="glass-btn px-3 py-1.5 text-xs flex-shrink-0 inline-flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              )}

              {/* Close */}
              <button onClick={() => setSelectedProject(null)} className="p-1 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Interaction hint ── */}
      <AnimatePresence>
        {!selectedData && (
          <motion.div
            className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 text-text-tertiary text-xs flex items-center gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0 : [0, 0.5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Move cursor
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
