'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

const SECTIONS = [
  { id: 'overview', labelKey: 'overview' },
  { id: 'coinflip', labelKey: 'headsOrTails' },
  { id: 'token', labelKey: 'token' },
  { id: 'projects', labelKey: 'projects' },
  { id: 'vision', labelKey: 'vision' },
  { id: 'disclaimer', labelKey: 'disclaimer' },
]

const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

function Sidebar({ active, t }: { active: string; t: (key: string) => string }) {
  return (
    <nav className="hidden xl:block fixed top-28 left-8 w-48 space-y-1 text-sm">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">{t('sidebar.onThisPage')}</div>
      {SECTIONS.map(s => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`block px-3 py-1.5 rounded-lg transition-colors ${
            active === s.id ? 'bg-indigo-500/15 text-indigo-400 font-medium' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {t(`sidebar.${s.labelKey}`)}
        </a>
      ))}
    </nav>
  )
}

export default function DocsPage() {
  const t = useTranslations('docs')
  const [activeSection, setActiveSection] = useState('overview')

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

  const fadeUp = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121e]">
      <Sidebar active={activeSection} t={t} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 xl:ml-64">

        {/* ──── 1. OVERVIEW ──── */}
        <motion.section id="overview" className="mb-20" {...fadeUp}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
            <span className="text-indigo-400 text-sm font-medium">{t('overview.badge')}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('overview.title')}</h1>
          <p className="text-xl text-zinc-300 mb-6 max-w-2xl">
            {t('overview.subtitle')}
          </p>
          <p className="text-zinc-400 leading-relaxed max-w-2xl mb-8">
            {t('overview.description')}
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { titleKey: 'card1Title', descKey: 'card1Desc', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { titleKey: 'card2Title', descKey: 'card2Desc', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { titleKey: 'card3Title', descKey: 'card3Desc', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
            ].map(card => (
              <div key={card.titleKey} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <div className="w-10 h-10 bg-indigo-500/15 rounded-lg flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">{t(`overview.${card.titleKey}`)}</h3>
                <p className="text-sm text-zinc-400">{t(`overview.${card.descKey}`)}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <a href={COINFLIP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20">
              {t('overview.cta1')}
            </a>
            <Link href="/explorer" className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm font-medium rounded-xl transition-all">
              {t('overview.cta2')}
            </Link>
          </div>
        </motion.section>

        {/* ──── 2. HEADS OR TAILS (COINFLIP) ──── */}
        <motion.section id="coinflip" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('coinflip.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('coinflip.subtitle')}
          </p>

          <div className="space-y-6">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-6">
              <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                <span className="text-xl">🪙</span>
                {t('coinflip.howItWorks')}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                {t('coinflip.howDesc')}
              </p>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center">{i}</span>
                    <div>
                      <p className="text-white font-medium text-sm">{t(`coinflip.step${i}Title`)}</p>
                      <p className="text-zinc-400 text-sm">{t(`coinflip.step${i}Desc`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2">{t('coinflip.commissionTitle')}</h4>
                <p className="text-sm text-zinc-400">{t('coinflip.commissionDesc')}</p>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
                <h4 className="text-white font-semibold mb-2">{t('coinflip.securityTitle')}</h4>
                <p className="text-sm text-zinc-400">{t('coinflip.securityDesc')}</p>
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <h4 className="text-white font-semibold mb-4">{t('coinflip.paramsTitle')}</h4>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• {t('coinflip.paramMinBet')}</li>
                <li>• {t('coinflip.paramBetExpiry')}</li>
                <li>• {t('coinflip.paramRevealTimeout')}</li>
                <li>• {t('coinflip.paramOneClick')}</li>
              </ul>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-6">
              <h4 className="text-indigo-400 font-semibold mb-2">{t('coinflip.referralTitle')}</h4>
              <p className="text-sm text-zinc-400 mb-4">{t('coinflip.referralDesc')}</p>
              <ul className="space-y-1 text-sm text-zinc-400">
                <li>• {t('coinflip.referralL1')}</li>
                <li>• {t('coinflip.referralL2')}</li>
                <li>• {t('coinflip.referralL3')}</li>
              </ul>
            </div>

            <a href={COINFLIP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all">
              {t('coinflip.playNow')}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </a>
          </div>
        </motion.section>

        {/* ──── 3. LAUNCH TOKEN ──── */}
        <motion.section id="token" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('token.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('token.subtitle')}
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { key: 'allProducts', color: 'blue', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V5a2 2 0 00-2-2M5 9V7a2 2 0 012-2m6 0v2a2 2 0 012 2m0 0V5a2 2 0 002 2 2 2 0 002-2V7a2 2 0 01-2-2h-2m0 0V5a2 2 0 012-2' },
              { key: 'governance', color: 'violet', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { key: 'ecosystem', color: 'emerald', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            ].map(c => (
              <div key={c.key} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${c.color === 'blue' ? 'bg-blue-500/15' : c.color === 'violet' ? 'bg-violet-500/15' : 'bg-emerald-500/15'}`}>
                  <svg className={`w-6 h-6 ${c.color === 'blue' ? 'text-blue-400' : c.color === 'violet' ? 'text-violet-400' : 'text-emerald-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={c.icon} /></svg>
                </div>
                <h3 className="text-white font-semibold mb-1">{t(`token.${c.key}.title`)}</h3>
                <p className="text-sm text-zinc-400">{t(`token.${c.key}.desc`)}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-zinc-900/40 border border-amber-500/10 rounded-xl p-5 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">{t('token.totalSupply')}</span>{' '}
              <span className="text-amber-400 font-medium">{t('token.supplyTbd')}</span>
            </p>
          </div>
        </motion.section>

        {/* ──── 4. PROJECTS & COMMUNITY ──── */}
        <motion.section id="projects" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('projects.title')}</h2>
          <p className="text-zinc-400 mb-8 max-w-2xl">
            {t('projects.subtitle')}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-indigo-500/15 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{t('projects.createTitle')}</h3>
              <p className="text-sm text-zinc-400 mb-4">{t('projects.createDesc')}</p>
              <Link href="/create" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                {t('projects.createCta')} →
              </Link>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-indigo-500/15 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <h3 className="text-white font-semibold mb-2">{t('projects.commentsTitle')}</h3>
              <p className="text-sm text-zinc-400 mb-4">{t('projects.commentsDesc')}</p>
              <Link href="/explorer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
                {t('projects.commentsCta')} →
              </Link>
            </div>
          </div>
        </motion.section>

        {/* ──── 5. VISION ──── */}
        <motion.section id="vision" className="mb-20" {...fadeUp}>
          <h2 className="text-2xl font-bold text-white mb-2">{t('vision.title')}</h2>
          <p className="text-zinc-400 leading-relaxed max-w-2xl">
            {t('vision.text')}
          </p>
        </motion.section>

        {/* ──── 6. DISCLAIMER ──── */}
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
