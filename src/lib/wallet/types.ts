export interface WalletState {
  isConnected: boolean
  isConnecting: boolean
  address: string | null
  name: string | null
  error: string | null
}
