'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'
import { Card } from '@/components/ui'
import { useState } from 'react'

const CHECK_ICON = 'M5 13l4 4L19 7'

interface FeatureItemProps {
  text: string
}

function FeatureItem({ text }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-3 text-sm text-zinc-400">
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
          d={CHECK_ICON}
        />
      </svg>
      {text}
    </li>
  )
}

export default function PremiumPage() {
  const t = useTranslations('premium')
  const { user, token } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txPayload, setTxPayload] = useState<string | null>(null)

  const isPro = user?.plan === 'PRO'

  const handleUpgrade = async () => {
    if (!token) return
    setIsLoading(true)
    setPaymentStatus('pending')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ type: 'PRO_SUBSCRIPTION' }),
      })

      if (!res.ok) {
        throw new Error('Payment creation failed')
      }

      const data = await res.json()
      setTxPayload(JSON.stringify(data.payload ?? data, null, 2))
      setPaymentStatus('success')
    } catch {
      setPaymentStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a12] to-[#12121e]">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-20">
        {/* Hero */}
        <div className="text-center mb-12">
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            <span className="text-violet-400 text-sm font-medium">
              Premium
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('title')}
            </span>
          </h1>

          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Current Plan Indicator */}
        {user && (
          <div className="text-center mb-8">
            <span className="text-sm text-zinc-500">
              {t('currentPlan')}:{' '}
            </span>
            <span className={`text-sm font-semibold ${isPro ? 'text-violet-400' : 'text-zinc-300'}`}>
              {isPro ? t('pro.name') : t('free.name')}
            </span>
          </div>
        )}

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* FREE Plan */}
          <Card className="relative border-zinc-800 bg-zinc-900/60">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                {t('free.name')}
              </h2>
              <div className="text-3xl font-bold text-zinc-300">
                {t('free.price')}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <FeatureItem text={t('free.feature1')} />
              <FeatureItem text={t('free.feature2')} />
              <FeatureItem text={t('free.feature3')} />
              <FeatureItem text={t('free.feature4')} />
            </ul>

            {!isPro && user && (
              <div className="mt-auto">
                <div className="w-full py-3 text-center text-sm font-medium rounded-lg border border-zinc-700 text-zinc-400">
                  {t('currentPlan')}
                </div>
              </div>
            )}
          </Card>

          {/* PRO Plan */}
          <Card
            className="relative border-violet-500/30 bg-zinc-900/60"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, transparent 50%)',
            }}
          >
            {/* Popular Badge */}
            <div className="absolute -top-3 right-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-600 text-white">
                {t('pro.badge')}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-1">
                {t('pro.name')}
              </h2>
              <div className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                {t('pro.price')}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <FeatureItem text={t('pro.feature1')} />
              <FeatureItem text={t('pro.feature2')} />
              <FeatureItem text={t('pro.feature3')} />
              <FeatureItem text={t('pro.feature4')} />
            </ul>

            <div className="mt-auto">
              {isPro ? (
                <div className="w-full py-3 text-center rounded-lg bg-emerald-900/30 border border-emerald-700/40">
                  <span className="text-emerald-400 font-semibold text-sm">
                    {t('active')}
                  </span>
                  {user?.plan === 'PRO' && (
                    <p className="text-xs text-zinc-500 mt-1">
                      {t('expiresAt', { date: '---' })}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading || !user}
                  className="w-full py-3 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('processing') : t('upgrade')}
                </button>
              )}
            </div>
          </Card>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'pending' && (
          <div className="mt-8 p-6 bg-zinc-900/60 border border-zinc-800 rounded-xl text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="animate-spin h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-violet-400 font-medium">{t('paymentPending')}</span>
            </div>
            <p className="text-sm text-zinc-500">{t('signTransaction')}</p>
          </div>
        )}

        {paymentStatus === 'success' && txPayload && (
          <div className="mt-8 p-6 bg-zinc-900/60 border border-emerald-800/40 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-medium">{t('paymentSuccess')}</span>
            </div>
            <p className="text-sm text-zinc-500 mb-3">{t('signTransaction')}</p>
            <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-zinc-400 overflow-x-auto">
              {txPayload}
            </pre>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="mt-8 p-6 bg-zinc-900/60 border border-red-800/40 rounded-xl text-center">
            <span className="text-red-400 font-medium text-sm">
              Something went wrong. Please try again.
            </span>
          </div>
        )}
      </main>
    </div>
  )
}
