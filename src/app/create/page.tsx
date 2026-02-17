'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AuthGuard } from '@/components/auth'
import { TokenCreateForm } from '@/components/token'
import { useAuth } from '@/lib/auth/useAuth'

export default function CreateTokenPage() {
  const router = useRouter()
  const { user } = useAuth()

  const handleSuccess = (projectId: string) => {
    router.push(`/dashboard?created=${projectId}`)
  }

  return (
    <AuthGuard requireVerified={true} redirectTo="/login?verify=true">
      <div className="min-h-screen bg-gray-950">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Create Token</h1>
                <p className="text-gray-400">
                  Define your token parameters and launch on Axiome blockchain
                </p>
              </div>

              {/* User badge */}
              <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-sm text-gray-300">
                  Creating as <span className="text-white font-medium">@{user?.telegramUsername || user?.telegramFirstName}</span>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 md:p-8"
          >
            <TokenCreateForm onSuccess={handleSuccess} />
          </motion.div>

          {/* Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Choose a Unique Name</h3>
              <p className="text-sm text-gray-400">
                Pick a memorable name and symbol that represents your project.
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">Add Social Links</h3>
              <p className="text-sm text-gray-400">
                Projects with active communities get more visibility and trust.
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
