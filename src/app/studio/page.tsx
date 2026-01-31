'use client'

import { Suspense } from 'react'
import { StudioContent } from './StudioContent'

function StudioLoading() {
  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent -z-10" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-gray-400">Loading studio...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <Suspense fallback={<StudioLoading />}>
      <StudioContent />
    </Suspense>
  )
}
