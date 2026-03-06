'use client'

import { useState } from 'react'
import { FloatingParticles } from '@/components/animations/FloatingParticles'
import { GlowingOrb } from '@/components/animations/GlowingOrb'
import { StarField } from '@/components/animations/StarField'
import { AXMPriceTicker } from '@/components/price/AXMPriceTicker'
import { motion, AnimatePresence } from 'framer-motion'
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
const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

/* ─── Project Slider ─── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectSlider({ t }: { t: any }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const totalSlides = 2

  const goTo = (idx: number) => setActiveSlide(idx)
  const goPrev = () => setActiveSlide(prev => (prev - 1 + totalSlides) % totalSlides)
  const goNext = () => setActiveSlide(prev => (prev + 1) % totalSlides)

  return (
    <section className="relative z-20 py-20 border-t border-gray-800/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div {...fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('ecosystem.title')}</span>
          </h2>
        </motion.div>

        {/* Slider container */}
        <div className="relative">
          {/* Arrows */}
          <button onClick={goPrev} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-5 z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-black/60 backdrop-blur border border-white/10 text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={goNext} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-5 z-10 hidden md:flex w-11 h-11 items-center justify-center rounded-full bg-black/60 backdrop-blur border border-white/10 text-gray-400 hover:text-white hover:border-white/25 hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="overflow-hidden rounded-2xl">
            <AnimatePresence mode="wait">
              {activeSlide === 0 && (
                <motion.div
                  key="coinflip"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Heads or Tails — premium card */}
                  <div className="relative overflow-hidden rounded-2xl border border-amber-500/20">
                    {/* Ambient golden glow background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/30 via-gray-950 to-blue-950/40" />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/8 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-500/8 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

                    <div className="relative z-10 p-6 md:p-10">
                      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                        {/* Logo */}
                        <motion.div
                          className="shrink-0 self-center md:self-start"
                          animate={{
                            filter: [
                              'drop-shadow(0 0 16px rgba(245, 158, 11, 0.3))',
                              'drop-shadow(0 0 28px rgba(245, 158, 11, 0.5))',
                              'drop-shadow(0 0 16px rgba(245, 158, 11, 0.3))',
                            ],
                          }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          <Image
                            src="/heads-or-tails-logo-landing.png"
                            alt="Heads or Tails"
                            width={200}
                            height={200}
                            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain"
                          />
                        </motion.div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Live
                            </span>
                            <span className="text-xs text-gray-500 font-medium">#1 Project</span>
                          </div>

                          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{t('coinflip.title')}</h3>
                          <p className="text-gray-400 text-sm md:text-base mb-6 max-w-xl">{t('coinflip.subtitle')}</p>

                          {/* Feature pills */}
                          <div className="flex flex-wrap gap-2 mb-6">
                            {(['pvp', 'realStakes', 'platformFee', 'instantMatch', 'tournaments'] as const).map(key => (
                              <span key={key} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 border border-white/8 text-gray-300">
                                {t(`coinflip.features.${key}`)}
                              </span>
                            ))}
                          </div>

                          {/* CTA buttons */}
                          <div className="flex flex-col sm:flex-row items-start gap-3">
                            <a href={COINFLIP_URL} target="_blank" rel="noopener noreferrer">
                              <motion.span whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/25 transition-all text-sm">
                                {t('coinflip.playNow')}
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                              </motion.span>
                            </a>
                            <a href="https://coinflip.axiome-launch.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-amber-400 transition-colors py-3">
                              {t('coinflip.viewMechanics')} <span aria-hidden="true">&rarr;</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSlide === 1 && (
                <motion.div
                  key="coming-soon"
                  initial={{ opacity: 0, x: 60 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -60 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Coming soon — premium card */}
                  <div className="relative overflow-hidden rounded-2xl border border-violet-500/15">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-gray-950 to-blue-950/30" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-500/6 rounded-full blur-[100px]" />

                    <div className="relative z-10 p-6 md:p-10 min-h-[320px] flex flex-col items-center justify-center text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 mb-6">
                        {t('ecosystem.tbd.status')}
                      </span>

                      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-violet-500/15 to-blue-500/15 rounded-2xl border border-violet-500/15 flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-10 h-10 text-violet-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>

                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">{t('ecosystem.tbd.title')}</h3>
                      <p className="text-gray-400 max-w-lg text-base">{t('ecosystem.tbd.desc')}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-8 bg-gradient-to-r from-amber-400 to-amber-500' : 'w-2 bg-gray-700 hover:bg-gray-500'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
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
                {(['ecosystem', 'launchToken', 'liveProduct'] as const).map(badgeKey => (
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

                  {/* Tokenomics TBD */}
                  <div className="flex items-center gap-2 mb-5 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm text-amber-400/90">{t('mockCard.tokenomicsTbd')}</span>
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

      {/* ════════ 2. ECOSYSTEM PROJECTS SLIDER ════════ */}
      <ProjectSlider t={t} />

      {/* ════════ 4. LAUNCH TOKEN ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('launchToken.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-10 max-w-2xl mx-auto">
            {t('launchToken.subtitle')}
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {(['allProducts', 'governance', 'community', 'utility'] as const).map(key => (
              <motion.div key={key} variants={staggerItem} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-5 text-center">
                <p className="text-sm text-gray-300">{t(`launchToken.features.${key}`)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="https://image2url.com/r2/default/images/1770220782157-0e2ab4ed-cb61-46aa-a681-b50a302b1254.png" alt="LAUNCH" className="w-14 h-14 rounded-xl" />
              <div>
                <p className="text-sm text-gray-500">{t('launchToken.tokenomics')}</p>
                <p className="text-lg font-bold text-white">{t('launchToken.tokenomicsTbd')}</p>
              </div>
            </div>
            <Link href="/wallet?tab=staking" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-violet-500/20">
              {t('launchToken.viewExplorer')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════ 4b. STAKING — HOW IT WORKS ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-10">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 mb-4">Staking</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{t('stakingSection.title')}</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {t('stakingSection.subtitle')}
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4 mb-10">
            {(['stake', 'earn', 'claim'] as const).map(key => (
              <motion.div key={key} variants={staggerItem} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 text-center">
                <span className="text-3xl mb-3 block">{t(`stakingSection.${key}.icon`)}</span>
                <h3 className="text-white font-semibold text-lg mb-2">{t(`stakingSection.${key}.title`)}</h3>
                <p className="text-sm text-gray-400">{t(`stakingSection.${key}.desc`)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="flex justify-center">
            <Link href="/wallet?tab=staking">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-lg font-medium rounded-xl shadow-lg shadow-violet-500/25 transition-all">
                {t('stakingSection.cta')}
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════ 5. COMMUNITY & CONTRIBUTION ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-3">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('community.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-center mb-10 max-w-xl mx-auto">
            {t('community.subtitle')}
          </motion.p>

          <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://t.me/axiome" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all">
              {t('community.submitIdea')}
            </a>
            <a href="https://t.me/axiome" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 border border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/10 text-gray-300 hover:text-white font-medium rounded-xl transition-all">
              {t('community.joinCommunity')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════════ 6. VISION ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h2 {...fadeUp} className="text-2xl md:text-3xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('vision.title')}</span>
          </motion.h2>
          <motion.p {...fadeUp} className="text-gray-400 text-lg leading-relaxed">
            {t('vision.text')}
          </motion.p>
        </div>
      </section>

      {/* ════════ 7. FINAL CTA ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-violet-600/15 rounded-3xl blur-3xl" />
            <div className="relative bg-gray-900/40 backdrop-blur-sm border border-gray-800/50 rounded-3xl p-10 md:p-14 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  {t('cta.title')}
                </span>
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                {t('cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-lg font-medium rounded-xl shadow-2xl shadow-indigo-500/25 transition-all">
                    {t('hero.cta1')}
                  </motion.span>
                </Link>
                <Link href="/explorer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 border border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/10 text-gray-200 text-lg font-medium rounded-xl transition-all">
                    {t('hero.cta2')}
                  </motion.span>
                </Link>
              </div>
              <Link href="/docs" className="inline-block mt-4 text-sm text-violet-400 hover:text-violet-300 transition-colors">
                {t('hero.docsLink')} &rarr;
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
