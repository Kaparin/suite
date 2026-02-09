'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

/* ───────── data ───────── */

const SECTIONS = [
  { id: 'hero', labelKey: 'overview' },
  { id: 'why', labelKey: 'whyLaunch' },
  { id: 'features', labelKey: 'features' },
  { id: 'token', labelKey: 'token' },
  { id: 'access', labelKey: 'accessTiers' },
  { id: 'reputation', labelKey: 'reputation' },
  { id: 'rewards', labelKey: 'rewards' },
  { id: 'monetization', labelKey: 'monetization' },
  { id: 'fee-split', labelKey: 'feeSplit' },
  { id: 'allocation', labelKey: 'allocation' },
  { id: 'governance', labelKey: 'governance' },
  { id: 'transparency', labelKey: 'transparency' },
  { id: 'disclaimer', labelKey: 'disclaimer' },
]

const featuresKeys = [
  { key: 'tokenProfiles', color: 'emerald' },
  { key: 'projectHub', color: 'emerald' },
  { key: 'verifiedLinks', color: 'emerald' },
  { key: 'communityFeedback', color: 'emerald' },
  { key: 'transparency', color: 'amber' },
  { key: 'aiStudio', color: 'emerald' },
]

const tierKeys = [
  { key: 'explorer', amount: '100', period: '7 days', color: 'blue', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { key: 'builder', amount: '1,000', period: '30 days', color: 'violet', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { key: 'founder', amount: '10,000', period: '90 days', color: 'pink', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { key: 'governor', amount: '100,000', period: '180 days', color: 'amber', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
]

const revenueKeys = [
  { key: 'devOps', pct: 30, color: '#3B82F6' },
  { key: 'buyback', pct: 25, color: '#8B5CF6' },
  { key: 'communityRewards', pct: 25, color: '#10B981' },
  { key: 'grants', pct: 20, color: '#F59E0B' },
]

const distributionKeys = [
  { key: 'liquidity', pct: 20, color: '#06B6D4' },
  { key: 'communityGrowth', pct: 25, color: '#10B981' },
  { key: 'treasury', pct: 20, color: '#3B82F6' },
  { key: 'team', pct: 15, color: '#8B5CF6' },
  { key: 'partnerships', pct: 10, color: '#EC4899' },
  { key: 'accelerator', pct: 10, color: '#F59E0B' },
]

const monetizationKeys = [
  { key: 'verified', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { key: 'analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { key: 'laas', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { key: 'accelerator', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

const rewardTaskKeys = [
  { key: 'tokenReview' },
  { key: 'scamReport' },
  { key: 'projectUpdate' },
  { key: 'communityHelp' },
]

/* ───────── Donut chart ───────── */

function DonutChart({ data, label }: { data: { name: string; pct: number; color: string }[]; label: string }) {
  let cumulative = 0
  return (
    <div className="relative w-56 h-56 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {data.map((item, i) => {
          const start = cumulative * 3.6
          cumulative += item.pct
          const end = cumulative * 3.6
          const sr = (start * Math.PI) / 180
          const er = (end * Math.PI) / 180
          const x1 = 50 + 40 * Math.cos(sr)
          const y1 = 50 + 40 * Math.sin(sr)
          const x2 = 50 + 40 * Math.cos(er)
          const y2 = 50 + 40 * Math.sin(er)
          const large = item.pct > 50 ? 1 : 0
          return (
            <path key={i} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`} fill={item.color} className="hover:opacity-80 transition-opacity cursor-pointer" />
          )
        })}
        <circle cx="50" cy="50" r="24" fill="#0f0f1a" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-zinc-400 font-medium">{label}</span>
      </div>
    </div>
  )
}

/* ───────── Sidebar ───────── */

function Sidebar({ active, t }: { active: string; t: (key: string) => string }) {
  return (
    <nav className="hidden xl:block fixed top-28 left-8 w-48 space-y-1 text-sm">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t('sidebar.onThisPage')}</div>
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`block px-3 py-1.5 rounded-lg transition-colors ${
            active === s.id ? 'bg-violet-500/15 text-violet-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t(`sidebar.${s.labelKey}`)}
        </a>
      ))}
    </nav>
  )
}

/* ───────── Page ───────── */

export default function LaunchDocsPage() {
  const t = useTranslations('docs')
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px' }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  /* Translated data arrays for DonutChart */
  const revenueAllocation = revenueKeys.map(r => ({
    name: t(`feeSplit.${r.key}`),
    pct: r.pct,
    color: r.color,
  }))

  const tokenDistribution = distributionKeys.map(d => ({
    name: t(`allocation.${d.key}`),
    pct: d.pct,
    color: d.color,
  }))

  const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121e]">
      <Sidebar active={activeSection} t={t} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 xl:ml-64">

        {/* ──── 1. HERO ──── */}
        <motion.section id="hero" className="mb-20" {...fadeUp}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
            <span className="text-violet-400 text-sm font-medium">{t('hero.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('hero.title')}</h1>
          <p className="text-xl text-zinc-300 mb-6 max-w-2xl">
            {t('hero.subtitle')}
          </p>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-8">
            {t('hero.description')}
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { titleKey: 'card1Title', descKey: 'card1Desc', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' },
              { titleKey: 'card2Title', descKey: 'card2Desc', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { titleKey: 'card3Title', descKey: 'card3Desc', icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z' },
            ].map(card => (
              <div key={card.titleKey} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <div className="w-10 h-10 bg-violet-500/15 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">{t(`hero.${card.titleKey}`)}</h3>
                <p className="text-sm text-zinc-400">{t(`hero.${card.descKey}`)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/explorer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-500/20">
              {t('hero.cta1')}
            </Link>
            <a href="#allocation" className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm font-medium rounded-xl transition-all">
              {t('hero.cta2')}
            </a>
          </div>
        </motion.section>

        {/* ──── 2. WHY ──── */}
        <motion.section id="why" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-6">{t('why.title')}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-6">
              <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {t('why.problemTitle')}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t('why.problemText')}
              </p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('why.solutionTitle')}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {t('why.solutionText')}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              { icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z', textKey: 'value1' },
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', textKey: 'value2' },
              { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', textKey: 'value3' },
            ].map(item => (
              <div key={item.textKey} className="flex items-start gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                <span className="text-sm text-zinc-300">{t(`why.${item.textKey}`)}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──── 3. FEATURES ──── */}
        <motion.section id="features" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-6">{t('features.title')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {featuresKeys.map(f => (
              <div key={f.key} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">{t(`features.${f.key}.title`)}</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      f.color === 'emerald' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>{t(`features.${f.key}.badge`)}</span>
                  </div>
                  <p className="text-sm text-zinc-400">{t(`features.${f.key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──── 4. TOKEN ──── */}
        <motion.section id="token" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('token.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('token.subtitle')}
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { key: 'access', color: 'blue', icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z' },
              { key: 'reputation', color: 'violet', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { key: 'rewards', color: 'emerald', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map(c => (
              <div key={c.key} className={`bg-${c.color}-500/5 border border-${c.color}-500/15 rounded-xl p-6 text-center`} style={{ background: `${c.color === 'blue' ? 'rgba(59,130,246,0.05)' : c.color === 'violet' ? 'rgba(139,92,246,0.05)' : 'rgba(16,185,129,0.05)'}`, borderColor: `${c.color === 'blue' ? 'rgba(59,130,246,0.15)' : c.color === 'violet' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${c.color === 'blue' ? 'rgba(59,130,246,0.15)' : c.color === 'violet' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'}` }}>
                  <svg className="w-6 h-6" style={{ color: c.color === 'blue' ? '#60A5FA' : c.color === 'violet' ? '#A78BFA' : '#34D399' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">{t(`token.${c.key}.title`)}</h3>
                <p className="text-sm text-zinc-400">{t(`token.${c.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──── 5. ACCESS TIERS ──── */}
        <motion.section id="access" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('access.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('access.subtitle')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierKeys.map(tier => (
              <div key={tier.key} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col" style={{ borderColor: `${tier.color === 'blue' ? 'rgba(59,130,246,0.2)' : tier.color === 'violet' ? 'rgba(139,92,246,0.2)' : tier.color === 'pink' ? 'rgba(236,72,153,0.2)' : 'rgba(245,158,11,0.2)'}` }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${tier.color === 'blue' ? 'rgba(59,130,246,0.15)' : tier.color === 'violet' ? 'rgba(139,92,246,0.15)' : tier.color === 'pink' ? 'rgba(236,72,153,0.15)' : 'rgba(245,158,11,0.15)'}` }}>
                    <svg className="w-5 h-5" style={{ color: tier.color === 'blue' ? '#60A5FA' : tier.color === 'violet' ? '#A78BFA' : tier.color === 'pink' ? '#F472B6' : '#FBBF24' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tier.icon} /></svg>
                  </div>
                  <h3 className="text-white font-bold">{t(`access.${tier.key}.name`)}</h3>
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-white">{tier.amount}</div>
                  <div className="text-xs text-zinc-500">LAUNCH / {tier.period}</div>
                </div>
                <ul className="space-y-2 flex-1">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                      <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      {t(`access.${tier.key}.perk${i}`)}
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full py-2 text-sm font-medium rounded-lg border transition-colors" style={{ borderColor: `${tier.color === 'blue' ? 'rgba(59,130,246,0.3)' : tier.color === 'violet' ? 'rgba(139,92,246,0.3)' : tier.color === 'pink' ? 'rgba(236,72,153,0.3)' : 'rgba(245,158,11,0.3)'}`, color: tier.color === 'blue' ? '#60A5FA' : tier.color === 'violet' ? '#A78BFA' : tier.color === 'pink' ? '#F472B6' : '#FBBF24' }}>
                  {t('access.lockButton')}
                </button>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──── 6. REPUTATION ──── */}
        <motion.section id="reputation" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('reputation.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('reputation.subtitle')}
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-violet-500/5 border border-violet-500/15 rounded-xl p-6">
              <div className="w-10 h-10 bg-violet-500/15 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{t('reputation.claim.title')}</h3>
              <p className="text-sm text-zinc-400">{t('reputation.claim.desc')}</p>
            </div>
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-6">
              <div className="w-10 h-10 bg-blue-500/15 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{t('reputation.update.title')}</h3>
              <p className="text-sm text-zinc-400">{t('reputation.update.desc')}</p>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{t('reputation.safety.title')}</h3>
              <p className="text-sm text-zinc-400">{t('reputation.safety.desc')}</p>
            </div>
          </div>
        </motion.section>

        {/* ──── 7. REWARDS ──── */}
        <motion.section id="rewards" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('rewards.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('rewards.subtitle')}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {rewardTaskKeys.map(r => (
              <div key={r.key} className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5 text-center">
                <div className="w-10 h-10 bg-emerald-500/15 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1 text-sm">{t(`rewards.${r.key}.title`)}</h3>
                <p className="text-xs text-zinc-400">{t(`rewards.${r.key}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">{t('rewards.pool')}</span>
              <span className="text-sm text-emerald-400 font-medium">{t('rewards.poolStatus')}</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" style={{ width: '65%' }} />
            </div>
            <p className="text-xs text-zinc-500 mt-2">{t('rewards.poolSource')}</p>
          </div>
        </motion.section>

        {/* ──── 8. MONETIZATION ──── */}
        <motion.section id="monetization" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-6">{t('monetization.title')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {monetizationKeys.map(m => (
              <div key={m.key} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={m.icon} /></svg>
                  </div>
                  <h3 className="text-white font-semibold">{t(`monetization.${m.key}.title`)}</h3>
                </div>
                <p className="text-sm text-zinc-400">{t(`monetization.${m.key}.desc`)}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──── 9. FEE SPLIT ──── */}
        <motion.section id="fee-split" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('feeSplit.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('feeSplit.subtitle')}
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <DonutChart data={revenueAllocation} label={t('feeSplit.chartLabel')} />
            <div className="space-y-3">
              {revenueAllocation.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-white font-medium">{item.name}</span>
                      <span className="text-sm text-zinc-400">{item.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.pct * 100 / 30}%`, backgroundColor: item.color }} />
                    </div>
                  </div>
                </div>
              ))}
              <p className="text-xs text-zinc-500 mt-2">{t('feeSplit.note')}</p>
            </div>
          </div>
        </motion.section>

        {/* ──── 10. ALLOCATION ──── */}
        <motion.section id="allocation" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('allocation.title')}</h2>
          <p className="text-zinc-400 mb-2">{t('allocation.totalSupply')} <span className="text-white font-bold">{t('allocation.totalAmount')}</span></p>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('allocation.subtitle')}
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <DonutChart data={tokenDistribution} label={t('allocation.chartLabel')} />
            <div className="space-y-3">
              {tokenDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-white">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium" style={{ color: item.color }}>{item.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vesting Timeline */}
          <div className="mt-10">
            <h3 className="text-lg font-semibold text-white mb-4">{t('allocation.vestingTitle')}</h3>
            <div className="relative">
              <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-zinc-800" />
              {[
                { periodKey: 'vesting1Period', descKey: 'vesting1Desc', color: '#06B6D4' },
                { periodKey: 'vesting2Period', descKey: 'vesting2Desc', color: '#EC4899' },
                { periodKey: 'vesting3Period', descKey: 'vesting3Desc', color: '#8B5CF6' },
                { periodKey: 'vesting4Period', descKey: 'vesting4Desc', color: '#10B981' },
              ].map(v => (
                <div key={v.periodKey} className="flex items-start gap-4 mb-4 last:mb-0">
                  <div className="w-8 h-8 rounded-full border-2 bg-zinc-900 flex items-center justify-center shrink-0 z-10" style={{ borderColor: v.color }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t(`allocation.${v.periodKey}`)}</div>
                    <div className="text-sm text-zinc-400">{t(`allocation.${v.descKey}`)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ──── 11. GOVERNANCE ──── */}
        <motion.section id="governance" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('governance.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('governance.subtitle')}
          </p>

          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <details key={i} className="group bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-5 cursor-pointer text-white font-medium hover:bg-zinc-800/30 transition-colors">
                  {t(`governance.faq${i}Q`)}
                  <svg className="w-5 h-5 text-zinc-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <div className="px-5 pb-5 text-sm text-zinc-400">{t(`governance.faq${i}A`)}</div>
              </details>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-4 bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <span className="px-3 py-1 bg-violet-500/15 text-violet-400 rounded-full text-xs font-medium">{t('governance.flowLock')}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className="px-3 py-1 bg-blue-500/15 text-blue-400 rounded-full text-xs font-medium">{t('governance.flowVote')}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 rounded-full text-xs font-medium">{t('governance.flowResult')}</span>
            </div>
          </div>
        </motion.section>

        {/* ──── 12. TRANSPARENCY ──── */}
        <motion.section id="transparency" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-6">{t('transparency.title')}</h2>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm text-zinc-300">{t(`transparency.item${i}`)}</span>
              </div>
            ))}
          </div>
          <button className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm rounded-xl transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            {t('transparency.viewTreasury')}
          </button>
        </motion.section>

        {/* ──── 13. DISCLAIMER ──── */}
        <motion.section id="disclaimer" className="mb-12" {...fadeUp}>
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-sm text-zinc-500">
                {t('disclaimer.text')}
              </p>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  )
}
