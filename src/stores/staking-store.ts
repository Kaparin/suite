/**
 * Global staking operation store.
 *
 * Persists across StakingTab open/close and SignTransactionFlow lifecycle.
 * Uses useSyncExternalStore for zero-dependency React integration.
 *
 * Adapted from coinflip project for Axiome Connect signing flow.
 */

import { useSyncExternalStore } from 'react'

// ---- Types ----

export type OpType = 'stake' | 'unstake' | 'claim'
export type OpPhase = 'signing' | 'pending' | 'error'

export interface StakingOp {
  type: OpType
  amount?: number
  phase: OpPhase
  txHash?: string
  error?: string
  startedAt: number
}

// ---- Module-level singleton state ----

let _op: StakingOp | null = null
let _clearTimer: ReturnType<typeof setTimeout> | undefined
const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach((l) => l())
}

function getSnapshot(): StakingOp | null {
  return _op
}

function subscribe(listener: () => void) {
  _listeners.add(listener)
  return () => {
    _listeners.delete(listener)
  }
}

// ---- Actions ----

function startOp(type: OpType, amount?: number) {
  if (_clearTimer) {
    clearTimeout(_clearTimer)
    _clearTimer = undefined
  }
  _op = { type, amount, phase: 'signing', startedAt: Date.now() }
  notify()
}

function setPending(txHash: string) {
  if (_op) {
    _op = { ..._op, txHash, phase: 'pending' }
    notify()
    // Auto-clear after 8s — chain should have confirmed by then
    _clearTimer = setTimeout(() => {
      _op = null
      notify()
    }, 8_000)
  }
}

function setError(error: string) {
  if (_op) {
    _op = { ..._op, phase: 'error', error }
    notify()
    // Auto-dismiss after 8s
    _clearTimer = setTimeout(() => {
      _op = null
      notify()
    }, 8_000)
  }
}

function clearOp() {
  if (_clearTimer) {
    clearTimeout(_clearTimer)
    _clearTimer = undefined
  }
  _op = null
  notify()
}

// ---- React hook ----

export function useStakingStore() {
  const op = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  // ALL phases block new operations. Only null (idle) allows new ops.
  const isLocked = op !== null

  return {
    op,
    isLocked,
    startOp,
    setPending,
    setError,
    clearOp,
  }
}
