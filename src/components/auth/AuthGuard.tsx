'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/useAuth'

interface AuthGuardProps {
  children: ReactNode
  requireVerified?: boolean // Requires wallet verified
  redirectTo?: string
  fallback?: ReactNode
}

export function AuthGuard({
  children,
  requireVerified = false,
  redirectTo = '/login',
  fallback
}: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isLoading, isAuthenticated, router, redirectTo])

  useEffect(() => {
    if (!isLoading && isAuthenticated && requireVerified && !(user?.wallets && user.wallets.length > 0)) {
      // User needs to verify wallet
      router.push('/login?verify=true')
    }
  }, [isLoading, isAuthenticated, requireVerified, user, router])

  // Loading state
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return fallback || null
  }

  // Requires verification but not verified
  if (requireVerified && !(user?.wallets && user.wallets.length > 0)) {
    return fallback || null
  }

  return <>{children}</>
}

// HOC version
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireVerified?: boolean
    redirectTo?: string
  }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <AuthGuard
        requireVerified={options?.requireVerified}
        redirectTo={options?.redirectTo}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}
