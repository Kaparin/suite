'use client'

import { motion } from 'framer-motion'
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Lock, Loader2 } from 'lucide-react'
import { useWallet, useTokenBalances, useTransactionHistory } from '@/lib/wallet'
import { TransactionRowCompact } from './HistoryTab'

type TabId = 'overview' | 'history' | 'send' | 'receive' | 'staking'

interface OverviewTabProps {
  onNavigate: (tab: TabId) => void
}

export function OverviewTab({ onNavigate }: OverviewTabProps) {
  const { address, balance, refreshBalance } = useWallet()
  const { tokens, isLoading: tokensLoading } = useTokenBalances(address)
  const { transactions, isLoading: txLoading } = useTransactionHistory({
    address,
    limit: 5,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Balance Card */}
      <div className="relative overflow-hidden rounded-2xl p-[1px]">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/30 via-purple-500/10 to-blue-500/20" />
        <div className="relative rounded-2xl bg-gray-900/95 backdrop-blur-sm px-5 py-5">
          <div className="flex justify-between items-start mb-1">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Balance</p>
            <button
              onClick={refreshBalance}
              disabled={balance.isLoading}
              className="rounded-lg p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-30"
            >
              <RefreshCw size={13} className={balance.isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tabular-nums">
              {balance.isLoading ? '...' : balance.axm}
            </span>
            <span className="text-lg text-violet-400 font-semibold">AXM</span>
          </div>

          {/* CW20 Tokens */}
          {tokensLoading ? (
            <div className="mt-4 pt-4 border-t border-gray-800/60">
              <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Loading tokens...</span>
              </div>
            </div>
          ) : tokens.length > 0 ? (
            <div className="mt-4 pt-4 border-t border-gray-800/60 space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Tokens</p>
              {tokens.map((token) => (
                <div key={token.contractAddress} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5">
                    {token.logoUrl ? (
                      <img src={token.logoUrl} alt={token.symbol} className="w-7 h-7 rounded-full" />
                    ) : (
                      <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-blue-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white leading-tight">{token.symbol}</p>
                      <p className="text-[10px] text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white tabular-nums">{token.displayBalance}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onNavigate('send')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-violet-500/30 hover:bg-gray-800/40 transition-all"
        >
          <div className="w-9 h-9 bg-violet-500/10 rounded-full flex items-center justify-center">
            <ArrowUpRight size={16} className="text-violet-400" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Send</span>
        </button>

        <button
          onClick={() => onNavigate('receive')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-emerald-500/30 hover:bg-gray-800/40 transition-all"
        >
          <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <ArrowDownLeft size={16} className="text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Receive</span>
        </button>

        <button
          onClick={() => onNavigate('staking')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl bg-gray-900/50 border border-gray-800/50 hover:border-violet-500/30 hover:bg-gray-800/40 transition-all"
        >
          <div className="w-9 h-9 bg-violet-500/10 rounded-full flex items-center justify-center">
            <Lock size={16} className="text-violet-400" />
          </div>
          <span className="text-[11px] font-bold text-gray-300">Staking</span>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-2xl border border-gray-800/50 bg-gray-900/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Recent Transactions</p>
          <button
            onClick={() => onNavigate('history')}
            className="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
          >
            View All
          </button>
        </div>
        <div className="px-3 pb-3">
          {txLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {transactions.map((tx) => (
                <TransactionRowCompact key={tx.hash} tx={tx} userAddress={address || ''} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
