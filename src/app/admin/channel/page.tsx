'use client'

import { useState, useCallback } from 'react'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.axiome-launch.com'
const COINFLIP_URL = 'https://coinflip.axiome-launch.com'

// ── Post templates ──────────────────────────────────────────────────

interface PostTemplate {
  name: string
  text: string
  buttons: { text: string; url: string }[][]
  photoUrl?: string
}

const TEMPLATES: PostTemplate[] = [
  {
    name: 'New Raffle',
    text:
      '<b>New Raffle!</b>\n\n' +
      'Prize pool: <b>??? AXM</b>\n' +
      'Duration: 24 hours\n' +
      'Free entry — winner takes all!\n\n' +
      'Join now on Heads or Tails:',
    buttons: [
      [{ text: 'Join Raffle', url: `${COINFLIP_URL}/game` }],
    ],
  },
  {
    name: 'Game Update',
    text:
      '<b>Heads or Tails — Update</b>\n\n' +
      'New features are live:\n\n' +
      '...\n\n' +
      'Try it now!',
    buttons: [
      [{ text: 'Play Now', url: `${COINFLIP_URL}/game` }],
      [{ text: 'Website', url: SITE_URL }],
    ],
  },
  {
    name: 'LAUNCH Staking',
    text:
      '<b>LAUNCH Token — Earn Revenue</b>\n\n' +
      'Stake LAUNCH and earn from every product in the Axiome ecosystem.\n\n' +
      'Current APR: <b>???%</b>\n' +
      'More products = more rewards.',
    buttons: [
      [{ text: 'Stake Now', url: `${SITE_URL}/staking` }],
      [{ text: 'Buy LAUNCH', url: `${SITE_URL}/staking` }],
    ],
  },
  {
    name: 'Custom Post',
    text: '',
    buttons: [],
  },
]

// ── Main component ──────────────────────────────────────────────────

export default function ChannelAdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [text, setText] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [buttons, setButtons] = useState<{ text: string; url: string }[][]>([])
  const [disablePreview, setDisablePreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const handleAuth = useCallback(() => {
    if (secret.trim()) {
      setAuthenticated(true)
    }
  }, [secret])

  const applyTemplate = useCallback((template: PostTemplate) => {
    setText(template.text)
    setButtons(template.buttons.map(row => row.map(btn => ({ ...btn }))))
    setPhotoUrl(template.photoUrl || '')
  }, [])

  const addButtonRow = useCallback(() => {
    setButtons(prev => [...prev, [{ text: '', url: '' }]])
  }, [])

  const addButtonToRow = useCallback((rowIndex: number) => {
    setButtons(prev => prev.map((row, i) =>
      i === rowIndex ? [...row, { text: '', url: '' }] : row
    ))
  }, [])

  const updateButton = useCallback((rowIndex: number, btnIndex: number, field: 'text' | 'url', value: string) => {
    setButtons(prev => prev.map((row, ri) =>
      ri === rowIndex
        ? row.map((btn, bi) => bi === btnIndex ? { ...btn, [field]: value } : btn)
        : row
    ))
  }, [])

  const removeButton = useCallback((rowIndex: number, btnIndex: number) => {
    setButtons(prev => {
      const newButtons = prev.map((row, ri) =>
        ri === rowIndex ? row.filter((_, bi) => bi !== btnIndex) : row
      )
      // Remove empty rows
      return newButtons.filter(row => row.length > 0)
    })
  }, [])

  const sendPost = useCallback(async () => {
    if (!text.trim()) return
    setSending(true)
    setResult(null)

    try {
      // Filter out buttons with empty text/url
      const cleanButtons = buttons
        .map(row => row.filter(btn => btn.text.trim() && btn.url.trim()))
        .filter(row => row.length > 0)

      const response = await fetch('/api/telegram/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secret}`,
        },
        body: JSON.stringify({
          text,
          photoUrl: photoUrl.trim() || undefined,
          buttons: cleanButtons.length > 0 ? cleanButtons : undefined,
          disablePreview,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ ok: true, message: `Post sent! Message ID: ${data.messageId}` })
      } else {
        setResult({ ok: false, message: data.error || 'Failed to send' })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSending(false)
    }
  }, [text, photoUrl, buttons, disablePreview, secret])

  // ── Auth screen ────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-center">Channel Admin</h1>
          <p className="text-sm text-gray-400 text-center">Enter admin secret to continue</p>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Admin secret..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button
            onClick={handleAuth}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold hover:bg-blue-500 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  // ── Editor ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-4xl p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Telegram Channel Publisher</h1>
          <span className="text-xs text-gray-500">HTML formatting</span>
        </div>

        {/* Templates */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 block">
            Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => applyTemplate(tpl)}
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium hover:border-blue-500/40 transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            {/* Text */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">
                Post Text (HTML)
              </label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={12}
                placeholder="<b>Title</b>\n\nYour message here..."
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 resize-y"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Supported: &lt;b&gt; &lt;i&gt; &lt;u&gt; &lt;s&gt; &lt;code&gt; &lt;pre&gt; &lt;a href=&quot;...&quot;&gt; &lt;blockquote&gt; &lt;tg-spoiler&gt;
              </p>
            </div>

            {/* Photo URL */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-1 block">
                Photo URL (optional)
              </label>
              <input
                type="text"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                If set, post will be sent as photo with caption. Max caption: 1024 chars.
              </p>
            </div>

            {/* Buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wide text-gray-400">
                  Inline Buttons
                </label>
                <button
                  onClick={addButtonRow}
                  className="text-[10px] text-blue-400 hover:text-blue-300"
                >
                  + Add Row
                </button>
              </div>

              {buttons.length === 0 && (
                <p className="text-xs text-gray-500">No buttons. Click &quot;+ Add Row&quot; to add.</p>
              )}

              <div className="space-y-2">
                {buttons.map((row, ri) => (
                  <div key={ri} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-gray-500">Row {ri + 1}</span>
                      <button
                        onClick={() => addButtonToRow(ri)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 ml-auto"
                      >
                        + Button
                      </button>
                    </div>
                    {row.map((btn, bi) => (
                      <div key={bi} className="flex gap-1">
                        <input
                          type="text"
                          value={btn.text}
                          onChange={e => updateButton(ri, bi, 'text', e.target.value)}
                          placeholder="Button text"
                          className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={btn.url}
                          onChange={e => updateButton(ri, bi, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-[2] rounded border border-gray-700 bg-gray-900 px-2 py-1.5 text-xs outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeButton(ri, bi)}
                          className="text-red-400 hover:text-red-300 px-1 text-xs"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Options */}
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={disablePreview}
                onChange={e => setDisablePreview(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-400">Disable link preview</span>
            </label>

            {/* Send */}
            <button
              onClick={sendPost}
              disabled={sending || !text.trim()}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : 'Publish to Channel'}
            </button>

            {result && (
              <div className={`rounded-lg px-3 py-2 text-xs ${
                result.ok
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {result.message}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2 block">
              Preview
            </label>
            <div className="rounded-xl border border-gray-700 bg-gray-900 p-4 space-y-3">
              {photoUrl && (
                <div className="rounded-lg bg-gray-800 border border-gray-700 h-48 flex items-center justify-center text-xs text-gray-500 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
              )}
              <div
                className="text-sm whitespace-pre-wrap [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_code]:font-mono [&_code]:bg-gray-800 [&_code]:px-1 [&_code]:rounded [&_blockquote]:border-l-2 [&_blockquote]:border-gray-500 [&_blockquote]:pl-3 [&_blockquote]:text-gray-300 [&_a]:text-blue-400 [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: text || '<span class="text-gray-500">Your post will appear here...</span>' }}
              />
              {buttons.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-gray-700">
                  {buttons.map((row, ri) => (
                    <div key={ri} className="flex gap-1">
                      {row.filter(b => b.text).map((btn, bi) => (
                        <div
                          key={bi}
                          className="flex-1 text-center rounded-lg bg-gray-800 border border-gray-600 px-3 py-2 text-xs text-blue-400 font-medium"
                        >
                          {btn.text}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
