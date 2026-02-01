'use client'

import { motion } from 'framer-motion'
import { useWallet, useTokenBalances, useTransactionHistory, truncateAddress } from '@/lib/wallet'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'

type TabId = 'overview' | 'history' | 'send' | 'receive'

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
      <div className="grid grid-cols-2 gap-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onNavigate('send')}
            className="w-full h-16 bg-gray-800 hover:bg-gray-700 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              </div>
              <span className="text-lg">Send</span>
            </div>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onNavigate('receive')}
            className="w-full h-16 bg-gray-800 hover:bg-gray-700 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              </div>
              <span className="text-lg">Receive</span>
            </div>
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
                <TransactionRow key={tx.hash} transaction={tx} address={address || ''} compact />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Compact transaction row for overview
function TransactionRow({
  transaction: tx,
  address,
  compact = false
}: {
  transaction: {
    hash: string
    type: string
    status: string
    from: string
    to: string
    amount: { displayValue: string; displayDenom: string }
    timestamp: string
  }
  address: string
  compact?: boolean
}) {
  const isOutgoing = tx.from.toLowerCase() === address.toLowerCase()
  const typeColors = {
    send: 'text-red-400 bg-red-500/10',
    receive: 'text-green-400 bg-green-500/10',
    contract: 'text-blue-400 bg-blue-500/10',
    instantiate: 'text-purple-400 bg-purple-500/10'
  }

  const typeIcons = {
    send: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
    receive: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    ),
    contract: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
    instantiate: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    )
  }

  const color = typeColors[tx.type as keyof typeof typeColors] || typeColors.contract
  const icon = typeIcons[tx.type as keyof typeof typeIcons] || typeIcons.contract

  return (
    <motion.div
      whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.3)' }}
      className="flex items-center gap-3 py-2 px-2 rounded-lg -mx-2"
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium capitalize">{tx.type}</p>
        <p className="text-xs text-gray-500 truncate">
          {isOutgoing ? 'To: ' : 'From: '}
          {truncateAddress(isOutgoing ? tx.to : tx.from, 6, 4)}
        </p>
      </div>
      <div className="text-right">
        <p className={`font-mono ${isOutgoing ? 'text-red-400' : 'text-green-400'}`}>
          {isOutgoing ? '-' : '+'}{tx.amount.displayValue}
        </p>
        <p className="text-xs text-gray-500">{tx.amount.displayDenom}</p>
      </div>
    </motion.div>
  )
}
