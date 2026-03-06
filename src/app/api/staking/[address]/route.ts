import { NextResponse } from 'next/server'
import { getStakerInfo, LAUNCH_CW20, LAUNCH_DECIMALS, AXM_DECIMALS } from '@/lib/staking'
import { axiomeClient } from '@/lib/axiome/client'

/** GET /api/staking/:address — staker info + LAUNCH balance */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params

    if (!address || !address.startsWith('axm1')) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    const [info, launchBalanceRaw] = await Promise.all([
      getStakerInfo(address),
      axiomeClient.getCW20Balance(LAUNCH_CW20, address),
    ])

    const staked = Number(info.staked) / 10 ** LAUNCH_DECIMALS
    const pendingRewards = Number(info.pending_rewards) / 10 ** AXM_DECIMALS
    const totalClaimed = Number(info.total_claimed) / 10 ** AXM_DECIMALS
    const launchBalance = Number(launchBalanceRaw) / 10 ** LAUNCH_DECIMALS

    return NextResponse.json({
      staked,
      pendingRewards,
      totalClaimed,
      launchBalance,
      raw: info,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
