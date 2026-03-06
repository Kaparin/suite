import { NextResponse } from 'next/server'
import { getStakingState, LAUNCH_DECIMALS, AXM_DECIMALS } from '@/lib/staking'

/** GET /api/staking — public staking stats */
export async function GET() {
  try {
    const state = await getStakingState()

    const totalStaked = Number(state.total_staked) / 10 ** LAUNCH_DECIMALS
    const totalDistributed = Number(state.total_distributed) / 10 ** AXM_DECIMALS
    const totalClaimed = Number(state.total_claimed) / 10 ** AXM_DECIMALS
    const axmBalance = Number(state.axm_balance) / 10 ** AXM_DECIMALS

    return NextResponse.json({
      totalStaked,
      totalDistributed,
      totalClaimed,
      totalStakers: state.total_stakers,
      axmBalance,
      // Raw values for precise calculations
      raw: state,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
