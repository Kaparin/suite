'use client'

import { useState, useCallback, useEffect } from 'react'
import { AXMPriceTicker } from '@/components/price/AXMPriceTicker'
import { MeshGradient } from '@/components/animations/MeshGradient'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import useEmblaCarousel from 'embla-carousel-react'

/* ── Animation helpers ── */
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

/* ── Constants ── */
const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

/* ── Project Slider ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectSlider({ t }: { t: any }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 25 })
  const [activeSlide, setActiveSlide] = useState(0)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])
  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveSlide(emblaApi.selectedScrollSnap())
    emblaApi.on('select', onSelect)
    onSelect()
    return () => { emblaApi.off('select', onSelect) }
  }, [emblaApi])

  return (
    <section className="py-16 md:py-20">
      <div className="container-page">
        <motion.div {...fadeInUp} className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
            {t('ecosystem.title')}
          </h2>
        </motion.div>

        <div className="relative group">
          {/* Nav arrows */}
          <button
            onClick={scrollPrev}
            aria-label="Previous"
            className="absolute -left-3 md:-left-5 top-1/2 -translate-y-1/2 z-10 flex w-10 h-10 items-center justify-center rounded-full bg-surface-1 border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-all opacity-0 group-hover:opacity-100 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button
            onClick={scrollNext}
            aria-label="Next"
            className="absolute -right-3 md:-right-5 top-1/2 -translate-y-1/2 z-10 flex w-10 h-10 items-center justify-center rounded-full bg-surface-1 border border-border text-text-tertiary hover:text-text-primary hover:border-border-hover transition-all opacity-0 group-hover:opacity-100 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>

          <div className="overflow-hidden rounded-[var(--radius-xl)]" ref={emblaRef}>
            <div className="flex">
              {/* Slide 1 — Heads or Tails */}
              <div className="flex-[0_0_100%] min-w-0">
                <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-900/15 via-transparent to-blue-900/10" />

                  <div className="relative z-10 p-6 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                      <div className="shrink-0 self-center md:self-start">
                        <Image
                          src="/heads-or-tails-logo-landing.png"
                          alt="Heads or Tails"
                          width={200}
                          height={200}
                          className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success)]/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
                            Live
                          </span>
                          <span className="text-xs text-text-tertiary font-medium">#1 Project</span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">{t('coinflip.title')}</h3>
                        <p className="text-text-secondary text-sm md:text-base mb-5 max-w-xl">{t('coinflip.subtitle')}</p>

                        <div className="flex flex-wrap gap-2 mb-5">
                          {(['pvp', 'realStakes', 'platformFee', 'instantMatch', 'tournaments'] as const).map(key => (
                            <span key={key} className="chip text-xs">
                              {t(`coinflip.features.${key}`)}
                            </span>
                          ))}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-3">
                          <a href={COINFLIP_URL} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200 text-sm active:scale-[0.97]"
                          >
                            {t('coinflip.playNow')}
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                          </a>
                          <Link href="/docs/coinflip" className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-accent transition-colors py-2.5">
                            {t('coinflip.viewMechanics')} <span aria-hidden="true">&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slide 2 — Checkers */}
              <div className="flex-[0_0_100%] min-w-0">
                <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-900/15 via-transparent to-blue-900/10" />

                  <div className="relative z-10 p-6 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                      <div className="shrink-0 self-center md:self-start">
                        <Image
                          src="/checkers-logo-with-text.png"
                          alt="Checkers"
                          width={200}
                          height={200}
                          className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 object-contain opacity-90"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-surface-2 text-text-secondary border border-border">
                            {t('ecosystem.tbd.status')}
                          </span>
                          <span className="text-xs text-text-tertiary font-medium">#2 Project</span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-2">{t('ecosystem.tbd.title')}</h3>
                        <p className="text-text-secondary text-sm md:text-base max-w-xl">{t('ecosystem.tbd.desc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-5">
            {[0, 1].map(i => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-8 bg-accent' : 'w-2 bg-surface-3 hover:bg-text-tertiary'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Stat Card ── */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <motion.div variants={staggerItem} className="bg-surface-1 border border-border rounded-[var(--radius-lg)] p-5 text-center">
      <div className="flex justify-center mb-3 text-accent">{icon}</div>
      <p className="text-2xl font-bold text-text-primary mb-1">{value}</p>
      <p className="text-sm text-text-secondary">{label}</p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════ */
/* ══════════════ PAGE ════════════════════ */
/* ═══════════════════════════════════════════ */
export default function HomePage() {
  const t = useTranslations('home')

  return (
    <div className="min-h-screen">
      {/* Animated mesh gradient background — visible on all sections */}
      <MeshGradient />

      {/* ════ HERO ════ */}
      <section className="relative pt-10 sm:pt-14 md:pt-20 pb-16 sm:pb-24 overflow-hidden">
        {/* Hero-specific glow — brighter accent blob behind logo area */}
        <motion.div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[500px] sm:w-[700px] md:w-[900px] h-[400px] sm:h-[500px] md:h-[600px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(32, 129, 226, 0.15) 0%, rgba(139, 92, 246, 0.08) 30%, transparent 70%)',
            filter: 'blur(60px)',
          }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="container-page relative z-10">
          {/* Logo — large, with animated glow underneath */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center mb-6 sm:mb-10 relative"
          >
            {/* Glow layer beneath logo */}
            <motion.div
              className="absolute left-1/2 -translate-x-1/2 top-[55%] w-[300px] sm:w-[500px] md:w-[700px] h-[120px] sm:h-[180px] md:h-[220px] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(32, 129, 226, 0.25) 0%, rgba(139, 92, 246, 0.15) 30%, transparent 70%)',
                filter: 'blur(40px)',
              }}
              animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Image
              src="/axiome-launch-suite-logo.png"
              alt="Axiome Launch Suite"
              width={800}
              height={288}
              className="h-28 sm:h-40 md:h-56 lg:h-64 w-auto object-contain mx-auto relative z-10 drop-shadow-[0_0_30px_rgba(32,129,226,0.2)]"
              priority
            />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left — copy */}
            <motion.div variants={stagger} initial="hidden" animate="visible" className="text-center lg:text-left">
              <motion.div variants={staggerItem} className="flex flex-wrap justify-center lg:justify-start gap-2 mb-5">
                {(['ecosystem', 'launchToken', 'liveProduct'] as const).map(badgeKey => (
                  <span key={badgeKey} className="chip text-xs">
                    <svg className="w-3 h-3 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {t(`badges.${badgeKey}`)}
                  </span>
                ))}
              </motion.div>

              <motion.h1 variants={staggerItem} className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.1] mb-5">
                <span className="bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent">
                  {t('hero.title')}
                </span>
              </motion.h1>

              <motion.p variants={staggerItem} className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed mb-4">
                {t('hero.subtitle')}<br />
                <span className="text-text-primary font-medium">{t('hero.subtitle2')}</span>
              </motion.p>

              <motion.div variants={staggerItem} className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-5">
                <Link href="#projects"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-accent hover:bg-accent-hover text-white text-sm sm:text-base font-semibold rounded-[var(--radius-md)] shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 transition-all duration-200 active:scale-[0.97]"
                >
                  {t('hero.cta1')}
                </Link>
                <Link href="/explorer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-border hover:border-border-hover text-text-primary text-sm sm:text-base font-semibold rounded-[var(--radius-md)] transition-all duration-200 hover:bg-surface-2 active:scale-[0.97]"
                >
                  {t('hero.cta2')}
                </Link>
              </motion.div>

              <motion.div variants={staggerItem} className="flex justify-center lg:justify-start items-center gap-4">
                <Link href="/docs" className="text-sm text-accent hover:text-accent-hover transition-colors flex items-center gap-1 font-medium">
                  {t('hero.docsLink')} <span aria-hidden="true">&rarr;</span>
                </Link>
              </motion.div>

              <motion.div variants={staggerItem} className="mt-5 inline-flex items-center gap-2 text-xs text-text-tertiary">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {t('hero.poweredBy')}
              </motion.div>
            </motion.div>

            {/* Right — mock token preview card */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-4 rounded-[var(--radius-xl)]"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(32, 129, 226, 0.12) 0%, rgba(139, 92, 246, 0.06) 50%, transparent 70%)' }}
                  animate={{ opacity: [0.6, 1, 0.6], scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="relative bg-surface-1 border border-border rounded-[var(--radius-xl)] p-6 shadow-lg">
                  {/* Header row */}
                  <div className="flex items-center gap-4 mb-5">
                    <img src="https://image2url.com/r2/default/images/1770220782157-0e2ab4ed-cb61-46aa-a681-b50a302b1254.png" alt="LAUNCH" className="w-14 h-14 rounded-[var(--radius-md)] shadow-md" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary font-bold text-lg">LAUNCH</span>
                        <span className="chip text-[10px] py-0.5">{t('mockCard.utility')}</span>
                      </div>
                      <span className="text-sm text-text-secondary">$LAUNCH</span>
                    </div>
                  </div>

                  {/* TBD notice */}
                  <div className="flex items-center gap-2 mb-5 p-3 bg-[var(--warning-bg)] border border-[var(--warning)]/15 rounded-[var(--radius-sm)]">
                    <svg className="w-4 h-4 text-[var(--warning)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-sm text-[var(--warning)]">{t('mockCard.tokenomicsTbd')}</span>
                  </div>

                  {/* Utility items */}
                  <div className="space-y-2.5 mb-5">
                    {([
                      { labelKey: 'utilityAccess' as const, icon: '🔑' },
                      { labelKey: 'utilityReputation' as const, icon: '⭐' },
                      { labelKey: 'utilityGovernance' as const, icon: '🗳️' },
                      { labelKey: 'utilityRewards' as const, icon: '🎁' },
                    ]).map(item => (
                      <div key={item.labelKey} className="flex items-center gap-2.5 text-sm">
                        <span className="text-base">{item.icon}</span>
                        <span className="text-text-secondary">{t(`mockCard.${item.labelKey}`)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="chip text-[10px] py-0.5">{t('mockCard.platformToken')}</span>
                    <span className="chip text-[10px] py-0.5">{t('mockCard.axiomeChain')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AXM ticker */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-10 flex justify-center">
            <div className="bg-surface-1 border border-border rounded-full px-6 py-3">
              <AXMPriceTicker showVolume showHighLow />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════ ECOSYSTEM PROJECTS SLIDER ════ */}
      <div id="projects">
        <ProjectSlider t={t} />
      </div>

      {/* ════ LAUNCH TOKEN ════ */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container-page max-w-5xl">
          <motion.h2 {...fadeInUp} className="text-2xl md:text-3xl font-bold text-center mb-2 text-text-primary">
            {t('launchToken.title')}
          </motion.h2>
          <motion.p {...fadeInUp} className="text-text-secondary text-center mb-10 max-w-2xl mx-auto">
            {t('launchToken.subtitle')}
          </motion.p>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {(['allProducts', 'governance', 'community', 'utility'] as const).map(key => (
              <motion.div key={key} variants={staggerItem} className="bg-surface-1 border border-border rounded-[var(--radius-lg)] p-5 text-center">
                <p className="text-sm text-text-secondary">{t(`launchToken.features.${key}`)}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div {...fadeInUp} className="bg-surface-1 border border-border rounded-[var(--radius-xl)] p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src="https://image2url.com/r2/default/images/1770220782157-0e2ab4ed-cb61-46aa-a681-b50a302b1254.png" alt="LAUNCH" className="w-14 h-14 rounded-[var(--radius-md)]" />
              <div>
                <p className="text-sm text-text-tertiary">{t('launchToken.tokenomics')}</p>
                <p className="text-lg font-bold text-text-primary">{t('launchToken.tokenomicsTbd')}</p>
              </div>
            </div>
            <Link href="/wallet?tab=staking" className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-[var(--radius-md)] transition-all duration-200 shadow-sm hover:shadow-md">
              {t('launchToken.viewExplorer')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════ STAKING ════ */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container-page max-w-5xl">
          <motion.div {...fadeInUp} className="text-center mb-10">
            <span className="chip text-xs mb-4 inline-flex">Staking</span>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-text-primary">
              {t('stakingSection.title')}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto text-base">
              {t('stakingSection.subtitle')}
            </p>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4 mb-10">
            {(['stake', 'earn', 'claim'] as const).map(key => (
              <StatCard
                key={key}
                icon={<span className="text-2xl">{t(`stakingSection.${key}.icon`)}</span>}
                value={t(`stakingSection.${key}.title`)}
                label={t(`stakingSection.${key}.desc`)}
              />
            ))}
          </motion.div>

          <motion.div {...fadeInUp} className="flex justify-center">
            <Link href="/wallet?tab=staking"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white text-base font-semibold rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97]"
            >
              {t('stakingSection.cta')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════ COMMUNITY ════ */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container-page max-w-5xl">
          <motion.h2 {...fadeInUp} className="text-2xl md:text-3xl font-bold text-center mb-2 text-text-primary">
            {t('community.title')}
          </motion.h2>
          <motion.p {...fadeInUp} className="text-text-secondary text-center mb-8 max-w-xl mx-auto">
            {t('community.subtitle')}
          </motion.p>

          <motion.div {...fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href="https://t.me/axiome" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-[var(--radius-md)] transition-all duration-200"
            >
              {t('community.submitIdea')}
            </a>
            <a href="https://t.me/axiome" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:border-border-hover text-text-primary font-semibold rounded-[var(--radius-md)] transition-all duration-200 hover:bg-surface-2"
            >
              {t('community.joinCommunity')}
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════ VISION ════ */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container-page max-w-3xl text-center">
          <motion.h2 {...fadeInUp} className="text-2xl md:text-3xl font-bold mb-5 text-text-primary">
            {t('vision.title')}
          </motion.h2>
          <motion.p {...fadeInUp} className="text-text-secondary text-base md:text-lg leading-relaxed">
            {t('vision.text')}
          </motion.p>
        </div>
      </section>

      {/* ════ FINAL CTA ════ */}
      <section className="py-16 md:py-20 border-t border-border">
        <div className="container-page max-w-5xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative bg-surface-1 border border-border rounded-[var(--radius-xl)] p-8 md:p-14 text-center overflow-hidden">
              {/* Subtle bg accent */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3 pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 text-text-primary">
                  {t('cta.title')}
                </h2>
                <p className="text-text-secondary mb-8 max-w-lg mx-auto text-base">
                  {t('cta.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="#projects"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-accent hover:bg-accent-hover text-white text-base font-semibold rounded-[var(--radius-md)] shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.97]"
                  >
                    {t('hero.cta1')}
                  </Link>
                  <Link href="/explorer"
                    className="inline-flex items-center gap-2 px-8 py-3.5 border border-border hover:border-border-hover text-text-primary text-base font-semibold rounded-[var(--radius-md)] transition-all duration-200 hover:bg-surface-2 active:scale-[0.97]"
                  >
                    {t('hero.cta2')}
                  </Link>
                </div>
                <Link href="/docs" className="inline-block mt-4 text-sm text-accent hover:text-accent-hover transition-colors font-medium">
                  {t('hero.docsLink')} &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
