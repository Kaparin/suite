'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface TelegramLoginButtonProps {
  botName: string
  onAuth: (user: TelegramUser) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: 'write' | null
  usePic?: boolean
  lang?: string
  useRedirect?: boolean
  redirectUrl?: string
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    TelegramLoginWidget?: {
      dataOnauth?: (user: TelegramUser) => void
    }
  }
}

export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 14,
  requestAccess = null,
  usePic = true,
  lang = 'en',
  useRedirect = false,
  redirectUrl
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptRef = useRef<HTMLScriptElement | null>(null)
  const [widgetLoaded, setWidgetLoaded] = useState(false)

  const handleAuth = useCallback((user: TelegramUser) => {
    onAuth(user)
  }, [onAuth])

  // Redirect-based auth
  const handleRedirectAuth = useCallback(() => {
    const baseUrl = redirectUrl || `${window.location.origin}/api/auth/telegram/callback`
    const authUrl = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${encodeURIComponent(window.location.origin)}&embed=1&request_access=${requestAccess || 'write'}&return_to=${encodeURIComponent(baseUrl)}`

    // Open in popup
    const width = 550
    const height = 470
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    window.open(
      authUrl,
      'telegram_auth',
      `width=${width},height=${height},left=${left},top=${top}`
    )
  }, [botName, requestAccess, redirectUrl])

  useEffect(() => {
    if (useRedirect) return

    // Create global callback
    const callbackName = `telegram_login_${Date.now()}`
    ;(window as unknown as Record<string, (user: TelegramUser) => void>)[callbackName] = handleAuth

    // Create script element
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-radius', cornerRadius.toString())
    script.setAttribute('data-onauth', `${callbackName}(user)`)
    script.setAttribute('data-lang', lang)

    if (requestAccess) {
      script.setAttribute('data-request-access', requestAccess)
    }

    if (!usePic) {
      script.setAttribute('data-userpic', 'false')
    }

    script.async = true
    script.onload = () => {
      setTimeout(() => {
        const iframe = containerRef.current?.querySelector('iframe')
        setWidgetLoaded(!!iframe)
      }, 1000)
    }
    scriptRef.current = script

    // Append to container
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(script)
    }

    return () => {
      // Cleanup
      delete (window as unknown as Record<string, unknown>)[callbackName]
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current)
      }
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, usePic, lang, handleAuth, useRedirect])

  // If using redirect mode, show button
  if (useRedirect) {
    return (
      <button
        onClick={handleRedirectAuth}
        className="flex items-center justify-center gap-3 px-6 py-3 bg-[#54A9EB] hover:bg-[#4A96D2] text-white font-medium rounded-xl transition-colors"
      >
        <TelegramIcon />
        Log in with Telegram
      </button>
    )
  }

  return <div ref={containerRef} className="telegram-login-button min-h-[40px]" />
}

function TelegramIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

// Fallback button for when Telegram widget fails to load
export function TelegramLoginFallback({
  onClick,
  isLoading = false
}: {
  onClick: () => void
  isLoading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-[#54A9EB] hover:bg-[#4A96D2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
    >
      <TelegramIcon />
      {isLoading ? 'Connecting...' : 'Log in with Telegram'}
    </button>
  )
}

// Direct link button - most reliable
export function TelegramLoginLink({ botName }: { botName: string }) {
  const handleClick = () => {
    // Generate auth URL
    const origin = window.location.origin
    const callbackUrl = `${origin}/api/auth/telegram/callback`

    // This opens Telegram's OAuth page
    window.location.href = `https://oauth.telegram.org/auth?bot_id=${botName}&origin=${encodeURIComponent(origin)}&request_access=write&return_to=${encodeURIComponent(callbackUrl)}`
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center gap-3 w-full px-6 py-3 bg-[#54A9EB] hover:bg-[#4A96D2] text-white font-medium rounded-xl transition-colors"
    >
      <TelegramIcon />
      Log in with Telegram
    </button>
  )
}
