'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { WalletBindModal } from '@/components/auth'
import { useAuth } from '@/lib/auth/useAuth'

const TELEGRAM_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'axiome_launch_suite_bot'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, user, refreshSession } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showTelegramInstructions, setShowTelegramInstructions] = useState(false)

  // Check for callback parameters from Telegram bot deep link
  useEffect(() => {
    const token = searchParams.get('token')
    const userParam = searchParams.get('user')
    const authCode = searchParams.get('auth_code')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      setError(
        errorParam === 'missing_params' ? 'Missing authentication data' :
        errorParam === 'invalid_auth' ? 'Invalid Telegram authentication' :
        errorParam === 'auth_failed' ? 'Authentication failed' :
        'An error occurred'
      )
      window.history.replaceState({}, '', '/login')
      return
    }

    // Check if auth_code matches the one we stored
    if (authCode && token && userParam) {
      const storedCode = sessionStorage.getItem('telegram_auth_code')

      // For now, accept any valid response (in production, verify the code)
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        login(userData, token)

        // Clean up
        sessionStorage.removeItem('telegram_auth_code')
        window.history.replaceState({}, '', '/login')

        if (userData.wallets && userData.wallets.length > 0) {
          router.push('/dashboard')
        } else {
          setShowWalletModal(true)
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
        setError('Failed to process authentication')
        window.history.replaceState({}, '', '/login')
      }
      return
    }

    // Legacy support for old callback format
    if (token && userParam && !authCode) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam))
        login(userData, token)
        window.history.replaceState({}, '', '/login')

        if (userData.wallets && userData.wallets.length > 0) {
          router.push('/dashboard')
        } else {
          setShowWalletModal(true)
        }
      } catch (e) {
        console.error('Failed to parse user data:', e)
        setError('Failed to process authentication')
        window.history.replaceState({}, '', '/login')
      }
    }
  }, [searchParams, login, router])

  // Check for verify parameter
  const shouldVerify = searchParams.get('verify') === 'true'

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !shouldVerify && !searchParams.get('token')) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, shouldVerify, router, searchParams])

  // Show wallet modal if user needs to verify
  useEffect(() => {
    if (isAuthenticated && shouldVerify && !(user?.wallets && user.wallets.length > 0)) {
      setShowWalletModal(true)
    }
  }, [isAuthenticated, shouldVerify, user])

  // Handle Telegram login via deep link
  const handleTelegramLogin = () => {
    setError(null)

    // Generate unique auth code
    const authCode = Math.random().toString(36).substring(2) + Date.now().toString(36)

    // Store auth code in sessionStorage for verification
    sessionStorage.setItem('telegram_auth_code', authCode)

    // Open Telegram with bot deep link
    const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=auth_${authCode}`

    // Open in new tab (mobile will open Telegram app)
    window.open(deepLink, '_blank')

    // Show instructions
    setShowTelegramInstructions(true)
  }

  const handleWalletVerified = () => {
    // WalletBindModal already called addWallet() which updates context
    // Just refresh session to ensure we have latest data from server
    refreshSession()
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
                {isAuthenticated && !(user?.wallets && user.wallets.length > 0)
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
                {!showTelegramInstructions ? (
                  <>
                    {/* Telegram Login Button */}
                    <button
                      onClick={handleTelegramLogin}
                      disabled={isLoading}
                      className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-[#54A9EB] hover:bg-[#4A96D2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                    >
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      {isLoading ? 'Connecting...' : 'Log in with Telegram'}
                    </button>

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
                  </>
                ) : (
                  /* Telegram Instructions */
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold">1</span>
                        </div>
                        <div>
                          <p className="text-blue-300 font-medium">Open Telegram</p>
                          <p className="text-sm text-gray-400">A new tab opened with our bot. If not, click below.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold">2</span>
                        </div>
                        <div>
                          <p className="text-blue-300 font-medium">Click &quot;Complete Login&quot;</p>
                          <p className="text-sm text-gray-400">The bot will show a button to complete your login.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-400 font-bold">3</span>
                        </div>
                        <div>
                          <p className="text-blue-300 font-medium">Return here</p>
                          <p className="text-sm text-gray-400">You&apos;ll be redirected back automatically.</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleTelegramLogin}
                      className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#54A9EB] hover:bg-[#4A96D2] text-white font-medium rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                      Open Telegram Again
                    </button>

                    <button
                      onClick={() => setShowTelegramInstructions(false)}
                      className="block w-full px-6 py-3 text-center text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
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

                {!(user?.wallets && user.wallets.length > 0) && (
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
