'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { TelegramLoginButton, TelegramLoginFallback, WalletBindModal, type TelegramUser } from '@/components/auth'
import { useAuth } from '@/lib/auth/useAuth'

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'AxiomeLaunchBot'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)

  // Check for verify parameter
  const shouldVerify = searchParams.get('verify') === 'true'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !shouldVerify) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, shouldVerify, router])

  // Show wallet modal if user needs to verify
  useEffect(() => {
    if (isAuthenticated && shouldVerify && !user?.isVerified) {
      setShowWalletModal(true)
    }
  }, [isAuthenticated, shouldVerify, user])

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telegramUser)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Login with the user data and token
      login(data.user, data.token)

      // Redirect to dashboard or show wallet modal
      if (data.user.isVerified) {
        router.push('/dashboard')
      } else {
        setShowWalletModal(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWalletVerified = (walletAddress: string) => {
    // Update user with verified wallet
    if (user) {
      login(
        { ...user, walletAddress, isVerified: true },
        localStorage.getItem('axiome_auth_token') || ''
      )
    }
    setShowWalletModal(false)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
            {/* Logo/Icon */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to Axiome Launch Suite</h1>
              <p className="text-gray-400">
                {isAuthenticated && !user?.isVerified
                  ? 'Verify your wallet to start creating tokens'
                  : 'Log in with Telegram to continue'}
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Login options */}
            {!isAuthenticated ? (
              <div className="space-y-4">
                {/* Telegram Login Widget */}
                <div className="flex justify-center">
                  <TelegramLoginButton
                    botName={TELEGRAM_BOT_USERNAME}
                    onAuth={handleTelegramAuth}
                    buttonSize="large"
                    cornerRadius={14}
                    lang="en"
                  />
                </div>

                {/* Fallback button */}
                {isLoading && (
                  <TelegramLoginFallback
                    onClick={() => {}}
                    isLoading={true}
                  />
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-gray-900 text-gray-500">or</span>
                  </div>
                </div>

                {/* Continue as guest */}
                <Link
                  href="/explorer"
                  className="block w-full px-6 py-3 text-center text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors"
                >
                  Continue as Guest
                </Link>
              </div>
            ) : (
              /* User is authenticated but needs wallet verification */
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-green-300 font-medium">Logged in as {user?.telegramFirstName}</p>
                      <p className="text-sm text-gray-400">@{user?.telegramUsername}</p>
                    </div>
                  </div>
                </div>

                {!user?.isVerified && (
                  <button
                    onClick={() => setShowWalletModal(true)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium rounded-xl transition-colors"
                  >
                    Verify Wallet to Create Tokens
                  </button>
                )}

                <Link
                  href="/dashboard"
                  className="block w-full px-6 py-3 text-center text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 rounded-xl transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}

            {/* Benefits */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <h3 className="text-sm font-medium text-gray-400 mb-4">Why log in?</h3>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Create and manage your own tokens
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Comment and react to token projects
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Get AI-powered token generation
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Access your personal dashboard
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Wallet Bind Modal */}
      <WalletBindModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onSuccess={handleWalletVerified}
      />
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-4" />
        <div className="h-6 w-48 bg-gray-800 rounded mx-auto" />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  )
}
