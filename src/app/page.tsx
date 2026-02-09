'use client'

import { FloatingParticles } from '@/components/animations/FloatingParticles'
import { GlowingOrb } from '@/components/animations/GlowingOrb'
import { StarField } from '@/components/animations/StarField'
import { AXMPriceTicker } from '@/components/price/AXMPriceTicker'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

/* ─── animation helpers ─── */
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true } as const,
  transition: { duration: 0.55 },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}
const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

/* ─── data ─── */
const features = [
  { key: 'tokenProfiles', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', color: 'blue', href: '/explorer' },
  { key: 'ownerVerification', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'purple', href: '/explorer' },
  { key: 'verifiedLinks', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'emerald', href: '/explorer' },
  { key: 'riskFlags', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'amber', href: '/explorer' },
  { key: 'preLaunch', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', color: 'pink', href: '/explorer' },
  { key: 'aiStudio', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', color: 'cyan', hasBadge: true, href: '/studio' },
]

const steps = [
  { key: 'step1', num: 1, icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6', color: 'from-blue-500 to-blue-600' },
  { key: 'step2', num: 2, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-purple-500 to-purple-600' },
  { key: 'step3', num: 3, icon: 'M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z', color: 'from-pink-500 to-pink-600' },
  { key: 'step4', num: 4, icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'from-emerald-500 to-emerald-600' },
]

const tiers = [
  { name: 'Explorer', amount: '10,000', period: '7 days', color: '#3B82F6' },
  { name: 'Builder', amount: '50,000', period: '30 days', color: '#8B5CF6' },
  { name: 'Founder', amount: '200,000', period: '90 days', color: '#EC4899' },
  { name: 'Governor', amount: '1,000,000', period: '180 days', color: '#F59E0B' },
]

const feeSplit = [
  { key: 'operations', pct: 30, color: '#3B82F6' },
  { key: 'buyback', pct: 25, color: '#8B5CF6' },
  { key: 'rewards', pct: 25, color: '#10B981' },
  { key: 'grants', pct: 20, color: '#F59E0B' },
]

const mockComments = [
  { key: 'comment1', avatar: 'A' },
  { key: 'comment2', avatar: 'C' },
  { key: 'comment3', avatar: 'D' },
]

const utilityItems = [
  { key: 'access', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'blue' },
  { key: 'reputation', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', color: 'violet' },
  { key: 'rewards', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'emerald' },
]

/* helper: color utility */
const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', glow: 'from-blue-600/20 to-cyan-600/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', glow: 'from-purple-600/20 to-pink-600/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', glow: 'from-emerald-600/20 to-green-600/20' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', glow: 'from-amber-600/20 to-yellow-600/20' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400', glow: 'from-pink-600/20 to-rose-600/20' },
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', glow: 'from-cyan-600/20 to-blue-600/20' },
}

/* ─── Donut mini chart ─── */
function MiniDonut({ data }: { data: typeof feeSplit }) {
  let cum = 0
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40 -rotate-90">
      {data.map((s, i) => {
        const start = cum * 3.6; cum += s.pct
        const end = cum * 3.6
        const sr = (start * Math.PI) / 180, er = (end * Math.PI) / 180
        const x1 = 50 + 38 * Math.cos(sr), y1 = 50 + 38 * Math.sin(sr)
        const x2 = 50 + 38 * Math.cos(er), y2 = 50 + 38 * Math.sin(er)
        return <path key={i} d={`M 50 50 L ${x1} ${y1} A 38 38 0 ${s.pct > 50 ? 1 : 0} 1 ${x2} ${y2} Z`} fill={s.color} className="hover:opacity-80 transition-opacity" />
      })}
      <circle cx="50" cy="50" r="22" fill="#0f0f1a" />
    </svg>
  )
}

/* ─── PAGE ─── */
export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated BG */}
      <StarField />
      <FloatingParticles count={30} />
      <GlowingOrb color="blue" size="xl" className="-top-32 -left-32" delay={0} />
      <GlowingOrb color="purple" size="lg" className="top-1/4 -right-20" delay={2} />
      <GlowingOrb color="cyan" size="md" className="bottom-1/3 left-1/4" delay={4} />

      {/* ════════ 1. HERO ════════ */}
      <section className="relative z-20 pt-6 sm:pt-10 pb-12 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Animated Logo ── */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center mb-6 sm:mb-10 relative z-20"
          >
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
                  'drop-shadow(0 0 40px rgba(147, 51, 234, 0.5))',
                  'drop-shadow(0 0 20px rgba(59, 130, 246, 0.4))',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block relative z-10"
            >
              <Image
                src="/axiome-launch-suite-logo.png"
                alt="Axiome Launch Suite"
                width={700}
                height={252}
                className="h-28 sm:h-44 md:h-56 lg:h-64 w-auto object-contain"
                priority
              />
            </motion.div>

            {/* Glow layers beneath logo */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-[calc(60%-25px)] w-[350px] sm:w-[600px] md:w-[800px] lg:w-[950px]"
              style={{
                background: 'radial-gradient(ellipse at center top, rgba(147, 197, 253, 0.4) 0%, rgba(99, 102, 241, 0.35) 20%, rgba(147, 51, 234, 0.25) 50%, transparent 100%)',
                filter: 'blur(20px)',
                clipPath: 'polygon(49.5% 0%, 50.5% 0%, 70% 100%, 30% 100%)',
                height: '300px',
                zIndex: 0,
              }}
              animate={{ opacity: [0.6, 0.9, 0.6], scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-[calc(60%-25px)] w-[300px] sm:w-[550px] md:w-[750px] lg:w-[900px]"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(191,219,254,0.8) 10%, rgba(147,197,253,0.6) 25%, rgba(99,102,241,0.4) 45%, rgba(147,51,234,0.2) 65%, transparent 100%)',
                filter: 'blur(12px)',
                clipPath: 'polygon(45% 0%, 55% 0%, 100% 100%, 0% 100%)',
                height: '300px',
                zIndex: 1,
              }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center relative z-20">
            {/* Left – copy */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center lg:text-left">
              <motion.div variants={staggerItem} className="flex flex-wrap justify-center lg:justify-start gap-2 mb-4 sm:mb-5">
                {(['verifiedLinks', 'reputation', 'preLaunch'] as const).map(badgeKey => (
                  <span key={badgeKey} className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-medium rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {t(`badges.${badgeKey}`)}
                  </span>
                ))}
              </motion.div>

              <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 sm:mb-5">
                <span className="bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  {t('hero.title')}
                </span>
              </motion.h1>

              <motion.p variants={staggerItem} className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto lg:mx-0 leading-relaxed mb-4">
                {t('hero.subtitle')}<br />
                <span className="text-gray-300">{t('hero.subtitle2')}</span>
              </motion.p>

              <motion.div variants={staggerItem} className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-4 sm:mb-5">
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm sm:text-base font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all">
                    {t('hero.cta1')}
                  </motion.span>
                </Link>
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 border border-gray-700 hover:border-gray-500 text-gray-200 text-sm sm:text-base font-medium rounded-xl transition-all hover:bg-white/5">
                    {t('hero.cta2')}
                  </motion.span>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start items-center gap-4">
                <Link href="/docs" className="text-sm text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1">
                  {t('hero.docsLink')} <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem} className="mt-4 sm:mt-6 inline-flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {t('hero.poweredBy')}
              </motion.div>
            </motion.div>

            {/* Right – mock token preview card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* glow behind */}
                <div className="absolute -inset-6 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-pink-500/10 rounded-3xl blur-2xl" />

                <div className="relative bg-gray-900/70 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
                  {/* Header row */}
                  <div className="flex items-center gap-4 mb-5">
                    <img src="https://image2url.com/r2/default/images/1770220782157-0e2ab4ed-cb61-46aa-a681-b50a302b1254.png" alt="LAUNCH" className="w-14 h-14 rounded-xl shadow-lg shadow-violet-500/30" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-lg">LAUNCH</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-violet-500/15 text-violet-400 rounded-full border border-violet-500/20">{t('mockCard.utility')}</span>
                      </div>
                      <span className="text-sm text-gray-400">$LAUNCH</span>
                    </div>
                  </div>

                  {/* Supply info */}
                  <div className="flex items-center gap-3 mb-5 p-3 bg-gray-800/50 rounded-xl">
                    <div className="text-center min-w-[70px]">
                      <div className="text-lg font-bold text-violet-400">100M</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('mockCard.supply')}</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                        <div className="h-full bg-violet-500 rounded-l-full" style={{ width: '20%' }} />
                        <div className="h-full bg-blue-500" style={{ width: '15%' }} />
                        <div className="h-full bg-emerald-500" style={{ width: '15%' }} />
                        <div className="h-full bg-amber-500" style={{ width: '15%' }} />
                        <div className="h-full bg-pink-500" style={{ width: '10%' }} />
                        <div className="h-full bg-cyan-500" style={{ width: '15%' }} />
                        <div className="h-full bg-red-400 rounded-r-full" style={{ width: '10%' }} />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{t('mockCard.reserve')}</span><span>{t('mockCard.staking')}</span><span>{t('mockCard.liquidity')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Utility items */}
                  <div className="space-y-2 mb-5">
                    {([
                      { labelKey: 'utilityAccess' as const, icon: '🔑' },
                      { labelKey: 'utilityReputation' as const, icon: '⭐' },
                      { labelKey: 'utilityGovernance' as const, icon: '🗳️' },
                      { labelKey: 'utilityRewards' as const, icon: '🎁' },
                    ]).map(item => (
                      <div key={item.labelKey} className="flex items-center gap-2.5 text-sm">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-gray-300">{t(`mockCard.${item.labelKey}`)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/15">{t('mockCard.platformToken')}</span>
                    <span className="text-[10px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15">{t('mockCard.axiomeChain')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AXM ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 sm:mt-10 flex justify-center relative z-30">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <AXMPriceTicker showVolume showHighLow />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ 2. PROBLEM → SOLUTION ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('why.title')}</span>
          </motion.h2>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div {...fadeUp} className="bg-red-500/5 border border-red-500/15 rounded-2xl p-7 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-red-500/15 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-red-400">{t('why.problemTitle')}</h3>
              </div>
              <p className="text-white font-medium mb-2">{t('why.problemText1')}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{t('why.problemText2')}</p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.55, delay: 0.1 }} className="bg-emerald-500/5 border border-emerald-500/15 rounded-2xl p-7 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-emerald-500/15 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <h3 className="text-lg font-semibold text-emerald-400">{t('why.solutionTitle')}</h3>
              </div>
              <p className="text-white font-medium mb-2">{t('why.solutionText1')}</p>
              <p className="text-sm text-gray-400 leading-relaxed">{t('why.solutionText2')}</p>
            </motion.div>
          </div>

          <motion.div {...fadeUp} className="mt-6 text-center">
            <Link href="/docs" className="text-sm text-gray-500 hover:text-violet-400 transition-colors">
              {t('why.docsLink')} &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════ 3. CORE FEATURES 2×3 ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-4">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('features.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            {t('features.subtitle')}
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => {
              const c = colorMap[f.color]
              return (
                <motion.div key={f.key} variants={staggerItem}>
                  <Link href={f.href}>
                    <div className="group relative h-full">
                      <div className={`absolute inset-0 bg-gradient-to-r ${c.glow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      <div className={`relative h-full bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/80 transition-all duration-300 hover:-translate-y-1`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
                            <svg className={`w-5 h-5 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={f.icon} /></svg>
                          </div>
                          <h3 className="text-white font-semibold">{t(`features.${f.key}.title`)}</h3>
                          {f.hasBadge && (
                            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 font-medium">{t(`features.${f.key}.badge`)}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-3">{t(`features.${f.key}.desc`)}</p>
                        <ul className="space-y-1">
                          {(['bullet1', 'bullet2'] as const).map(bulletKey => (
                            <li key={bulletKey} className="flex items-center gap-2 text-xs text-gray-500">
                              <svg className={`w-3 h-3 ${c.text}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              {t(`features.${f.key}.${bulletKey}`)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ════════ 4. HOW IT WORKS (4 steps) ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('steps.title')}</span>
          </motion.h2>

          {/* Desktop: horizontal stepper */}
          <div className="hidden md:block relative">
            {/* connector line */}
            <div className="absolute top-10 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-emerald-500/40" />

            <div className="grid grid-cols-4 gap-6">
              {steps.map((s, i) => (
                <motion.div key={s.num} {...fadeUp} transition={{ duration: 0.55, delay: i * 0.12 }} className="text-center relative">
                  <div className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br ${s.color} rounded-full flex items-center justify-center shadow-lg relative z-10`}>
                    <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} /></svg>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-gray-900 rounded-full text-xs font-bold flex items-center justify-center shadow">{s.num}</div>
                  </div>
                  <h3 className="text-white font-semibold mb-1">{t(`steps.${s.key}.title`)}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{t(`steps.${s.key}.desc`)}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical stepper */}
          <div className="md:hidden relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-800" />
            <div className="space-y-8">
              {steps.map((s, i) => (
                <motion.div key={s.num} {...fadeUp} transition={{ duration: 0.55, delay: i * 0.1 }} className="flex items-start gap-5 relative">
                  <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-full flex items-center justify-center shrink-0 z-10 shadow-lg`}>
                    <span className="text-white font-bold text-sm">{s.num}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{t(`steps.${s.key}.title`)}</h3>
                    <p className="text-sm text-gray-400">{t(`steps.${s.key}.desc`)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════ 5. LAUNCH TOKEN UTILITY ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent">{t('utility.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            {t('utility.subtitle')}
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5">
            {utilityItems.map(c => (
              <motion.div key={c.key} variants={staggerItem} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${c.color === 'blue' ? 'bg-blue-500/15' : c.color === 'violet' ? 'bg-violet-500/15' : 'bg-emerald-500/15'}`}>
                  <svg className={`w-7 h-7 ${c.color === 'blue' ? 'text-blue-400' : c.color === 'violet' ? 'text-violet-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} /></svg>
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{t(`utility.${c.key}.title`)}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{t(`utility.${c.key}.desc`)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="mt-8 text-center">
            <Link href="/docs#token" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
              {t('utility.readMore')} &rarr;
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════ 6. TIERS PREVIEW ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('tiers.title')}</span>
          </motion.h2>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map(tier => (
              <motion.div key={tier.name} variants={staggerItem} className="bg-gray-900/50 backdrop-blur-sm border rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform duration-300" style={{ borderColor: `${tier.color}33` }}>
                <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: `${tier.color}20` }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                </div>
                <h3 className="text-white font-bold mb-1">{tier.name}</h3>
                <div className="text-xl font-bold" style={{ color: tier.color }}>{tier.amount}</div>
                <div className="text-xs text-gray-500 mb-3">LAUNCH / {tier.period}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="mt-6 text-center space-y-2">
            <Link href="/docs#access" className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all">
              {t('tiers.cta')}
            </Link>
            <p className="text-xs text-gray-600">{t('tiers.note')}</p>
          </motion.div>
        </div>
      </section>

      {/* ════════ 7. FEE SPLIT + TRANSPARENCY ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('feeSplit.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            {t('feeSplit.subtitle')}
          </motion.p>

          <motion.div {...fadeUp} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="flex justify-center">
                <MiniDonut data={feeSplit} />
              </div>
              <div className="space-y-4">
                {feeSplit.map(s => (
                  <div key={s.key} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{t(`feeSplit.${s.key}`)}</span>
                        <span className="text-white font-medium">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${s.pct * 100 / 30}%`, backgroundColor: s.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════ 8. SOCIAL PROOF / COMMUNITY ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{t('community.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-10 max-w-lg mx-auto">
            {t('community.subtitle')}
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-5 mb-8">
            {mockComments.map((c, i) => (
              <motion.div key={i} variants={staggerItem} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{c.avatar}</div>
                  <div>
                    <div className="text-white text-sm font-medium">{t(`community.${c.key}.user`)}</div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/15">{t(`community.${c.key}.badge`)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">&quot;{t(`community.${c.key}.text`)}&quot;</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="text-center">
            <Link href="/explorer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all">
              {t('community.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════ 9. FINAL CTA ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            {/* glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-pink-600/15 rounded-3xl blur-3xl" />

            <div className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-10 md:p-14 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {t('cta.title')}
                </span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                {t('cta.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-white text-lg font-medium rounded-xl shadow-2xl shadow-purple-500/25 transition-all">
                    {t('cta.cta1')}
                  </motion.span>
                </Link>
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 border border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 text-gray-200 text-lg font-medium rounded-xl transition-all">
                    {t('cta.cta2')}
                  </motion.span>
                </Link>
              </div>

              <Link href="/docs" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                {t('cta.docsLink')} &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
