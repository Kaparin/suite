'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Textarea } from '@/components/ui'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth/useAuth'

type GenerationResult = {
  description: {
    short: string
    long: string
  }
  tokenomics: {
    supply: string
    distribution: {
      team: number
      marketing: number
      liquidity: number
      community: number
    }
    vesting: string
  }
  launchPlan: string[]
  faq: { question: string; answer: string }[]
  promoTexts: {
    telegram: string
    twitter: string
  }
}

type TabId = 'description' | 'tokenomics' | 'launchPlan' | 'faq' | 'promo'

export function StudioContent() {
  const t = useTranslations('studio')
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, getToken, isAuthenticated } = useAuth()

  const [formData, setFormData] = useState({
    projectName: '',
    idea: '',
    audience: '',
    utilities: '',
    tone: 'serious' as 'serious' | 'fun',
    language: 'en' as 'en' | 'ru',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<GenerationResult | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('description')
  const [error, setError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Prefill from URL params (from Telegram bot)
  useEffect(() => {
    const name = searchParams.get('name')
    const idea = searchParams.get('idea')
    const audience = searchParams.get('audience')
    const utilities = searchParams.get('utilities')

    if (name || idea || audience || utilities) {
      setFormData(prev => ({
        ...prev,
        projectName: name || prev.projectName,
        idea: idea || prev.idea,
        audience: audience || prev.audience,
        utilities: utilities || prev.utilities,
      }))
    }
  }, [searchParams])

  const handleGenerate = async () => {
    if (!formData.projectName || !formData.idea) {
      setError(t('form.projectName') + ' and ' + t('form.idea') + ' are required')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Generation failed')
      }

      const data = await response.json()
      setResult(data.result)
    } catch {
      setError('Failed to generate. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveToDatabase = async (publish: boolean = false) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    if (!user?.isVerified) {
      router.push('/login?verify=true')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const authToken = getToken()
      if (!authToken) {
        throw new Error('Authentication required')
      }

      // Generate ticker from project name
      const ticker = formData.projectName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6)

      const projectData = {
        name: formData.projectName,
        ticker: ticker,
        descriptionShort: result?.description.short || '',
        descriptionLong: result?.description.long || '',
        initialSupply: result?.tokenomics.supply?.replace(/[^0-9]/g, '') || '1000000000',
        decimals: 6,
        tokenomics: result?.tokenomics ? {
          supply: result.tokenomics.supply,
          distribution: result.tokenomics.distribution,
          vesting: result.tokenomics.vesting
        } : null,
        status: publish ? 'UPCOMING' : 'DRAFT'
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(projectData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save project')
      }

      setSaveSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'description', label: t('results.description') },
    { id: 'tokenomics', label: t('results.tokenomics') },
    { id: 'launchPlan', label: t('results.launchPlan') },
    { id: 'faq', label: t('results.faq') },
    { id: 'promo', label: t('results.promo') },
  ]

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-gray-400">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Form */}
        {!result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8 bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardHeader>
                <CardTitle>{t('form.title')}</CardTitle>
                <CardDescription>
                  {t('form.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Input
                  label={t('form.projectName')}
                  placeholder={t('form.projectNamePlaceholder')}
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  className="bg-gray-800/50"
                />

                <Textarea
                  label={t('form.idea')}
                  placeholder={t('form.ideaPlaceholder')}
                  rows={4}
                  value={formData.idea}
                  onChange={(e) => setFormData({ ...formData, idea: e.target.value })}
                  className="bg-gray-800/50"
                />

                <Input
                  label={t('form.audience')}
                  placeholder={t('form.audiencePlaceholder')}
                  value={formData.audience}
                  onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                  className="bg-gray-800/50"
                />

                <Textarea
                  label={t('form.utilities')}
                  placeholder={t('form.utilitiesPlaceholder')}
                  rows={3}
                  value={formData.utilities}
                  onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                  className="bg-gray-800/50"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('form.tone')}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.tone}
                      onChange={(e) => setFormData({ ...formData, tone: e.target.value as 'serious' | 'fun' })}
                    >
                      <option value="serious">{t('form.toneSerious')}</option>
                      <option value="fun">{t('form.toneFun')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('form.language')}</label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'ru' })}
                    >
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}

                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button
                    onClick={handleGenerate}
                    isLoading={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                    size="lg"
                  >
                    {t('form.generate')}
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                >
                  {tab.label}
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
              <CardContent>
                {activeTab === 'description' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.shortDesc')}</h3>
                      <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">
                        {result.description.short}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.fullDesc')}</h3>
                      <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg whitespace-pre-line">
                        {result.description.long}
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tokenomics' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.totalSupply')}</h3>
                      <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {result.tokenomics.supply}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-purple-400">{t('results.distribution')}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(result.tokenomics.distribution).map(([key, value]) => (
                          <motion.div
                            key={key}
                            whileHover={{ scale: 1.05 }}
                            className="bg-gray-800/50 p-4 rounded-lg text-center border border-gray-700/50"
                          >
                            <p className="text-2xl font-bold text-white">{value}%</p>
                            <p className="text-sm text-gray-400 capitalize">{key}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.vesting')}</h3>
                      <p className="text-gray-300 bg-gray-800/50 p-4 rounded-lg">
                        {result.tokenomics.vesting}
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'launchPlan' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h3 className="text-lg font-semibold mb-4 text-purple-400">{t('results.launchPlan')}</h3>
                    <div className="space-y-3">
                      {result.launchPlan.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700/50"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25">
                            <span className="text-sm font-bold">{index + 1}</span>
                          </div>
                          <p className="text-gray-300">{step}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'faq' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-lg font-semibold mb-4 text-purple-400">{t('results.faq')}</h3>
                    {result.faq.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50"
                      >
                        <p className="font-medium text-white mb-2">{item.question}</p>
                        <p className="text-gray-400">{item.answer}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {activeTab === 'promo' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.telegramPost')}</h3>
                      <pre className="text-gray-300 bg-gray-800/50 p-4 rounded-lg whitespace-pre-wrap font-sans border border-gray-700/50">
                        {result.promoTexts.telegram}
                      </pre>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2 text-purple-400">{t('results.twitterPost')}</h3>
                      <pre className="text-gray-300 bg-gray-800/50 p-4 rounded-lg whitespace-pre-wrap font-sans border border-gray-700/50">
                        {result.promoTexts.twitter}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-800/50">
              <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{t('createToken.title')}</h3>
                  <p className="text-gray-400 text-sm">
                    {t('createToken.subtitle')}
                  </p>
                </div>
                {error && (
                  <p className="text-red-400 text-sm">{error}</p>
                )}
                <div className="flex gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="outline" onClick={() => setResult(null)} disabled={isSaving}>
                      {t('createToken.edit')}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleSaveToDatabase(false)}
                      variant="outline"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={() => handleSaveToDatabase(true)}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 border-0"
                    >
                      {isSaving ? 'Publishing...' : 'Publish to Upcoming'}
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Success Message */}
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Token Saved!</h3>
              <p className="text-gray-400">Redirecting to dashboard...</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
