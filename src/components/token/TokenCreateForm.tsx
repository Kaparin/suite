'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { useAuth } from '@/lib/auth/useAuth'

interface TokenFormData {
  name: string
  ticker: string
  logo: string
  descriptionShort: string
  descriptionLong: string
  decimals: number
  initialSupply: string
  links: {
    telegram: string
    twitter: string
    website: string
    discord: string
  }
  tokenomics: {
    supply: string
    distribution: Record<string, number>
  }
  estimatedLaunchDate: string
}

interface TokenCreateFormProps {
  initialData?: Partial<TokenFormData>
  onSuccess?: (projectId: string) => void
}

export function TokenCreateForm({ initialData, onSuccess }: TokenCreateFormProps) {
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState<TokenFormData>({
    name: initialData?.name || '',
    ticker: initialData?.ticker || '',
    logo: initialData?.logo || '',
    descriptionShort: initialData?.descriptionShort || '',
    descriptionLong: initialData?.descriptionLong || '',
    decimals: initialData?.decimals || 6,
    initialSupply: initialData?.initialSupply || '1000000000',
    links: {
      telegram: initialData?.links?.telegram || '',
      twitter: initialData?.links?.twitter || '',
      website: initialData?.links?.website || '',
      discord: initialData?.links?.discord || ''
    },
    tokenomics: initialData?.tokenomics || {
      supply: '1000000000',
      distribution: {}
    },
    estimatedLaunchDate: initialData?.estimatedLaunchDate || ''
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLinkChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: {
        ...prev.links,
        [field]: value
      }
    }))
  }

  const handleSubmit = async (saveAsDraft: boolean = true) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Token name is required')
      }
      if (!formData.ticker.trim()) {
        throw new Error('Token symbol is required')
      }
      if (formData.ticker.length > 10) {
        throw new Error('Symbol must be 10 characters or less')
      }

      const authToken = getToken()
      if (!authToken) {
        throw new Error('Authentication required. Please log in again.')
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          ticker: formData.ticker.toUpperCase(),
          logo: formData.logo,
          descriptionShort: formData.descriptionShort,
          descriptionLong: formData.descriptionLong,
          decimals: formData.decimals,
          initialSupply: formData.initialSupply,
          links: formData.links,
          tokenomics: formData.tokenomics,
          estimatedLaunchDate: formData.estimatedLaunchDate ? new Date(formData.estimatedLaunchDate).toISOString() : null,
          status: saveAsDraft ? 'DRAFT' : 'UPCOMING'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create token')
      }

      setSuccess(true)
      if (onSuccess) {
        onSuccess(data.project.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Token Created!</h3>
        <p className="text-gray-400 mb-6">
          Your token has been saved as a draft. You can edit it anytime from your dashboard.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => {
              setSuccess(false)
              setFormData({
                name: '',
                ticker: '',
                logo: '',
                descriptionShort: '',
                descriptionLong: '',
                decimals: 6,
                initialSupply: '1000000000',
                links: { telegram: '', twitter: '', website: '', discord: '' },
                tokenomics: { supply: '1000000000', distribution: {} },
                estimatedLaunchDate: ''
              })
              setStep(1)
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            Create Another
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              step === s
                ? 'bg-purple-600 text-white'
                : step > s
                ? 'bg-green-600/20 text-green-400'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-black/20">
              {step > s ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : s}
            </span>
            <span className="hidden sm:block">
              {s === 1 ? 'Basic Info' : s === 2 ? 'Details' : 'Links'}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(true) }}>
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g., Moon Finance"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                  placeholder="e.g., MOON"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors uppercase"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Supply *
                </label>
                <input
                  type="text"
                  value={formData.initialSupply}
                  onChange={(e) => handleChange('initialSupply', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="1000000000"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {parseInt(formData.initialSupply || '0').toLocaleString()} tokens
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decimals
                </label>
                <select
                  value={formData.decimals}
                  onChange={(e) => handleChange('decimals', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                >
                  <option value={6}>6 (Standard)</option>
                  <option value={8}>8</option>
                  <option value={18}>18 (EVM-like)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL (optional)
              </label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => setStep(2)}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Description */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Description
              </label>
              <input
                type="text"
                value={formData.descriptionShort}
                onChange={(e) => handleChange('descriptionShort', e.target.value)}
                placeholder="A brief one-line description of your token"
                maxLength={160}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.descriptionShort.length}/160 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Description
              </label>
              <textarea
                value={formData.descriptionLong}
                onChange={(e) => handleChange('descriptionLong', e.target.value)}
                placeholder="Describe your token project in detail. What problem does it solve? What makes it unique?"
                rows={6}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Estimated Launch Date (optional)
              </label>
              <input
                type="date"
                value={formData.estimatedLaunchDate}
                onChange={(e) => handleChange('estimatedLaunchDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
              />
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep(3)}
                className="bg-gradient-to-r from-purple-600 to-blue-600"
              >
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Links */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                    Telegram
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.links.telegram}
                  onChange={(e) => handleLinkChange('telegram', e.target.value)}
                  placeholder="https://t.me/yourtoken"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter / X
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.links.twitter}
                  onChange={(e) => handleLinkChange('twitter', e.target.value)}
                  placeholder="https://x.com/yourtoken"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.links.website}
                  onChange={(e) => handleLinkChange('website', e.target.value)}
                  placeholder="https://yourtoken.com"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
                    </svg>
                    Discord
                  </span>
                </label>
                <input
                  type="url"
                  value={formData.links.discord}
                  onChange={(e) => handleLinkChange('discord', e.target.value)}
                  placeholder="https://discord.gg/yourserver"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Coming Soon Banner */}
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-yellow-300 font-medium">Token Creation Coming Soon</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Currently, tokens are saved as drafts in our database. On-chain token creation via Axiome Wallet will be available soon!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setStep(2)}
                variant="outline"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Publish to Upcoming'
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  )
}
