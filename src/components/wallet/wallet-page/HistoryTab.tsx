'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  ArrowDownLeft,
  Code2,
  Plus,
  Lock,
  Unlock,
  RefreshCw,
  ExternalLink,
  Loader2,
  FileText,
  Flame,
  Coins,
  Award,
  Repeat,
  Vote,
  Dices,
  Ban,
  Timer,
  Shield,
  ShieldOff,
} from 'lucide-react'
import { useWallet, useTransactionHistory, truncateAddress } from '@/lib/wallet'
import type { Transaction, TransactionType } from '@/lib/wallet'

const EXPLORER_URL = 'https://axiomechain.org'

type FilterType = 'all' | TransactionType

const filterOptions: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'send', label: 'Sent' },
  { id: 'receive', label: 'Received' },
  { id: 'contract', label: 'Contracts' },
]

export function HistoryTab() {
  const { address } = useWallet()
  const [filter, setFilter] = useState<FilterType>('all')

  const {
    transactions,
    pagination,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    refresh,
  } = useTransactionHistory({
    address,
    type: filter === 'all' ? undefined : filter,
    limit: 20,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Filter Pills */}
      <div className="flex items-center gap-1.5">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold transition-all ${
              filter === opt.id
                ? 'bg-violet-600 text-text-primary shadow-md shadow-violet-500/25'
                : 'bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={refresh}
          disabled={isLoading}
          className="ml-auto rounded-[var(--radius-sm)] p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-2 transition-colors disabled:opacity-30"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Transaction List */}
      {isLoading && transactions.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse rounded-[var(--radius-md)] bg-surface-1 border border-border px-3 py-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-surface-2 rounded-full" />
              <div className="flex-1">
                <div className="h-3.5 bg-surface-2 rounded w-28 mb-1.5" />
                <div className="h-3 bg-surface-2 rounded w-40" />
              </div>
              <div className="h-3.5 bg-surface-2 rounded w-16" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-[var(--radius-lg)] border border-red-500/20 bg-red-500/[0.05] py-10 text-center">
          <p className="text-sm text-[var(--danger)] mb-3">{error}</p>
          <button
            onClick={refresh}
            className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Try again
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface-1 py-12 text-center">
          <FileText size={32} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-sm text-text-tertiary">No transactions found</p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-2 text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors"
            >
              Show all transactions
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.hash}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <TransactionCard tx={tx} userAddress={address || ''} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination?.hasMore && (
        <div className="text-center pt-1">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-[var(--radius-md)] bg-surface-2 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <><Loader2 size={14} className="animate-spin" /> Loading...</>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ─── Action Config ───────────────────────────────────────────────

interface ActionCfg {
  label: string
  icon: React.ReactNode
  color: string // tailwind text + bg classes
}

const ACTION_MAP: Record<string, ActionCfg> = {
  // CW20
  transfer: { label: 'Transfer', icon: <ArrowUpRight size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  send: { label: 'Send', icon: <ArrowUpRight size={14} />, color: 'text-red-400 bg-red-500/10' },
  mint: { label: 'Mint', icon: <Plus size={14} />, color: 'text-purple-400 bg-purple-500/10' },
  burn: { label: 'Burn', icon: <Flame size={14} />, color: 'text-orange-400 bg-orange-500/10' },
  approve: { label: 'Approve', icon: <Shield size={14} />, color: 'text-sky-400 bg-sky-500/10' },
  increase_allowance: { label: 'Approve', icon: <Shield size={14} />, color: 'text-sky-400 bg-sky-500/10' },
  decrease_allowance: { label: 'Revoke', icon: <ShieldOff size={14} />, color: 'text-gray-400 bg-gray-500/10' },
  update_marketing: { label: 'Update Info', icon: <Code2 size={14} />, color: 'text-gray-400 bg-gray-500/10' },
  update_minter: { label: 'Update Minter', icon: <Code2 size={14} />, color: 'text-gray-400 bg-gray-500/10' },
  // Staking
  stake: { label: 'Stake', icon: <Coins size={14} />, color: 'text-violet-400 bg-violet-500/10' },
  unstake: { label: 'Unstake', icon: <Coins size={14} />, color: 'text-orange-400 bg-orange-500/10' },
  claim: { label: 'Claim', icon: <Award size={14} />, color: 'text-emerald-400 bg-emerald-500/10' },
  withdraw: { label: 'Withdraw', icon: <Award size={14} />, color: 'text-emerald-400 bg-emerald-500/10' },
  distribute: { label: 'Distribute', icon: <Award size={14} />, color: 'text-cyan-400 bg-cyan-500/10' },
  // Trade
  buy: { label: 'Buy', icon: <ArrowDownLeft size={14} />, color: 'text-green-400 bg-green-500/10' },
  swap: { label: 'Swap', icon: <Repeat size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  // Governance
  propose: { label: 'Propose', icon: <FileText size={14} />, color: 'text-purple-400 bg-purple-500/10' },
  vote: { label: 'Vote', icon: <Vote size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  // Auth
  grant: { label: 'Grant', icon: <Shield size={14} />, color: 'text-sky-400 bg-sky-500/10' },
  revoke: { label: 'Revoke', icon: <ShieldOff size={14} />, color: 'text-gray-400 bg-gray-500/10' },
  execute: { label: 'Execute', icon: <Code2 size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  // CoinFlip
  create_bet: { label: 'Create Bet', icon: <Dices size={14} />, color: 'text-amber-400 bg-amber-500/10' },
  accept_bet: { label: 'Accept Bet', icon: <Dices size={14} />, color: 'text-blue-400 bg-blue-500/10' },
  reveal: { label: 'Reveal', icon: <Dices size={14} />, color: 'text-emerald-400 bg-emerald-500/10' },
  cancel_bet: { label: 'Cancel Bet', icon: <Ban size={14} />, color: 'text-gray-400 bg-gray-500/10' },
  claim_timeout: { label: 'Timeout', icon: <Timer size={14} />, color: 'text-orange-400 bg-orange-500/10' },
}

const TYPE_MAP: Record<string, ActionCfg> = {
  send: { label: 'Sent', icon: <ArrowUpRight size={15} />, color: 'text-red-400 bg-red-500/10' },
  receive: { label: 'Received', icon: <ArrowDownLeft size={15} />, color: 'text-green-400 bg-green-500/10' },
  contract: { label: 'Contract', icon: <Code2 size={15} />, color: 'text-blue-400 bg-blue-500/10' },
  instantiate: { label: 'Deploy', icon: <Plus size={15} />, color: 'text-purple-400 bg-purple-500/10' },
  delegate: { label: 'Delegate', icon: <Lock size={15} />, color: 'text-yellow-400 bg-yellow-500/10' },
  undelegate: { label: 'Undelegate', icon: <Unlock size={15} />, color: 'text-orange-400 bg-orange-500/10' },
}

// ─── Helpers ─────────────────────────────────────────────────────

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDisplayAmount(val: string): string {
  const n = parseFloat(val)
  if (isNaN(n) || n === 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  if (n >= 1) return n.toFixed(2)
  // Small amounts: up to 6 decimals, strip trailing zeros
  return n.toFixed(6).replace(/\.?0+$/, '')
}

// ─── Transaction Card ────────────────────────────────────────────

function TransactionCard({ tx, userAddress }: { tx: Transaction; userAddress: string }) {
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase()
  const txExt = tx as Transaction & { contractAction?: string; tokenSymbol?: string }

  // Resolve config
  let cfg = TYPE_MAP[tx.type] || TYPE_MAP.contract
  let label = cfg.label
  let icon = cfg.icon
  let color = cfg.color

  if (tx.type === 'contract' && txExt.contractAction) {
    const aCfg = ACTION_MAP[txExt.contractAction]
    if (aCfg) {
      label = aCfg.label
      icon = aCfg.icon
      color = aCfg.color
    } else {
      label = txExt.contractAction.charAt(0).toUpperCase() + txExt.contractAction.slice(1).replace(/_/g, ' ')
    }
  }

  // Token symbol badge
  const tokenSymbol = txExt.tokenSymbol

  // Counterparty
  let counterparty = ''
  if (tx.type === 'send' || tx.type === 'receive') {
    counterparty = isOutgoing ? tx.to : tx.from
  } else if (tx.type === 'contract') {
    counterparty = tx.to || tx.from
  } else if (tx.type === 'delegate' || tx.type === 'undelegate') {
    counterparty = tx.to
  } else if (tx.type === 'instantiate') {
    counterparty = tx.to
  }

  const numVal = parseFloat(tx.amount.displayValue)
  const hasAmount = !isNaN(numVal) && numVal > 0

  return (
    <a
      href={`${EXPLORER_URL}/transactions/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-[var(--radius-md)] bg-surface-1 border border-border hover:border-border hover:bg-surface-2 px-3 py-2.5 transition-all"
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-text-primary leading-tight">{label}</span>
          {tokenSymbol && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide bg-surface-2 text-text-secondary rounded">
              {tokenSymbol}
            </span>
          )}
          {tx.status === 'failed' && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[var(--danger-bg)] text-[var(--danger)] rounded">
              Failed
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {counterparty && (
            <span className="text-[11px] text-text-tertiary font-mono truncate">
              {truncateAddress(counterparty, 6, 4)}
            </span>
          )}
          <span className="text-[10px] text-text-tertiary">{relativeTime(tx.timestamp)}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        {hasAmount ? (
          <>
            <p className={`text-[13px] font-bold tabular-nums leading-tight ${
              isOutgoing ? 'text-[var(--danger)]' : 'text-[var(--success)]'
            }`}>
              {isOutgoing ? '\u2212' : '+'}{formatDisplayAmount(tx.amount.displayValue)}
            </p>
            <p className="text-[10px] text-text-tertiary font-medium">{tx.amount.displayDenom}</p>
          </>
        ) : tx.fee?.displayValue && parseFloat(tx.fee.displayValue) > 0 ? (
          <p className="text-[10px] text-text-tertiary">Fee {formatDisplayAmount(tx.fee.displayValue)} AXM</p>
        ) : null}
      </div>

      {/* Arrow */}
      <ExternalLink size={12} className="text-text-tertiary group-hover:text-text-tertiary shrink-0 transition-colors" />
    </a>
  )
}

// ─── Compact TransactionRow (for OverviewTab) ────────────────────

export function TransactionRowCompact({ tx, userAddress }: { tx: Transaction; userAddress: string }) {
  const isOutgoing = tx.from.toLowerCase() === userAddress.toLowerCase()
  const txExt = tx as Transaction & { contractAction?: string; tokenSymbol?: string }

  let cfg = TYPE_MAP[tx.type] || TYPE_MAP.contract
  let label = cfg.label
  let icon = cfg.icon
  let color = cfg.color

  if (tx.type === 'contract' && txExt.contractAction) {
    const aCfg = ACTION_MAP[txExt.contractAction]
    if (aCfg) {
      label = aCfg.label
      icon = aCfg.icon
      color = aCfg.color
    } else {
      label = txExt.contractAction.charAt(0).toUpperCase() + txExt.contractAction.slice(1).replace(/_/g, ' ')
    }
  }
  if (txExt.tokenSymbol) label = `${label} ${txExt.tokenSymbol}`

  const numVal = parseFloat(tx.amount.displayValue)
  const hasAmount = !isNaN(numVal) && numVal > 0

  return (
    <a
      href={`${EXPLORER_URL}/transactions/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2 px-1 rounded-[var(--radius-sm)] hover:bg-surface-2 -mx-1 transition-colors"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-semibold text-text-primary">{label}</span>
          {tx.status === 'failed' && (
            <span className="px-1 py-0.5 text-[8px] font-bold bg-[var(--danger-bg)] text-[var(--danger)] rounded">Failed</span>
          )}
        </div>
        <p className="text-[10px] text-text-tertiary">{relativeTime(tx.timestamp)}</p>
      </div>
      <div className="text-right shrink-0">
        {hasAmount ? (
          <>
            <p className={`text-[12px] font-bold tabular-nums ${isOutgoing ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
              {isOutgoing ? '\u2212' : '+'}{formatDisplayAmount(tx.amount.displayValue)}
            </p>
            <p className="text-[9px] text-text-tertiary">{tx.amount.displayDenom}</p>
          </>
        ) : (
          <p className="text-[10px] text-text-tertiary">\u2014</p>
        )}
      </div>
    </a>
  )
}
