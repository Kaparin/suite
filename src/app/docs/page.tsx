'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { GiCrossedSwords, GiTrophy, GiCrown } from 'react-icons/gi'

const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

export default function DocsPage() {
  const t = useTranslations('docs')

  return (
    <>
      {/* ──── OVERVIEW ──── */}
      <motion.section id="overview" className="mb-20 scroll-mt-24" {...fadeUp}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
          <span className="text-indigo-400 text-sm font-medium">
            {t('overview.badge')}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {t('overview.title')}
        </h1>
        <p className="text-xl text-zinc-300 mb-6 max-w-2xl">
          {t('overview.subtitle')}
        </p>
        <p className="text-zinc-400 leading-relaxed max-w-2xl mb-8">
          {t('overview.description')}
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              titleKey: 'card1Title',
              descKey: 'card1Desc',
              icon: 'M13 10V3L4 14h7v7l9-11h-7z',
            },
            {
              titleKey: 'card2Title',
              descKey: 'card2Desc',
              icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              titleKey: 'card3Title',
              descKey: 'card3Desc',
              icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
            },
          ].map((card) => (
            <div
              key={card.titleKey}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5"
            >
              <div className="w-10 h-10 bg-indigo-500/15 rounded-lg flex items-center justify-center mb-3">
                <svg
                  className="w-5 h-5 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={card.icon}
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">
                {t(`overview.${card.titleKey}`)}
              </h3>
              <p className="text-sm text-zinc-400">
                {t(`overview.${card.descKey}`)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={COINFLIP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
          >
            {t('overview.cta1')}
          </a>
          <Link
            href="/explorer"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white text-sm font-medium rounded-xl transition-all"
          >
            {t('overview.cta2')}
          </Link>
        </div>
      </motion.section>

      {/* ──── PROJECTS ──── */}
      <motion.section id="projects" className="mb-20 scroll-mt-24" {...fadeUp}>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('projects.title')}
        </h2>
        <p className="text-zinc-400 mb-8 max-w-2xl">
          {t('projects.subtitle')}
        </p>

        <Link
          href="/docs/coinflip"
          className="group block bg-gradient-to-br from-amber-500/5 via-transparent to-indigo-500/5 border border-amber-500/20 hover:border-amber-400/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <GiCrossedSwords className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5">
                <h3 className="text-lg font-bold text-white">
                  {t('coinflip.title')}
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-sm text-zinc-400 mb-4 line-clamp-2">
                {t('coinflip.subtitle')}
              </p>
              <div className="flex items-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <GiTrophy className="w-3.5 h-3.5 text-amber-500/60" /> PvP
                </span>
                <span className="flex items-center gap-1.5">
                  <GiCrown className="w-3.5 h-3.5 text-amber-500/60" /> VIP
                </span>
                <span className="flex items-center gap-1 text-indigo-400/80 group-hover:text-indigo-400 transition-colors ml-auto">
                  {t('projects.readGuide')}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.section>

      {/* ──── LAUNCH TOKEN ──── */}
      <motion.section id="token" className="mb-20 scroll-mt-24" {...fadeUp}>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('token.title')}
        </h2>
        <p className="text-zinc-400 mb-8 max-w-2xl">{t('token.subtitle')}</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {(
            [
              {
                key: 'allProducts',
                color: 'blue',
                icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10',
              },
              {
                key: 'governance',
                color: 'violet',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              },
              {
                key: 'ecosystem',
                color: 'emerald',
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              },
            ] as const
          ).map((c) => (
            <div
              key={c.key}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 text-center"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                  c.color === 'blue'
                    ? 'bg-blue-500/15'
                    : c.color === 'violet'
                    ? 'bg-violet-500/15'
                    : 'bg-emerald-500/15'
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    c.color === 'blue'
                      ? 'text-blue-400'
                      : c.color === 'violet'
                      ? 'text-violet-400'
                      : 'text-emerald-400'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={c.icon}
                  />
                </svg>
              </div>
              <h3 className="text-white font-semibold mb-1">
                {t(`token.${c.key}.title`)}
              </h3>
              <p className="text-sm text-zinc-400">
                {t(`token.${c.key}.desc`)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 bg-zinc-900/40 border border-amber-500/10 rounded-xl p-5 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-amber-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">{t('token.totalSupply')}</span>{' '}
            <span className="text-amber-400 font-medium">
              {t('token.supplyTbd')}
            </span>
          </p>
        </div>
      </motion.section>

      {/* ──── STAKING ──── */}
      <motion.section id="staking" className="mb-20 scroll-mt-24" {...fadeUp}>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('staking.title')}
        </h2>
        <p className="text-zinc-400 mb-8 max-w-2xl">
          {t('staking.subtitle')}
        </p>

        <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-6 mb-6">
          <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">💰</span>
            {t('staking.howTitle')}
          </h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center">
                  {i}
                </span>
                <div>
                  <p className="text-white font-medium text-sm">
                    {t(`staking.step${i}Title`)}
                  </p>
                  <p className="text-zinc-400 text-sm">
                    {t(`staking.step${i}Desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-2">
              {t('staking.revenueTitle')}
            </h4>
            <p className="text-sm text-zinc-400">
              {t('staking.revenueDesc')}
            </p>
          </div>
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-2">
              {t('staking.modelTitle')}
            </h4>
            <p className="text-sm text-zinc-400">{t('staking.modelDesc')}</p>
          </div>
        </div>

        <Link
          href="/wallet?tab=staking"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-medium rounded-xl transition-all"
        >
          {t('staking.cta')}
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
      </motion.section>

      {/* ──── VISION ──── */}
      <motion.section id="vision" className="mb-20 scroll-mt-24" {...fadeUp}>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('vision.title')}
        </h2>
        <p className="text-zinc-400 leading-relaxed max-w-2xl">
          {t('vision.text')}
        </p>
      </motion.section>

      {/* ──── DISCLAIMER ──── */}
      <motion.section
        id="disclaimer"
        className="mb-12 scroll-mt-24"
        {...fadeUp}
      >
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-zinc-500">{t('disclaimer.text')}</p>
          </div>
        </div>
      </motion.section>
    </>
  )
}
