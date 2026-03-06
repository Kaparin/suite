import { STAKING_CONTRACT } from './constants'

const REST_URL = process.env.NEXT_PUBLIC_AXIOME_REST || process.env.AXIOME_REST_URL || 'https://api-chain.axiomechain.org'

export interface StakingState {
  total_staked: string
  reward_per_token: string
  total_distributed: string
  total_claimed: string
  total_stakers: number
  axm_balance: string
}

export interface StakerInfo {
  staked: string
  pending_rewards: string
  total_claimed: string
}

async function queryContract<T>(query: Record<string, unknown>): Promise<T> {
  if (!STAKING_CONTRACT) throw new Error('Staking contract not configured')
  const encoded = Buffer.from(JSON.stringify(query)).toString('base64')
  const res = await fetch(
    `${REST_URL}/cosmwasm/wasm/v1/contract/${STAKING_CONTRACT}/smart/${encoded}`,
    { next: { revalidate: 15 } }
  )
  if (!res.ok) throw new Error(`Contract query failed: ${res.status}`)
  const json = await res.json()
  if (typeof json.data === 'string') {
    return JSON.parse(Buffer.from(json.data, 'base64').toString())
  }
  return json.data as T
}

export async function getStakingState(): Promise<StakingState> {
  return queryContract<StakingState>({ state: {} })
}

export async function getStakerInfo(address: string): Promise<StakerInfo> {
  return queryContract<StakerInfo>({ staker_info: { address } })
}
