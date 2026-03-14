'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Rocket } from 'lucide-react'
import { GiCrossedSwords } from 'react-icons/gi'

const DOCS_NAV = [
  {
    key: 'overview' as const,
    href: '/docs',
    sections: [
      { id: 'overview', key: 'overview' },
      { id: 'projects', key: 'projects' },
      { id: 'token', key: 'token' },
      { id: 'staking', key: 'staking' },
      { id: 'vision', key: 'vision' },
    ],
  },
  {
    key: 'coinflip' as const,
    href: '/docs/coinflip',
    sections: [
      { id: 'getting-started', key: 'gettingStarted' },
      { id: 'main-page', key: 'mainPage' },
      { id: 'create-bet', key: 'createBet' },
      { id: 'accept-bet', key: 'acceptBet' },
      { id: 'my-bets', key: 'myBets' },
      { id: 'history', key: 'history' },
      { id: 'leaderboard', key: 'leaderboard' },
      { id: 'wallet', key: 'wallet' },
      { id: 'shop', key: 'shop' },
      { id: 'staking-launch', key: 'stakingLaunch' },
      { id: 'vip', key: 'vip' },
      { id: 'jackpot', key: 'jackpot' },
      { id: 'events', key: 'events' },
      { id: 'news', key: 'news' },
      { id: 'social', key: 'social' },
      { id: 'referral', key: 'referral' },
      { id: 'profile', key: 'profile' },
      { id: 'faq', key: 'faq' },
    ],
  },
]

function SidebarContent({
  pathname,
  activeSection,
  t,
  onNavigate,
}: {
  pathname: string
  activeSection: string
  t: (key: string) => string
  onNavigate?: () => void
}) {
  return (
    <div className="space-y-3">
      <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.15em] mb-5">
        {t('sidebar.title')}
      </div>
      {DOCS_NAV.map((nav) => {
        const isActive =
          pathname === nav.href ||
          (nav.href !== '/docs' && pathname.startsWith(nav.href))
        return (
          <div key={nav.key}>
            <Link
              href={nav.href}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] text-[13px] font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/5'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-surface-2'
              }`}
            >
              {nav.key === 'overview' ? (
                <Rocket className="w-4 h-4" />
              ) : (
                <GiCrossedSwords className="w-4 h-4" />
              )}
              {t(`sidebar.nav.${nav.key}`)}
            </Link>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mt-1.5 ml-5 pl-3 border-l border-border space-y-px overflow-hidden"
              >
                {nav.sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    onClick={onNavigate}
                    className={`block px-2.5 py-1.5 rounded-[var(--radius-sm)] text-[11px] transition-all duration-150 ${
                      activeSection === s.id
                        ? 'text-indigo-400 bg-indigo-500/10 font-semibold'
                        : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                    }`}
                  >
                    {t(`sidebar.sections.${s.key}`)}
                  </a>
                ))}
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DocsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('docs')
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')

  const currentNav =
    DOCS_NAV.find(
      (n) =>
        pathname === n.href ||
        (n.href !== '/docs' && pathname.startsWith(n.href))
    ) || DOCS_NAV[0]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -65% 0px' }
    )
    currentNav.sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [currentNav, pathname])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <nav className="hidden xl:flex fixed top-20 left-0 bottom-0 w-60 flex-col border-r border-border bg-background/95 backdrop-blur-xl z-30 overflow-y-auto py-6 px-4">
        <SidebarContent
          pathname={pathname}
          activeSection={activeSection}
          t={t}
        />
      </nav>

      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="xl:hidden fixed top-24 left-4 z-40 p-2.5 bg-surface-1 rounded-[var(--radius-md)] backdrop-blur-sm border border-border shadow-lg shadow-black/30 hover:bg-surface-2 transition-colors"
        aria-label="Open docs navigation"
      >
        <Menu className="w-5 h-5 text-text-secondary" />
      </button>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="xl:hidden fixed top-0 left-0 bottom-0 w-72 bg-surface-1 border-r border-border z-50 overflow-y-auto shadow-2xl shadow-black/60"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-sm font-bold text-text-primary tracking-wide">
                  Documentation
                </span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-[var(--radius-sm)] hover:bg-surface-2 transition-colors"
                >
                  <X className="w-4 h-4 text-text-tertiary" />
                </button>
              </div>
              <div className="p-4">
                <SidebarContent
                  pathname={pathname}
                  activeSection={activeSection}
                  t={t}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="xl:ml-60 max-w-4xl mx-auto px-4 sm:px-6 py-12 xl:py-8">
        {children}
      </main>
    </div>
  )
}
