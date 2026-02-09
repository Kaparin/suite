'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { LockPanel } from '@/components/lock/LockPanel'

/* ─── Tier data ─── */

const TIERS = [
  {
    key: 'explorer',
    tier: 'EXPLORER' as const,
    amount: '100',
    period: '7',
    color: 'blue',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    borderColor: 'rgba(59,130,246,0.2)',
    iconBg: 'rgba(59,130,246,0.15)',
    iconColor: '#60A5FA',
    glowColor: 'rgba(59,130,246,0.08)',
  },
  {
    key: 'builder',
    tier: 'BUILDER' as const,
    amount: '1,000',
    period: '30',
    color: 'violet',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    borderColor: 'rgba(139,92,246,0.2)',
    iconBg: 'rgba(139,92,246,0.15)',
    iconColor: '#A78BFA',
    glowColor: 'rgba(139,92,246,0.08)',
  },
  {
    key: 'founder',
    tier: 'FOUNDER' as const,
    amount: '10,000',
    period: '90',
    color: 'pink',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    borderColor: 'rgba(236,72,153,0.2)',
    iconBg: 'rgba(236,72,153,0.15)',
    iconColor: '#F472B6',
    glowColor: 'rgba(236,72,153,0.08)',
  },
  {
    key: 'governor',
    tier: 'GOVERNOR' as const,
    amount: '100,000',
    period: '180',
    color: 'amber',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    borderColor: 'rgba(245,158,11,0.2)',
    iconBg: 'rgba(245,158,11,0.15)',
    iconColor: '#FBBF24',
    glowColor: 'rgba(245,158,11,0.08)',
  },
]

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

/* ─── Page ─── */

export default function LockPage() {
  const t = useTranslations('lock')

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121e]">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
          {/* ─── Hero ─── */}
          <motion.div className="text-center mb-12" {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <svg
                className="w-4 h-4 text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span className="text-violet-400 text-sm font-medium">
                {t('page.badge')}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {t('page.title')}
              </span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
              {t('page.subtitle')}
            </p>
          </motion.div>

          {/* ─── Lock Panel ─── */}
          <motion.div {...fadeUp} transition={{ delay: 0.1, duration: 0.5 }}>
            <LockPanel />
          </motion.div>

          {/* ─── Tier Comparison Grid ─── */}
          <motion.section className="mt-16" {...fadeUp} transition={{ delay: 0.2, duration: 0.5 }}>
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {t('tiers.title')}
            </h2>
            <p className="text-zinc-400 mb-8 text-center max-w-2xl mx-auto">
              {t('tiers.subtitle')}
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {TIERS.map((tier, index) => (
                <motion.div
                  key={tier.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 flex flex-col"
                  style={{
                    borderColor: tier.borderColor,
                    background: `linear-gradient(135deg, ${tier.glowColor} 0%, transparent 50%)`,
                  }}
                >
                  {/* Tier Icon + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: tier.iconBg }}
                    >
                      <svg
                        className="w-5 h-5"
                        style={{ color: tier.iconColor }}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d={tier.icon}
                        />
                      </svg>
                    </div>
                    <h3 className="text-white font-bold">{t(`tiers.${tier.key}.name`)}</h3>
                  </div>

                  {/* Amount + Duration */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-white">{tier.amount}</div>
                    <div className="text-xs text-zinc-500">
                      LAUNCH / {tier.period} {t('form.days')}
                    </div>
                  </div>

                  {/* Perks */}
                  <ul className="space-y-2 flex-1">
                    {[1, 2, 3].map((i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-zinc-400"
                      >
                        <svg
                          className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {t(`tiers.${tier.key}.perk${i}`)}
                      </li>
                    ))}
                  </ul>

                  {/* Lock Button */}
                  <button
                    onClick={() => {
                      // Scroll to lock form at top
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="mt-4 w-full py-2 text-sm font-medium rounded-lg border transition-colors hover:bg-white/5"
                    style={{
                      borderColor: tier.borderColor,
                      color: tier.iconColor,
                    }}
                  >
                    {t('tiers.lockButton')}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* ─── Disclaimer ─── */}
          <motion.div
            className="mt-12"
            {...fadeUp}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5">
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
                <p className="text-sm text-zinc-500">
                  {t('page.disclaimer')}
                </p>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </AuthGuard>
  )
}
