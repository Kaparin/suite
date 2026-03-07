'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

const SITE_URL = 'https://www.axiome-launch.com'
const COINFLIP_URL = 'https://coinflip.axiome-launch.com'

// ── Types ────────────────────────────────────────────────────────────

interface InlineButton { text: string; url: string }

interface PostTemplate {
  name: string
  emoji: string
  text: string
  buttons: InlineButton[][]
  photoUrl?: string
}

interface SentPost {
  messageId: number
  text: string
  photoUrl?: string
  buttons: InlineButton[][]
  isPhoto: boolean
  sentAt: string
}

// ── Templates ────────────────────────────────────────────────────────

const TEMPLATES: PostTemplate[] = [
  {
    name: 'New Raffle',
    emoji: '🎰',
    text:
      '🏆 <b>New Raffle!</b>\n\n' +
      'Prize pool: <b>??? AXM</b>\n' +
      'Duration: 24 hours\n' +
      'Free entry — winner takes all!\n\n' +
      'Join now on Heads or Tails:',
    buttons: [[{ text: '🎰 Join Raffle', url: `${COINFLIP_URL}/game` }]],
  },
  {
    name: 'Game Update',
    emoji: '🎮',
    text:
      '🎮 <b>Heads or Tails — Update</b>\n\n' +
      'New features are live:\n\n' +
      '• ...\n' +
      '• ...\n\n' +
      'Try them now!',
    buttons: [
      [{ text: '🎮 Play Now', url: `${COINFLIP_URL}/game` }],
      [{ text: '🌐 Website', url: SITE_URL }],
    ],
  },
  {
    name: 'Staking',
    emoji: '💎',
    text:
      '💎 <b>LAUNCH Token — Earn Revenue</b>\n\n' +
      'Stake LAUNCH and earn from every product in the Axiome ecosystem.\n\n' +
      'Current APR: <b>???%</b>\n' +
      'More products = more rewards.',
    buttons: [
      [
        { text: '📈 Stake Now', url: `${SITE_URL}/staking` },
        { text: '💰 Buy LAUNCH', url: `${SITE_URL}/staking` },
      ],
    ],
  },
  {
    name: 'COIN Presale',
    emoji: '🪙',
    text:
      '🪙 <b>COIN Token Presale</b>\n\n' +
      'COIN is the game token for Heads or Tails PvP.\n\n' +
      'Buy COIN with AXM and start playing!',
    buttons: [
      [{ text: '🪙 Buy COIN', url: `${COINFLIP_URL}/presale` }],
      [{ text: '🎮 Play Game', url: `${COINFLIP_URL}/game` }],
    ],
  },
  {
    name: 'Announcement',
    emoji: '📢',
    text:
      '📢 <b>Announcement</b>\n\n' +
      '...',
    buttons: [
      [{ text: '🌐 Learn More', url: SITE_URL }],
    ],
  },
  {
    name: 'Empty',
    emoji: '📝',
    text: '',
    buttons: [],
  },
]

// ── Formatting helpers ───────────────────────────────────────────────

interface FormatTag { tag: string; open: string; close: string; label: string; icon: string }

const FORMAT_TAGS: FormatTag[] = [
  { tag: 'b', open: '<b>', close: '</b>', label: 'Bold', icon: 'B' },
  { tag: 'i', open: '<i>', close: '</i>', label: 'Italic', icon: 'I' },
  { tag: 'u', open: '<u>', close: '</u>', label: 'Underline', icon: 'U' },
  { tag: 's', open: '<s>', close: '</s>', label: 'Strike', icon: 'S' },
  { tag: 'code', open: '<code>', close: '</code>', label: 'Code', icon: '</>' },
  { tag: 'pre', open: '<pre>', close: '</pre>', label: 'Pre', icon: '{ }' },
  { tag: 'blockquote', open: '<blockquote>', close: '</blockquote>', label: 'Quote', icon: '"' },
  { tag: 'tg-spoiler', open: '<tg-spoiler>', close: '</tg-spoiler>', label: 'Spoiler', icon: '?' },
]

// ── LocalStorage helpers ─────────────────────────────────────────────

const DRAFT_KEY = 'tg_channel_draft'
const HISTORY_KEY = 'tg_channel_history'

function saveDraft(data: { text: string; photoUrl: string; buttons: InlineButton[][] }) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch {}
}

function loadDraft(): { text: string; photoUrl: string; buttons: InlineButton[][] } | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveHistory(posts: SentPost[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(posts.slice(0, 50))) } catch {}
}

function loadHistory(): SentPost[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

// ── Component ────────────────────────────────────────────────────────

export default function ChannelAdminPage() {
  const [secret, setSecret] = useState('')
  const [authenticated, setAuthenticated] = useState(false)

  // Editor state
  const [text, setText] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [buttons, setButtons] = useState<InlineButton[][]>([])
  const [disablePreview, setDisablePreview] = useState(false)
  const [silentSend, setSilentSend] = useState(false)
  const [pinAfterSend, setPinAfterSend] = useState(false)

  // UI state
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [history, setHistory] = useState<SentPost[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null)
  const [editingIsPhoto, setEditingIsPhoto] = useState(false)
  const [tab, setTab] = useState<'editor' | 'preview'>('editor')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load draft & history on mount
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setText(draft.text)
      setPhotoUrl(draft.photoUrl)
      setButtons(draft.buttons)
    }
    setHistory(loadHistory())
  }, [])

  // Auto-save draft
  useEffect(() => {
    if (!authenticated) return
    const timer = setTimeout(() => saveDraft({ text, photoUrl, buttons }), 500)
    return () => clearTimeout(timer)
  }, [text, photoUrl, buttons, authenticated])

  const handleAuth = useCallback(() => {
    if (secret.trim()) setAuthenticated(true)
  }, [secret])

  // ── Formatting toolbar ─────────────────────────────────────────────

  const insertTag = useCallback((fmt: FormatTag) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.substring(start, end)
    const replacement = `${fmt.open}${selected || fmt.label}${fmt.close}`
    const newText = text.substring(0, start) + replacement + text.substring(end)
    setText(newText)
    // Restore cursor
    setTimeout(() => {
      ta.focus()
      const cursorPos = start + fmt.open.length + (selected || fmt.label).length
      ta.setSelectionRange(cursorPos, cursorPos)
    }, 0)
  }, [text])

  const insertLink = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = text.substring(start, end)
    const linkText = selected || 'link text'
    const replacement = `<a href="https://">${linkText}</a>`
    const newText = text.substring(0, start) + replacement + text.substring(end)
    setText(newText)
    setTimeout(() => {
      ta.focus()
      // Place cursor inside href=""
      const hrefPos = start + '<a href="'.length
      ta.setSelectionRange(hrefPos + 'https://'.length, hrefPos + 'https://'.length)
    }, 0)
  }, [text])

  // ── Template ───────────────────────────────────────────────────────

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setResult({ ok: false, message: 'File must be an image' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setResult({ ok: false, message: 'Image must be under 10MB' })
      return
    }
    setPhotoFile(file)
    setPhotoUrl('') // Clear URL when file is selected
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const clearPhoto = useCallback(() => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoUrl('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const applyTemplate = useCallback((tpl: PostTemplate) => {
    setText(tpl.text)
    setButtons(tpl.buttons.map(r => r.map(b => ({ ...b }))))
    setPhotoUrl(tpl.photoUrl || '')
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setEditingMessageId(null)
    setEditingIsPhoto(false)
    setTab('editor')
  }, [])

  // ── Buttons ────────────────────────────────────────────────────────

  const addButtonRow = useCallback(() => {
    setButtons(prev => [...prev, [{ text: '', url: '' }]])
  }, [])

  const addButtonToRow = useCallback((ri: number) => {
    setButtons(prev => prev.map((row, i) => i === ri ? [...row, { text: '', url: '' }] : row))
  }, [])

  const updateButton = useCallback((ri: number, bi: number, field: 'text' | 'url', value: string) => {
    setButtons(prev => prev.map((row, r) =>
      r === ri ? row.map((btn, b) => b === bi ? { ...btn, [field]: value } : btn) : row
    ))
  }, [])

  const removeButton = useCallback((ri: number, bi: number) => {
    setButtons(prev => prev.map((row, r) => r === ri ? row.filter((_, b) => b !== bi) : row).filter(r => r.length > 0))
  }, [])

  // ── API calls ──────────────────────────────────────────────────────

  const apiCall = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch('/api/telegram/channel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${secret}`,
      },
      body: JSON.stringify(body),
    })
    return { response, data: await response.json() }
  }, [secret])

  const cleanButtons = useCallback(() => {
    return buttons.map(r => r.filter(b => b.text.trim() && b.url.trim())).filter(r => r.length > 0)
  }, [buttons])

  const hasPhoto = !!(photoFile || photoUrl.trim())

  const sendPost = useCallback(async () => {
    if (!text.trim()) return
    setSending(true)
    setResult(null)

    try {
      const btns = cleanButtons()
      let response: Response
      let data: Record<string, unknown>

      if (photoFile) {
        // Upload file directly via multipart
        const form = new FormData()
        form.append('photo', photoFile)
        form.append('caption', text)
        if (btns.length > 0) form.append('buttons', JSON.stringify(btns))
        if (silentSend) form.append('disableNotification', 'true')
        if (pinAfterSend) form.append('pin', 'true')

        response = await fetch('/api/telegram/channel/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${secret}` },
          body: form,
        })
        data = await response.json()
      } else {
        // JSON API (text or photo URL)
        const result = await apiCall({
          action: 'send',
          text,
          photoUrl: photoUrl.trim() || undefined,
          buttons: btns.length > 0 ? btns : undefined,
          disablePreview,
          disableNotification: silentSend,
          pin: pinAfterSend,
        })
        response = result.response
        data = result.data
      }

      if (response.ok) {
        const post: SentPost = {
          messageId: data.messageId as number,
          text,
          photoUrl: photoFile ? '(uploaded)' : (photoUrl.trim() || undefined),
          buttons: btns,
          isPhoto: hasPhoto,
          sentAt: new Date().toISOString(),
        }
        const newHistory = [post, ...history]
        setHistory(newHistory)
        saveHistory(newHistory)
        setResult({ ok: true, message: `Sent! ID: ${data.messageId}${pinAfterSend ? ' (pinned)' : ''}` })
      } else {
        setResult({ ok: false, message: (data.error as string) || 'Failed to send' })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSending(false)
    }
  }, [text, photoUrl, photoFile, hasPhoto, buttons, disablePreview, silentSend, pinAfterSend, history, secret, apiCall, cleanButtons])

  const editPost = useCallback(async () => {
    if (!editingMessageId || !text.trim()) return
    setSending(true)
    setResult(null)

    try {
      const btns = cleanButtons()
      const { response, data } = await apiCall({
        action: 'edit',
        messageId: editingMessageId,
        text,
        buttons: btns.length > 0 ? btns : undefined,
        isPhoto: editingIsPhoto,
      })

      if (response.ok) {
        // Update in history
        setHistory(prev => {
          const updated = prev.map(p =>
            p.messageId === editingMessageId ? { ...p, text, buttons: btns } : p
          )
          saveHistory(updated)
          return updated
        })
        setResult({ ok: true, message: `Edited message ${editingMessageId}` })
        setEditingMessageId(null)
        setEditingIsPhoto(false)
      } else {
        setResult({ ok: false, message: data.error || 'Failed to edit' })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSending(false)
    }
  }, [editingMessageId, editingIsPhoto, text, buttons, apiCall, cleanButtons])

  const deletePost = useCallback(async (messageId: number) => {
    if (!confirm(`Delete message ${messageId}?`)) return

    try {
      const { response, data } = await apiCall({ action: 'delete', messageId })
      if (response.ok) {
        setHistory(prev => {
          const updated = prev.filter(p => p.messageId !== messageId)
          saveHistory(updated)
          return updated
        })
        setResult({ ok: true, message: `Deleted message ${messageId}` })
      } else {
        setResult({ ok: false, message: data.error || 'Failed to delete' })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
    }
  }, [apiCall])

  const pinPost = useCallback(async (messageId: number) => {
    try {
      const { response, data } = await apiCall({ action: 'pin', messageId })
      if (response.ok) {
        setResult({ ok: true, message: `Pinned message ${messageId}` })
      } else {
        setResult({ ok: false, message: data.error || 'Failed to pin' })
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Network error' })
    }
  }, [apiCall])

  const loadPostForEdit = useCallback((post: SentPost) => {
    setText(post.text)
    setPhotoUrl(post.photoUrl || '')
    setButtons(post.buttons.map(r => r.map(b => ({ ...b }))))
    setEditingMessageId(post.messageId)
    setEditingIsPhoto(post.isPhoto)
    setShowHistory(false)
    setTab('editor')
  }, [])

  // ── Character limits ───────────────────────────────────────────────

  const charLimit = hasPhoto ? 1024 : 4096
  const charCount = text.length
  const isOverLimit = charCount > charLimit

  // ── Auth screen ────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="text-3xl">📡</div>
            <h1 className="text-lg font-bold">Channel Admin</h1>
            <p className="text-xs text-gray-500">Enter admin secret to continue</p>
          </div>
          <input
            type="password"
            value={secret}
            onChange={e => setSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            placeholder="Secret..."
            className="w-full rounded-lg border border-gray-800 bg-gray-900 px-4 py-3 text-sm outline-none focus:border-blue-500"
            autoFocus
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

  // ── Main editor ────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="mx-auto max-w-5xl p-3 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📡</span>
            <div>
              <h1 className="text-base font-bold">Channel Publisher</h1>
              <p className="text-[10px] text-gray-500">Telegram channel post editor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                showHistory ? 'bg-blue-600 text-white' : 'border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              History ({history.length})
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map(tpl => (
            <button
              key={tpl.name}
              onClick={() => applyTemplate(tpl)}
              className="rounded-lg border border-gray-800 bg-gray-900/50 px-2.5 py-1.5 text-[11px] font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
            >
              {tpl.emoji} {tpl.name}
            </button>
          ))}
        </div>

        {/* History panel */}
        {showHistory && (
          <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-3 space-y-2 max-h-80 overflow-y-auto">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Sent Posts</p>
            {history.length === 0 && <p className="text-xs text-gray-600">No posts yet.</p>}
            {history.map(post => (
              <div key={post.messageId} className="flex items-start justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950 p-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-gray-500 mb-0.5">
                    #{post.messageId} · {new Date(post.sentAt).toLocaleString()} {post.isPhoto && '· 📷'}
                  </p>
                  <p className="text-xs text-gray-300 truncate">{post.text.replace(/<[^>]+>/g, '').substring(0, 100)}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => loadPostForEdit(post)}
                    className="rounded px-2 py-1 text-[10px] bg-blue-600/20 text-blue-400 hover:bg-blue-600/30"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => pinPost(post.messageId)}
                    className="rounded px-2 py-1 text-[10px] bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                    title="Pin"
                  >
                    📌
                  </button>
                  <button
                    onClick={() => deletePost(post.messageId)}
                    className="rounded px-2 py-1 text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600/30"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile tabs */}
        <div className="flex gap-1 lg:hidden">
          <button
            onClick={() => setTab('editor')}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${tab === 'editor' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
          >
            Editor
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex-1 rounded-lg py-2 text-xs font-medium ${tab === 'preview' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}
          >
            Preview
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ── Left: Editor ──────────────────────────────────────────── */}
          <div className={`space-y-3 ${tab === 'preview' ? 'hidden lg:block' : ''}`}>
            {/* Editing indicator */}
            {editingMessageId && (
              <div className="flex items-center justify-between rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <span className="text-xs text-amber-400">Editing message #{editingMessageId}</span>
                <button
                  onClick={() => { setEditingMessageId(null); setEditingIsPhoto(false) }}
                  className="text-[10px] text-amber-400 hover:text-amber-300"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Formatting toolbar */}
            <div className="flex flex-wrap gap-1 rounded-lg border border-gray-800 bg-gray-900/50 p-1.5">
              {FORMAT_TAGS.map(fmt => (
                <button
                  key={fmt.tag}
                  onClick={() => insertTag(fmt)}
                  title={fmt.label}
                  className="rounded px-2 py-1 text-[11px] font-mono text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                >
                  {fmt.icon}
                </button>
              ))}
              <button
                onClick={insertLink}
                title="Link"
                className="rounded px-2 py-1 text-[11px] font-mono text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                🔗
              </button>
              <span className="flex-1" />
              <span className={`text-[10px] px-1 py-1 tabular-nums ${isOverLimit ? 'text-red-400 font-bold' : 'text-gray-600'}`}>
                {charCount}/{charLimit}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={14}
              placeholder={'<b>Your post title</b>\n\nMessage text here...\n\nUse the toolbar above for formatting.'}
              className={`w-full rounded-lg border bg-gray-900/50 px-3 py-2.5 text-sm font-mono outline-none resize-y transition-colors ${
                isOverLimit ? 'border-red-500/50 focus:border-red-500' : 'border-gray-800 focus:border-blue-500'
              }`}
            />

            {/* Photo */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1.5 block">
                Photo <span className="font-normal normal-case text-gray-600">(optional — turns post into photo+caption, max 1024 chars)</span>
              </label>

              {/* File or preview */}
              {(photoFile || photoPreview) ? (
                <div className="relative rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden mb-2">
                  {photoPreview && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={photoPreview} alt="Selected" className="w-full h-32 object-cover" />
                  )}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-gray-950/80">
                    <span className="text-[11px] text-gray-400 truncate">{photoFile?.name} ({((photoFile?.size ?? 0) / 1024).toFixed(0)} KB)</span>
                    <button onClick={clearPhoto} className="text-[10px] text-red-400 hover:text-red-300 ml-2 shrink-0">Remove</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-start">
                  {/* Upload button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-lg border border-dashed border-gray-700 bg-gray-900/50 px-4 py-2 text-xs text-gray-400 hover:border-blue-500/40 hover:text-blue-400 transition-colors"
                  >
                    Upload Image
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {/* Or URL */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={photoUrl}
                      onChange={e => setPhotoUrl(e.target.value)}
                      placeholder="or paste image URL..."
                      className="w-full rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Inline buttons */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                  Inline Buttons <span className="font-normal normal-case text-gray-600">(URL buttons under the post)</span>
                </label>
                <button onClick={addButtonRow} className="text-[10px] text-blue-400 hover:text-blue-300 font-medium">
                  + Row
                </button>
              </div>
              {buttons.length === 0 && (
                <p className="text-[11px] text-gray-700">No buttons added.</p>
              )}
              <div className="space-y-2">
                {buttons.map((row, ri) => (
                  <div key={ri} className="rounded-lg border border-gray-800/50 bg-gray-950/50 p-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600">Row {ri + 1}</span>
                      <button onClick={() => addButtonToRow(ri)} className="text-[10px] text-blue-400 hover:text-blue-300">+ Btn</button>
                    </div>
                    {row.map((btn, bi) => (
                      <div key={bi} className="flex gap-1">
                        <input
                          value={btn.text}
                          onChange={e => updateButton(ri, bi, 'text', e.target.value)}
                          placeholder="Label"
                          className="w-28 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-[11px] outline-none focus:border-blue-500"
                        />
                        <input
                          value={btn.url}
                          onChange={e => updateButton(ri, bi, 'url', e.target.value)}
                          placeholder="https://..."
                          className="flex-1 rounded border border-gray-800 bg-gray-900 px-2 py-1 text-[11px] outline-none focus:border-blue-500"
                        />
                        <button onClick={() => removeButton(ri, bi)} className="text-red-500/60 hover:text-red-400 px-1 text-xs">×</button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Options row */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input type="checkbox" checked={disablePreview} onChange={e => setDisablePreview(e.target.checked)} className="rounded accent-blue-500" />
                <span className="text-gray-400">No link preview</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input type="checkbox" checked={silentSend} onChange={e => setSilentSend(e.target.checked)} className="rounded accent-blue-500" />
                <span className="text-gray-400">Silent send</span>
              </label>
              <label className="flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input type="checkbox" checked={pinAfterSend} onChange={e => setPinAfterSend(e.target.checked)} className="rounded accent-blue-500" />
                <span className="text-gray-400">Pin after send</span>
              </label>
            </div>

            {/* Action button */}
            {editingMessageId ? (
              <div className="flex gap-2">
                <button
                  onClick={editPost}
                  disabled={sending || !text.trim() || isOverLimit}
                  className="flex-1 rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Saving...' : `Save Edit #${editingMessageId}`}
                </button>
                <button
                  onClick={() => { setEditingMessageId(null); setEditingIsPhoto(false) }}
                  className="rounded-lg border border-gray-700 px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={sendPost}
                disabled={sending || !text.trim() || isOverLimit}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? 'Sending...' : 'Publish to Channel'}
              </button>
            )}

            {/* Result toast */}
            {result && (
              <div className={`rounded-lg px-3 py-2 text-xs ${
                result.ok
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
                {result.message}
              </div>
            )}
          </div>

          {/* ── Right: Preview ─────────────────────────────────────────── */}
          <div className={`${tab === 'editor' ? 'hidden lg:block' : ''}`}>
            <div className="sticky top-4">
              <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-2 block">
                Preview
              </label>
              {/* Telegram-like message bubble */}
              <div className="rounded-2xl border border-gray-800 bg-[#1c2733] overflow-hidden shadow-lg">
                {/* Channel name header */}
                <div className="px-4 py-2 border-b border-gray-700/50 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">A</div>
                  <div>
                    <p className="text-xs font-bold text-white">Axiome Channel</p>
                    <p className="text-[10px] text-gray-500">channel post</p>
                  </div>
                </div>

                {/* Message content */}
                <div className="p-4 space-y-3">
                  {hasPhoto && (
                    <div className="rounded-lg bg-gray-800 h-48 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview || photoUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                  )}
                  <div
                    className="text-[13px] leading-relaxed whitespace-pre-wrap break-words [&_b]:font-bold [&_i]:italic [&_u]:underline [&_s]:line-through [&_code]:font-mono [&_code]:text-[12px] [&_code]:bg-black/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:font-mono [&_pre]:text-[12px] [&_pre]:bg-black/30 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-[3px] [&_blockquote]:border-blue-400/50 [&_blockquote]:pl-3 [&_blockquote]:text-gray-300 [&_a]:text-blue-400 [&_a]:underline [&_tg-spoiler]:bg-gray-600 [&_tg-spoiler]:text-transparent [&_tg-spoiler]:rounded [&_tg-spoiler]:px-1 [&_tg-spoiler:hover]:text-white"
                    dangerouslySetInnerHTML={{ __html: text || '<span class="text-gray-600">Start typing to see preview...</span>' }}
                  />
                  {/* Inline buttons preview */}
                  {buttons.some(r => r.some(b => b.text)) && (
                    <div className="space-y-1 pt-1">
                      {buttons.map((row, ri) => (
                        <div key={ri} className="flex gap-1">
                          {row.filter(b => b.text).map((btn, bi) => (
                            <div
                              key={bi}
                              className="flex-1 text-center rounded-md bg-[#2b5278] px-3 py-2 text-[12px] text-[#64b5ef] font-medium cursor-pointer hover:bg-[#356694] transition-colors"
                            >
                              {btn.text} ↗
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Timestamp */}
                  <div className="flex justify-end">
                    <span className="text-[10px] text-gray-600">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 👁 0
                    </span>
                  </div>
                </div>
              </div>

              {/* Options summary */}
              <div className="mt-2 flex flex-wrap gap-2">
                {silentSend && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">🔇 Silent</span>}
                {pinAfterSend && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">📌 Will pin</span>}
                {disablePreview && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">🔗 No preview</span>}
                {hasPhoto && <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded">📷 Photo post</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
