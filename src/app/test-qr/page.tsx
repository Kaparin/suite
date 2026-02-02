'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useWallet } from '@/lib/wallet'
import { Button } from '@/components/ui'

type FormatType = 'simple' | 'with_typeUrl' | 'cosmos_msg' | 'full_tx' | 'keplr_style' | 'amino'

export default function TestQRPage() {
  const { address, isConnected, connect } = useWallet()
  const [format, setFormat] = useState<FormatType>('simple')

  const testAddress = address || 'axm1p9g8yads5u6aer0hxze7gze36jklljrvxlnczz'
  const toAddress = 'axm1p9g8yads5u6aer0hxze7gze36jklljrvxlnczz'

  // Different payload formats to test what Axiome Wallet expects
  const payloads: Record<FormatType, object> = {
    // Simple format (current)
    simple: {
      type: 'bank_send',
      network: 'axiome-1',
      to_address: toAddress,
      amount: [{ denom: 'uaxm', amount: '1000' }]
    },
    // With typeUrl in root
    with_typeUrl: {
      typeUrl: '/cosmos.bank.v1beta1.MsgSend',
      value: {
        fromAddress: testAddress,
        toAddress: toAddress,
        amount: [{ denom: 'uaxm', amount: '1000' }]
      }
    },
    // Cosmos SDK message array
    cosmos_msg: {
      messages: [{
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: testAddress,
          toAddress: toAddress,
          amount: [{ denom: 'uaxm', amount: '1000' }]
        }
      }],
      memo: ''
    },
    // Full TX body
    full_tx: {
      body: {
        messages: [{
          '@type': '/cosmos.bank.v1beta1.MsgSend',
          from_address: testAddress,
          to_address: toAddress,
          amount: [{ denom: 'uaxm', amount: '1000' }]
        }],
        memo: '',
        timeout_height: '0',
        extension_options: [],
        non_critical_extension_options: []
      }
    },
    // Keplr signDirect style
    keplr_style: {
      chainId: 'axiome-1',
      msgs: [{
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: testAddress,
          toAddress: toAddress,
          amount: [{ denom: 'uaxm', amount: '1000' }]
        }
      }],
      fee: {
        amount: [{ denom: 'uaxm', amount: '5000' }],
        gas: '200000'
      },
      memo: ''
    },
    // Amino format (legacy)
    amino: {
      type: 'cosmos-sdk/MsgSend',
      value: {
        from_address: testAddress,
        to_address: toAddress,
        amount: [{ denom: 'uaxm', amount: '1000' }]
      }
    }
  }

  const payload = payloads[format]
  const jsonString = JSON.stringify(payload)
  const base64 = btoa(jsonString)
  const deepLink = `axiomesign://${base64}`

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test QR Codes - URL Schemes</h1>

        {!isConnected ? (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">Connect wallet first</p>
            <Button onClick={connect}>Connect Wallet</Button>
          </div>
        ) : (
          <>
            {/* Format selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {(['simple', 'with_typeUrl', 'cosmos_msg', 'full_tx', 'keplr_style', 'amino'] as FormatType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`py-3 px-2 rounded-lg font-medium text-sm ${
                    format === f
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* QR Code */}
            <div className="bg-gray-900 rounded-xl p-6 mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={deepLink} size={250} level="L" />
                </div>
              </div>
              <p className="text-center text-gray-400 text-sm">
                Scan with Axiome Wallet
              </p>
            </div>

            {/* Payload info */}
            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Payload JSON:</h3>
              <pre className="text-xs text-green-400 overflow-auto max-h-48 bg-gray-950 p-3 rounded">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-900 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Deep Link:</h3>
              <p className="text-xs text-blue-400 break-all font-mono bg-gray-950 p-3 rounded">
                {deepLink}
              </p>
            </div>

            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Base64:</h3>
              <p className="text-xs text-yellow-400 break-all font-mono bg-gray-950 p-3 rounded">
                {base64}
              </p>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <h3 className="text-blue-300 font-medium mb-2">Тест форматов payload:</h3>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Попробуй каждый формат по очереди</li>
                <li>Сканируй QR в Axiome Wallet</li>
                <li>Найди формат который НЕ даёт ошибку typeUrl</li>
              </ol>
              <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p><b>simple</b> - наш текущий формат</p>
                <p><b>with_typeUrl</b> - typeUrl в корне</p>
                <p><b>cosmos_msg</b> - messages[] с typeUrl</p>
                <p><b>full_tx</b> - полный TX body с @type</p>
                <p><b>keplr_style</b> - как Keplr signDirect</p>
                <p><b>amino</b> - legacy Amino формат</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
