'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, CardContent } from '@/components/ui'
import { VerificationModal } from '@/components/auth'
import { useWalletAuth, getAuthToken } from '@/lib/auth'

interface ProjectLinks {
  telegram?: string
  twitter?: string
  website?: string
  discord?: string
}

interface OwnerPanelProps {
  tokenAddress: string
  walletAddress: string
  currentName: string
  currentDescriptionShort: string | null
  currentDescriptionLong: string | null
  currentLinks: ProjectLinks | null
  currentLogo: string | null
  onUpdate: () => void
}

export function OwnerPanel({
  tokenAddress,
  walletAddress,
  currentName,
  currentDescriptionShort,
  currentDescriptionLong,
  currentLinks,
  currentLogo,
  onUpdate,
}: OwnerPanelProps) {
  const { isVerified, verifiedWallet, checkSession } = useWalletAuth()
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form state
  const [name, setName] = useState(currentName)
  const [descriptionShort, setDescriptionShort] = useState(currentDescriptionShort || '')
  const [descriptionLong, setDescriptionLong] = useState(currentDescriptionLong || '')
  const [logo, setLogo] = useState(currentLogo || '')
  const [telegram, setTelegram] = useState(currentLinks?.telegram || '')
  const [twitter, setTwitter] = useState(currentLinks?.twitter || '')
  const [website, setWebsite] = useState(currentLinks?.website || '')
  const [discord, setDiscord] = useState(currentLinks?.discord || '')

  // Check session on mount
  useEffect(() => {
    checkSession()
  }, [checkSession])

  // Check if this wallet is verified
  const isWalletVerified = isVerified && verifiedWallet?.toLowerCase() === walletAddress.toLowerCase()

  const handleEditClick = () => {
    if (isWalletVerified) {
      setIsEditing(true)
    } else {
      setShowVerificationModal(true)
    }
  }

  const handleVerified = () => {
    setShowVerificationModal(false)
    setIsEditing(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess(false)

    const authToken = getAuthToken()
    if (!authToken) {
      setError('Требуется верификация кошелька')
      setIsSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/tokens/${tokenAddress}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name,
          descriptionShort: descriptionShort || null,
          descriptionLong: descriptionLong || null,
          logo: logo || null,
          links: {
            telegram: telegram || undefined,
            twitter: twitter || undefined,
            website: website || undefined,
            discord: discord || undefined,
          },
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 401) {
          // Session expired, need re-verification
          setShowVerificationModal(true)
          throw new Error('Сессия истекла. Требуется повторная верификация.')
        }
        throw new Error(data.error || 'Failed to update')
      }

      setSuccess(true)
      setIsEditing(false)
      onUpdate()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setName(currentName)
    setDescriptionShort(currentDescriptionShort || '')
    setDescriptionLong(currentDescriptionLong || '')
    setLogo(currentLogo || '')
    setTelegram(currentLinks?.telegram || '')
    setTwitter(currentLinks?.twitter || '')
    setWebsite(currentLinks?.website || '')
    setDiscord(currentLinks?.discord || '')
    setIsEditing(false)
    setError('')
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="bg-gradient-to-br from-purple-500/10 via-gray-900 to-blue-500/10 border-purple-500/30">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Управление токеном</h3>
                  <p className="text-sm text-gray-400">
                    {isWalletVerified ? 'Кошелёк верифицирован' : 'Требуется верификация'}
                  </p>
                </div>
              </div>

              {!isEditing && (
                <Button
                  onClick={handleEditClick}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                >
                  {isWalletVerified ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Редактировать
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Верифицировать
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Verification required notice */}
            {!isWalletVerified && !isEditing && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm">
                    <p className="text-yellow-300 font-medium">Требуется верификация</p>
                    <p className="text-gray-400">
                      Чтобы редактировать информацию о токене, подтвердите владение кошельком через микро-транзакцию.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Изменения сохранены!
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit Form */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Основная информация</h4>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Название проекта</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Название токена"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Логотип (URL)</label>
                      <input
                        type="url"
                        value={logo}
                        onChange={(e) => setLogo(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="https://example.com/logo.png"
                      />
                      {logo && (
                        <div className="mt-2 flex items-center gap-2">
                          <img src={logo} alt="Preview" className="w-10 h-10 rounded-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          <span className="text-xs text-gray-500">Превью</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Краткое описание</label>
                      <input
                        type="text"
                        value={descriptionShort}
                        onChange={(e) => setDescriptionShort(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                        placeholder="Краткое описание токена (1-2 предложения)"
                        maxLength={200}
                      />
                      <p className="text-xs text-gray-500 mt-1">{descriptionShort.length}/200</p>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Полное описание</label>
                      <textarea
                        value={descriptionLong}
                        onChange={(e) => setDescriptionLong(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                        placeholder="Подробное описание проекта, его цели, roadmap..."
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-300 uppercase tracking-wide">Социальные сети</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.327.015.095.034.311.019.478z"/>
                            </svg>
                            Telegram
                          </span>
                        </label>
                        <input
                          type="url"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="https://t.me/channel"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Twitter / X
                          </span>
                        </label>
                        <input
                          type="url"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="https://x.com/username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            Вебсайт
                          </span>
                        </label>
                        <input
                          type="url"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="https://yourproject.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                            </svg>
                            Discord
                          </span>
                        </label>
                        <input
                          type="url"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                          placeholder="https://discord.gg/invite"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
                    >
                      {isSaving ? (
                        <>
                          <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Сохранение...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Сохранить
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Отмена
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Info when not editing */}
            {!isEditing && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
                <div className="text-center">
                  <p className="text-sm text-gray-400">Описание</p>
                  <p className="text-white font-medium">{descriptionShort ? 'Есть' : 'Нет'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Логотип</p>
                  <p className="text-white font-medium">{currentLogo ? 'Есть' : 'Нет'}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Соцсети</p>
                  <p className="text-white font-medium">
                    {[telegram, twitter, website, discord].filter(Boolean).length} / 4
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400">Статус</p>
                  <p className={`font-medium ${isWalletVerified ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isWalletVerified ? 'Верифицирован' : 'Не верифицирован'}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        walletAddress={walletAddress}
        onClose={() => setShowVerificationModal(false)}
        onVerified={handleVerified}
      />
    </>
  )
}
