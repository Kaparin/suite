'use client'

import { motion } from 'framer-motion'
import { useWallet, useTokenBalances, useTransactionHistory, truncateAddress } from '@/lib/wallet'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import type { Transaction } from '@/lib/wallet'

type TabId = 'overview' | 'history' | 'send' | 'receive' | 'staking'

interface OverviewTabProps {
  onNavigate: (tab: TabId) => void
}

export function OverviewTab({ onNavigate }: OverviewTabProps) {
  const { address, balance, refreshBalance } = useWallet()
  const { tokens, isLoading: tokensLoading } = useTokenBalances(address)
  const { transactions, isLoading: txLoading } = useTransactionHistory({
    address,
    limit: 5
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-gray-900 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  {balance.isLoading ? '...' : balance.axm}
                </span>
                <span className="text-xl text-purple-400 font-medium">AXM</span>
              </div>
            </div>
            <motion.button
              onClick={refreshBalance}
              whileHover={{ scale: 1.05, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              disabled={balance.isLoading}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg
                className={`w-5 h-5 text-gray-400 ${balance.isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </div>

          {/* CW20 Tokens */}
          {tokensLoading ? (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24" />
                </div>
                <div className="h-4 bg-gray-700 rounded w-16" />
              </div>
            </div>
          ) : tokens.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-3">Tokens</p>
              <div className="space-y-2">
                {tokens.map((token) => (
                  <motion.div
                    key={token.contractAddress}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-3">
                      {token.logoUrl ? (
                        <img
                          src={token.logoUrl}
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold">
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </div>
                    <p className="text-white font-mono">{token.displayBalance}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onNavigate('send')}
            className="w-full h-20 bg-gray-800 hover:bg-gray-700 border border-gray-700 flex-col gap-2"
          >
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
            </div>
            <span className="text-sm">Send</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onNavigate('receive')}
            className="w-full h-20 bg-gray-800 hover:bg-gray-700 border border-gray-700 flex-col gap-2"
          >
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
            </div>
            <span className="text-sm">Receive</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onNavigate('staking')}
            className="w-full h-20 bg-gray-800 hover:bg-gray-700 border border-gray-700 flex-col gap-2"
          >
            <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-sm">Staking</span>
          </Button>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Transactions</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('history')}
            className="text-purple-400 hover:text-purple-300"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-3 py-2">
                  <div className="w-10 h-10 bg-gray-700 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-32 mb-1" />
                    <div className="h-3 bg-gray-700 rounded w-20" />
                  </div>
                  <div className="h-4 bg-gray-700 rounded w-16" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <TransactionRow key={tx.hash} transaction={tx} address={address || ''} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Compact transaction row for overview — with proper labels for contract actions
function TransactionRow({
  transaction: tx,
  address,
}: {
  transaction: Transaction
  address: string
}) {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase()

  const txWithAction = tx as Transaction & { contractAction?: string; tokenSymbol?: string }

  const typeConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    send: {
      color: 'text-red-400 bg-red-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
      ),
      label: 'Sent',
    },
    receive: {
      color: 'text-green-400 bg-green-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
      ),
      label: 'Received',
    },
    contract: {
      color: 'text-blue-400 bg-blue-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      label: 'Contract',
    },
    instantiate: {
      color: 'text-purple-400 bg-purple-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      label: 'Deploy',
    },
    delegate: {
      color: 'text-yellow-400 bg-yellow-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      label: 'Staked',
    },
    undelegate: {
      color: 'text-orange-400 bg-orange-500/10',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ),
      label: 'Unstaked',
    },
  }

  const config = typeConfig[tx.type] || typeConfig.contract

  // Build label with action and token symbol
  let label = config.label
  if (tx.type === 'contract' && txWithAction.contractAction) {
    const action = txWithAction.contractAction
    const actionLabels: Record<string, string> = {
      transfer: 'Transfer',
      send: 'Send',
      mint: 'Mint',
      burn: 'Burn',
      approve: 'Approve',
      increase_allowance: 'Approve',
      decrease_allowance: 'Revoke',
      update_marketing: 'Update Info',
      update_minter: 'Update Minter',
      stake: 'Stake',
      unstake: 'Unstake',
      claim: 'Claim Rewards',
      distribute: 'Distribute',
    }
    label = actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1).replace(/_/g, ' ')
  }
  if (txWithAction.tokenSymbol) {
    label = `${label} ${txWithAction.tokenSymbol}`
  }

  const hasAmount = tx.amount.value !== '0' && tx.amount.displayValue !== '0'

  return (
    <motion.a
      href={`https://axiomechain.org/tx/${tx.hash}`}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
      className="flex items-center gap-3 py-2 px-2 rounded-lg -mx-2"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-medium text-sm">{label}</p>
          {tx.status === 'failed' && (
            <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">Failed</span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {isOutgoing ? 'To: ' : 'From: '}
          {truncateAddress(isOutgoing ? tx.to : tx.from, 6, 4)}
        </p>
      </div>
      <div className="text-right">
        {hasAmount ? (
          <>
            <p className={`font-mono text-sm ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
              {isOutgoing ? '-' : '+'}{tx.amount.displayValue}
            </p>
            <p className="text-xs text-gray-500">{tx.amount.displayDenom}</p>
          </>
        ) : (
          <p className="text-xs text-gray-500">-</p>
        )}
      </div>
    </motion.a>
  )
}
