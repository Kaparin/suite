'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useWallet, useTransactionHistory, truncateAddress } from '@/lib/wallet'
import type { Transaction, TransactionType } from '@/lib/wallet'
import { Card, CardContent, Button } from '@/components/ui'

type FilterType = 'all' | TransactionType

const filterOptions: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'send', label: 'Sent' },
  { id: 'receive', label: 'Received' },
  { id: 'contract', label: 'Contracts' }
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
    refresh
  } = useTransactionHistory({
    address,
    type: filter === 'all' ? undefined : filter,
    limit: 20
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filterOptions.map((option) => (
          <motion.button
            key={option.id}
            onClick={() => setFilter(option.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              filter === option.id
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {option.label}
          </motion.button>
        ))}

        <motion.button
          onClick={refresh}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
          className="ml-auto px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <svg
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </motion.button>
      </div>

      {/* Transaction List */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardContent className="p-0">
          {isLoading && transactions.length === 0 ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3 px-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-48" />
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-700 rounded w-20 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-12 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-red-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-400 mb-3">{error}</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Try Again
              </Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">No transactions found</p>
              {filter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilter('all')}
                  className="mt-2 text-purple-400"
                >
                  Show all transactions
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {transactions.map((tx, index) => (
                <motion.div
                  key={tx.hash}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TransactionRow
                    transaction={tx}
                    address={address || ''}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      {pagination?.hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            isLoading={isLoadingMore}
          >
            Load More
          </Button>
        </div>
      )}
    </motion.div>
  )
}

// Map of contract action → human-readable label + color override
const ACTION_CONFIG: Record<string, { label: string; color?: string; icon?: string }> = {
  // CW20 token actions
  transfer: { label: 'Transfer' },
  send: { label: 'Send' },
  mint: { label: 'Mint', color: 'text-purple-400 bg-purple-500/10' },
  burn: { label: 'Burn', color: 'text-orange-400 bg-orange-500/10' },
  approve: { label: 'Approve' },
  increase_allowance: { label: 'Approve Allowance' },
  decrease_allowance: { label: 'Revoke Allowance' },
  update_marketing: { label: 'Update Token Info' },
  update_minter: { label: 'Update Minter' },
  // Staking
  stake: { label: 'Stake', color: 'text-violet-400 bg-violet-500/10' },
  unstake: { label: 'Unstake', color: 'text-orange-400 bg-orange-500/10' },
  claim: { label: 'Claim Rewards', color: 'text-emerald-400 bg-emerald-500/10' },
  withdraw: { label: 'Withdraw', color: 'text-emerald-400 bg-emerald-500/10' },
  distribute: { label: 'Distribute Rewards', color: 'text-cyan-400 bg-cyan-500/10' },
  // Presale / swap
  buy: { label: 'Buy', color: 'text-green-400 bg-green-500/10' },
  swap: { label: 'Swap', color: 'text-blue-400 bg-blue-500/10' },
  // Governance
  propose: { label: 'Create Proposal', color: 'text-purple-400 bg-purple-500/10' },
  vote: { label: 'Vote', color: 'text-blue-400 bg-blue-500/10' },
  // Authz
  grant: { label: 'Grant Permission' },
  revoke: { label: 'Revoke Permission' },
  execute: { label: 'Execute' },
  // CoinFlip game
  create_bet: { label: 'Create Bet', color: 'text-amber-400 bg-amber-500/10' },
  accept_bet: { label: 'Accept Bet', color: 'text-blue-400 bg-blue-500/10' },
  reveal: { label: 'Reveal Result', color: 'text-emerald-400 bg-emerald-500/10' },
  cancel_bet: { label: 'Cancel Bet', color: 'text-gray-400 bg-gray-500/10' },
  claim_timeout: { label: 'Claim Timeout', color: 'text-orange-400 bg-orange-500/10' },
}

const TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  send: {
    color: 'text-red-400 bg-red-500/10',
    icon: <ArrowUpIcon />,
    label: 'Sent',
  },
  receive: {
    color: 'text-green-400 bg-green-500/10',
    icon: <ArrowDownIcon />,
    label: 'Received',
  },
  contract: {
    color: 'text-blue-400 bg-blue-500/10',
    icon: <CodeIcon />,
    label: 'Contract Call',
  },
  instantiate: {
    color: 'text-purple-400 bg-purple-500/10',
    icon: <PlusIcon />,
    label: 'Deploy Contract',
  },
  delegate: {
    color: 'text-yellow-400 bg-yellow-500/10',
    icon: <LockIcon />,
    label: 'Delegate',
  },
  undelegate: {
    color: 'text-orange-400 bg-orange-500/10',
    icon: <UnlockIcon />,
    label: 'Undelegate',
  },
}

function TransactionRow({
  transaction: tx,
  address
}: {
  transaction: Transaction
  address: string
}) {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase()
  const txWithAction = tx as Transaction & { contractAction?: string; tokenSymbol?: string }

  const baseConfig = TYPE_CONFIG[tx.type] || TYPE_CONFIG.contract

  // Build label and potentially override color based on contract action
  let label = baseConfig.label
  let color = baseConfig.color
  const icon = baseConfig.icon

  if (tx.type === 'contract' && txWithAction.contractAction) {
    const action = txWithAction.contractAction
    const actionConfig = ACTION_CONFIG[action]
    if (actionConfig) {
      label = actionConfig.label
      if (actionConfig.color) color = actionConfig.color
    } else {
      // Unknown action — format it nicely
      label = action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')
    }
  }

  // Append token symbol if known
  if (txWithAction.tokenSymbol) {
    label = `${label} ${txWithAction.tokenSymbol}`
  }

  // Build description line
  let description = ''
  if (tx.type === 'send' || tx.type === 'receive') {
    description = isOutgoing
      ? `To ${truncateAddress(tx.to, 8, 6)}`
      : `From ${truncateAddress(tx.from, 8, 6)}`
  } else if (tx.type === 'contract') {
    // For contract calls, show the contract address or counterparty
    const counterparty = isOutgoing ? tx.to : tx.from
    if (counterparty) {
      description = `Contract ${truncateAddress(counterparty, 6, 4)}`
    }
  } else if (tx.type === 'delegate' || tx.type === 'undelegate') {
    description = `Validator ${truncateAddress(tx.to, 6, 4)}`
  } else if (tx.type === 'instantiate') {
    if (tx.to) {
      description = `New contract ${truncateAddress(tx.to, 6, 4)}`
    }
  }

  // Format date
  const date = new Date(tx.timestamp)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // Amount display — check for non-zero numeric value
  const numericValue = parseFloat(tx.amount.displayValue)
  const hasAmount = !isNaN(numericValue) && numericValue > 0

  return (
    <a
      href={`https://axiomechain.org/tx/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 py-4 px-4 hover:bg-gray-800/50 transition-colors"
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium text-white text-sm">{label}</span>
          {tx.status === 'failed' && (
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
              Failed
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 truncate">{description}</p>
        )}
        <p className="text-xs text-gray-600 mt-0.5">{formattedDate}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {hasAmount ? (
          <>
            <p className={`font-mono font-medium text-sm ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
              {isOutgoing ? '-' : '+'}{tx.amount.displayValue}
            </p>
            <p className="text-xs text-gray-500">{tx.amount.displayDenom}</p>
          </>
        ) : tx.fee?.displayValue && parseFloat(tx.fee.displayValue) > 0 ? (
          <p className="text-xs text-gray-600">Fee {tx.fee.displayValue} AXM</p>
        ) : (
          <p className="text-xs text-gray-600">—</p>
        )}
      </div>

      {/* Arrow */}
      <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </a>
  )
}

// Icon components
function ArrowUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
    </svg>
  )
}

function ArrowDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
    </svg>
  )
}

function CodeIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
}

function UnlockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
  )
}
