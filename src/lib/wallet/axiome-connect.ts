/**
 * Axiome Connect - Deep link wallet connection for Axiome Wallet
 *
 * Protocol: axiomesign://
 * Flow:
 * 1. Generate unique session ID
 * 2. Create deep link with callback URL
 * 3. User opens in Axiome Wallet, approves connection
 * 4. Wallet redirects back with signed message
 * 5. Verify signature and establish session
 */

import { AXIOME_CHAIN } from './chain'

export interface AxiomeConnectSession {
  id: string
  address: string | null
  publicKey: string | null
  name: string | null
  createdAt: number
  expiresAt: number
  status: 'pending' | 'connected' | 'expired' | 'rejected'
}

export interface AxiomeConnectRequest {
  action: 'connect' | 'sign' | 'signTx'
  sessionId: string
  callbackUrl: string
  chainId: string
  dappName: string
  dappIcon?: string
  message?: string
  transaction?: object
}

// Generate unique session ID
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `axm_${timestamp}_${random}`
}

// Create Axiome Connect deep link
export function createConnectDeepLink(options: {
  sessionId: string
  callbackUrl: string
  dappName?: string
}): string {
  const { sessionId, callbackUrl, dappName = 'Axiome Launch Suite' } = options

  const params = new URLSearchParams({
    action: 'connect',
    session: sessionId,
    callback: callbackUrl,
    chain: AXIOME_CHAIN.chainId,
    dapp: dappName,
  })

  return `axiomesign://connect?${params.toString()}`
}

// Create sign message deep link
export function createSignMessageDeepLink(options: {
  sessionId: string
  callbackUrl: string
  message: string
  address: string
}): string {
  const { sessionId, callbackUrl, message, address } = options

  const params = new URLSearchParams({
    action: 'sign',
    session: sessionId,
    callback: callbackUrl,
    chain: AXIOME_CHAIN.chainId,
    address,
    message: Buffer.from(message).toString('base64'),
  })

  return `axiomesign://sign?${params.toString()}`
}

// Session storage
const SESSION_KEY = 'axiome_connect_session'
const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

export function saveSession(session: AxiomeConnectSession): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession(): AxiomeConnectSession | null {
  if (typeof window === 'undefined') return null

  const stored = localStorage.getItem(SESSION_KEY)
  if (!stored) return null

  try {
    const session = JSON.parse(stored) as AxiomeConnectSession

    // Check if expired
    if (Date.now() > session.expiresAt) {
      clearSession()
      return null
    }

    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function createPendingSession(): AxiomeConnectSession {
  const now = Date.now()
  return {
    id: generateSessionId(),
    address: null,
    publicKey: null,
    name: null,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY,
    status: 'pending',
  }
}

// Parse callback response from wallet
export interface AxiomeConnectResponse {
  success: boolean
  sessionId: string
  address?: string
  publicKey?: string
  name?: string
  signature?: string
  error?: string
}

export function parseCallbackResponse(searchParams: URLSearchParams): AxiomeConnectResponse {
  const success = searchParams.get('success') === 'true'
  const sessionId = searchParams.get('session') || ''

  if (!success) {
    return {
      success: false,
      sessionId,
      error: searchParams.get('error') || 'Connection rejected',
    }
  }

  return {
    success: true,
    sessionId,
    address: searchParams.get('address') || undefined,
    publicKey: searchParams.get('pubkey') || undefined,
    name: searchParams.get('name') || undefined,
    signature: searchParams.get('signature') || undefined,
  }
}

// Verify signed message (simplified - in production use proper crypto verification)
export async function verifySignature(
  address: string,
  message: string,
  signature: string,
  publicKey: string
): Promise<boolean> {
  // In a real implementation, you would verify the signature using
  // the public key and the message. For now, we trust the wallet's response.
  // This should be done server-side for security.

  // TODO: Implement proper signature verification
  // using @cosmjs/crypto or similar library

  return true
}

// Check if running in mobile browser
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

// Check if Axiome Wallet app is installed (heuristic)
export function canUseDeepLink(): boolean {
  return isMobile()
}

// Generate QR code data for desktop connection
export function generateQRCodeData(deepLink: string): string {
  return deepLink
}
