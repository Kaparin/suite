'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { AuthGuard } from '@/components/auth'
import { useAuth } from '@/lib/auth/useAuth'

interface ProjectData {
  id: string
  name: string
  ticker: string
  logo: string | null
  descriptionShort: string | null
  descriptionLong: string | null
  decimals: number
  initialSupply: string | null
  links: {
    telegram?: string
    twitter?: string
    website?: string
    discord?: string
  } | null
  tokenomics: {
    supply?: string
    distribution?: Record<string, number>
  } | null
  estimatedLaunchDate: string | null
  status: string
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { getToken, user } = useAuth()

  const [project, setProject] = useState<ProjectData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    ticker: '',
    logo: '',
    descriptionShort: '',
    descriptionLong: '',
    decimals: 6,
    initialSupply: '1000000000',
    links: {
      telegram: '',
      twitter: '',
      website: '',
      discord: ''
    },
    estimatedLaunchDate: ''
  })

  // Fetch project
  const fetchProject = useCallback(async () => {
    try {
      const token = getToken()
      console.log('[Edit Page] Fetching project:', projectId)
      console.log('[Edit Page] Token present:', !!token, token ? `length: ${token.length}` : '')
      console.log('[Edit Page] Current user from context:', user ? { id: user.id, isVerified: user.isVerified } : null)

      const res = await fetch(`/api/projects/${projectId}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.log('[Edit Page] Error response:', res.status, errorData)
        if (res.status === 404) {
          setError('Project not found')
        } else if (res.status === 403) {
          setError('You do not have permission to edit this project')
        } else {
          throw new Error('Failed to load project')
        }
        return
      }

      const data = await res.json()
      console.log('[Edit Page] Response status:', res.status)
      console.log('[Edit Page] Response canEdit:', data.canEdit)
      console.log('[Edit Page] Project ownerId:', data.project?.ownerId)
      setProject(data.project)

      // Populate form
      setFormData({
        name: data.project.name || '',
        ticker: data.project.ticker || '',
        logo: data.project.logo || '',
        descriptionShort: data.project.descriptionShort || '',
        descriptionLong: data.project.descriptionLong || '',
        decimals: data.project.decimals || 6,
        initialSupply: data.project.initialSupply || '1000000000',
        links: {
          telegram: data.project.links?.telegram || '',
          twitter: data.project.links?.twitter || '',
          website: data.project.links?.website || '',
          discord: data.project.links?.discord || ''
        },
        estimatedLaunchDate: data.project.estimatedLaunchDate
          ? new Date(data.project.estimatedLaunchDate).toISOString().split('T')[0]
          : ''
      })
    } catch (err) {
      console.error('Error fetching project:', err)
      setError('Failed to load project')
    } finally {
      setIsLoading(false)
    }
  }, [projectId, getToken])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLinkChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: { ...prev.links, [field]: value }
    }))
  }

  const handleSave = async (publish: boolean = false) => {
    setIsSaving(true)
    setError(null)

    try {
      const token = getToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Determine status based on current state and action
      let newStatus: string | undefined
      if (project?.status === 'UPCOMING') {
        // For UPCOMING: publish=true keeps it UPCOMING, publish=false unpublishes to DRAFT
        newStatus = publish ? 'UPCOMING' : 'DRAFT'
      } else {
        // For DRAFT: publish=true publishes to UPCOMING, publish=false keeps as DRAFT
        newStatus = publish ? 'UPCOMING' : 'DRAFT'
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          status: newStatus
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Saved!</h2>
          <p className="text-gray-400">Redirecting to dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthGuard requireVerified={true} redirectTo="/login?verify=true">
      <div className="min-h-screen bg-gray-950">
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-gray-950 to-blue-900/20" />
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
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

            <h1 className="text-3xl font-bold text-white mb-2">Edit Project</h1>
            <p className="text-gray-400">
              {project?.name} ({project?.ticker})
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
              {error}
            </div>
          )}

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-900/80 backdrop-blur-xl border border-gray-800 rounded-2xl p-6 md:p-8 space-y-6"
          >
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Token Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Symbol</label>
                <input
                  type="text"
                  value={formData.ticker}
                  onChange={(e) => handleChange('ticker', e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white uppercase focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Supply & Decimals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Initial Supply</label>
                <input
                  type="text"
                  value={formData.initialSupply}
                  onChange={(e) => handleChange('initialSupply', e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Decimals</label>
                <select
                  value={formData.decimals}
                  onChange={(e) => handleChange('decimals', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                >
                  <option value={6}>6 (Standard)</option>
                  <option value={8}>8</option>
                  <option value={18}>18 (EVM-like)</option>
                </select>
              </div>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Logo URL</label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => handleChange('logo', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Short Description</label>
              <input
                type="text"
                value={formData.descriptionShort}
                onChange={(e) => handleChange('descriptionShort', e.target.value)}
                maxLength={160}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{formData.descriptionShort.length}/160</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Full Description</label>
              <textarea
                value={formData.descriptionLong}
                onChange={(e) => handleChange('descriptionLong', e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none resize-none"
              />
            </div>

            {/* Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
                <input
                  type="url"
                  value={formData.links.telegram}
                  onChange={(e) => handleLinkChange('telegram', e.target.value)}
                  placeholder="https://t.me/yourtoken"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Twitter / X</label>
                <input
                  type="url"
                  value={formData.links.twitter}
                  onChange={(e) => handleLinkChange('twitter', e.target.value)}
                  placeholder="https://x.com/yourtoken"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.links.website}
                  onChange={(e) => handleLinkChange('website', e.target.value)}
                  placeholder="https://yourtoken.com"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Discord</label>
                <input
                  type="url"
                  value={formData.links.discord}
                  onChange={(e) => handleLinkChange('discord', e.target.value)}
                  placeholder="https://discord.gg/yourserver"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Launch Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Estimated Launch Date</label>
              <input
                type="date"
                value={formData.estimatedLaunchDate}
                onChange={(e) => handleChange('estimatedLaunchDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:border-purple-500 outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              {project?.status === 'UPCOMING' ? (
                <>
                  <Button
                    onClick={() => handleSave(false)}
                    variant="outline"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Unpublish to Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => handleSave(false)}
                    variant="outline"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {isSaving ? 'Publishing...' : 'Publish to Upcoming'}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  )
}
