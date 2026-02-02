'use client'

import { AuthProvider } from '@/lib/auth/useAuth'
import { ReactNode } from 'react'

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}
