'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

interface ComingSoonBannerProps {
  feature?: string
  description?: string
  showIcon?: boolean
}

export function ComingSoonBanner({
  feature = 'On-chain token creation',
  description,
  showIcon = true
}: ComingSoonBannerProps) {
  const t = useTranslations()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 p-6"
    >
      {/* Background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />

      <div className="relative flex items-start gap-4">
        {showIcon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/20 rounded-full">
              {t('launchpad.comingSoon')}
            </span>
          </div>

          <h3 className="text-lg font-semibold text-white mb-1">
            {feature}
          </h3>

          <p className="text-sm text-gray-400">
            {description || 'This feature will be available soon. Create your token as a draft and publish it to Upcoming while we prepare on-chain deployment.'}
          </p>

          {/* Progress indicator */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                initial={{ width: '0%' }}
                animate={{ width: '75%' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-gray-500">75% ready</span>
          </div>

          {/* Features list */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Token drafts
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Upcoming listing
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Axiome Connect
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              CW20 deployment
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
