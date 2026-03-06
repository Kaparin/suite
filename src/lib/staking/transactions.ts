import { buildExecutePayload, buildAxiomeSignLink } from '@/lib/wallet'
import { STAKING_CONTRACT, LAUNCH_CW20 } from './constants'

/** Build CW20 Send → Stake transaction (sends LAUNCH to staking contract) */
export function buildStakeLink(sender: string, amount: string): string {
  const payload = buildExecutePayload({
    contractAddress: LAUNCH_CW20,
    sender,
    msg: {
      send: {
        contract: STAKING_CONTRACT,
        amount,
        msg: btoa(JSON.stringify({ stake: {} })),
      },
    },
  })
  return buildAxiomeSignLink(payload)
}

/** Build Unstake transaction */
export function buildUnstakeLink(sender: string, amount: string): string {
  const payload = buildExecutePayload({
    contractAddress: STAKING_CONTRACT,
    sender,
    msg: { unstake: { amount } },
  })
  return buildAxiomeSignLink(payload)
}

/** Build Claim rewards transaction */
export function buildClaimLink(sender: string): string {
  const payload = buildExecutePayload({
    contractAddress: STAKING_CONTRACT,
    sender,
    msg: { claim: {} },
  })
  return buildAxiomeSignLink(payload)
}
