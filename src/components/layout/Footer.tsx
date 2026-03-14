'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

export function Footer() {
  const t = useTranslations('footer')

  const columns = [
    {
      title: 'Ecosystem',
      links: [
        { label: 'Token Explorer', href: '/explorer' },
        { label: 'Heads or Tails', href: 'https://coinflip.axiome-launch.com/game', external: true },
        { label: 'Staking', href: '/wallet?tab=staking' },
        { label: 'Governance', href: '/governance' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'Axiome Docs', href: 'https://docs.axiomeinfo.org', external: true },
        { label: 'Token Lab', href: 'https://app.axiometrade.pro/pump/token-lab', external: true },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Telegram', href: 'https://t.me/axiome_launch', external: true },
        { label: 'Axiome', href: 'https://axiome.pro', external: true },
        { label: 'GitHub', href: 'https://github.com/axiome-pro', external: true },
      ],
    },
  ]

  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container-page py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Image
              src="/axiome-launch-suite-logo.png"
              alt="Axiome Launch Suite"
              width={140}
              height={40}
              className="h-8 w-auto object-contain opacity-80 mb-4"
            />
            <p className="text-text-tertiary text-sm leading-relaxed mb-4 max-w-[240px]">
              {t('disclaimer')}
            </p>
            <p className="text-text-tertiary text-xs">
              &copy; {new Date().getFullYear()} Axiome Launch Suite
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-text-primary text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200 inline-flex items-center gap-1"
                      >
                        {link.label}
                        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-text-secondary hover:text-text-primary text-sm transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
