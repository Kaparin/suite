import { redirect } from 'next/navigation'

export default function StakingRedirect() {
  redirect('/wallet?tab=staking')
}
