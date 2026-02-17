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
const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

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
                <a href="https://coinflip.axiome-launch.com/game" target="_blank" rel="noopener noreferrer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm sm:text-base font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all">
                    {t('hero.cta1')}
                  </motion.span>
                </a>
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

      {/* ════════ 2. HEADS OR TAILS — MAIN PRODUCT ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center mb-12">
            <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 mb-4">Live</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('coinflip.title')}</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              {t('coinflip.subtitle')}
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            {(['pvp', 'realStakes', 'platformFee', 'instantMatch', 'tournaments'] as const).map(key => (
              <motion.div key={key} variants={staggerItem} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-300">{t(`coinflip.features.${key}`)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="https://coinflip.axiome-launch.com/game" target="_blank" rel="noopener noreferrer">
              <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all">
                {t('coinflip.playNow')}
              </motion.span>
            </a>
            <a href="https://coinflip.axiome-launch.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              {t('coinflip.viewMechanics')} &rarr;
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════════ 3. ECOSYSTEM PROJECTS SLIDER ════════ */}
      <section className="relative z-20 py-20 border-t border-gray-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{t('ecosystem.title')}</span>
          </motion.h2>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(['headsOrTails', 'tournaments', 'communityProjects', 'tbd'] as const).map(key => {
              const statusColor = key === 'headsOrTails' ? 'emerald' : key === 'tournaments' ? 'amber' : key === 'communityProjects' ? 'blue' : 'gray'
              const href = key === 'headsOrTails' ? 'https://coinflip.axiome-launch.com/game' : '#'
              const content = (
                <div className="h-full bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700/80 transition-all duration-300 hover:-translate-y-1">
                  <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full border mb-4 ${statusColor === 'emerald' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : statusColor === 'amber' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : statusColor === 'blue' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20' : 'bg-gray-500/15 text-gray-400 border-gray-500/20'}`}>
                    {t(`ecosystem.${key}.status`)}
                  </span>
                  <h3 className="text-white font-semibold text-lg mb-2">{t(`ecosystem.${key}.title`)}</h3>
                  <p className="text-sm text-gray-400">{t(`ecosystem.${key}.desc`)}</p>
                </div>
              )
              return (
                <motion.div key={key} variants={staggerItem}>
                  {href.startsWith('http') ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="block h-full">{content}</a>
                  ) : (
                    <div className="h-full">{content}</div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

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
            <Link href="/explorer" className="px-5 py-2.5 border border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/10 text-gray-300 hover:text-white text-sm font-medium rounded-xl transition-all">
              {t('launchToken.viewExplorer')}
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
                <a href="https://coinflip.axiome-launch.com/game" target="_blank" rel="noopener noreferrer">
                  <motion.span whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500 text-white text-lg font-medium rounded-xl shadow-2xl shadow-indigo-500/25 transition-all">
                    {t('hero.cta1')}
                  </motion.span>
                </a>
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
