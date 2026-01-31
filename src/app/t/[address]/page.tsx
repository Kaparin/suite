import { Badge, Button, Card, CardContent } from '@/components/ui'

// В реальности данные будут загружаться из БД
const mockToken = {
  name: 'Axiome Meme',
  ticker: 'AMEME',
  tokenAddress: 'axm1abc123def456ghi789jkl012mno345',
  description: {
    short: 'The first community-driven meme token on Axiome blockchain.',
    long: `Axiome Meme (AMEME) is a community-driven token built on the Axiome blockchain.

Our mission is to bring fun and engagement to the Axiome ecosystem while building a strong, supportive community of holders.

Unlike typical meme tokens, AMEME has real utility: holders get access to exclusive NFT drops, community governance, and special events.`,
  },
  tokenomics: {
    supply: '1,000,000,000',
    distribution: {
      team: 10,
      marketing: 15,
      liquidity: 40,
      community: 35,
    },
  },
  links: {
    telegram: 'https://t.me/axiomememe',
    twitter: 'https://x.com/axiomememe',
    website: 'https://axiomememe.com',
  },
  metrics: {
    holders: 342,
    txCount: 1250,
    volume24h: 15420,
    marketCap: 250000,
  },
  riskFlags: [],
  score: 85,
  isVerified: true,
  createdAt: '2025-01-15',
}

export default async function TokenPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params
  const token = mockToken // В реальности: await getTokenByAddress(address)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white font-bold text-3xl">
            {token.ticker.slice(0, 2)}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <h1 className="text-4xl font-bold">{token.name}</h1>
          {token.isVerified && (
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xl text-gray-400 mb-4">${token.ticker}</p>
        <p className="text-gray-300 max-w-2xl mx-auto mb-6">
          {token.description.short}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={`https://app.axiometrade.pro/swap?token=${address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg">Buy ${token.ticker}</Button>
          </a>
          <a
            href={`https://app.axiometrade.pro/swap?token=${address}&sell=true`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="lg">Sell ${token.ticker}</Button>
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-white">{token.metrics.holders}</p>
            <p className="text-sm text-gray-400">Holders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-white">${token.metrics.volume24h.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Volume 24h</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className="text-2xl font-bold text-white">{token.metrics.txCount.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center">
            <p className={`text-2xl font-bold ${getScoreColor(token.score)}`}>{token.score}</p>
            <p className="text-sm text-gray-400">Trust Score</p>
          </CardContent>
        </Card>
      </div>

      {/* Risk Assessment */}
      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Risk Assessment</h2>
          {token.riskFlags.length === 0 ? (
            <div className="flex items-center gap-3 text-green-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>No risk flags detected. This token appears safe.</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {token.riskFlags.map((flag) => (
                <Badge key={flag} variant="danger">{flag}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* About */}
      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">About {token.name}</h2>
          <p className="text-gray-300 whitespace-pre-line">{token.description.long}</p>
        </CardContent>
      </Card>

      {/* Tokenomics */}
      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold mb-6">Tokenomics</h2>
          <div className="mb-6">
            <p className="text-sm text-gray-400 mb-1">Total Supply</p>
            <p className="text-2xl font-bold">{token.tokenomics.supply}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(token.tokenomics.distribution).map(([key, value]) => (
              <div key={key} className="bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-white">{value}%</p>
                <p className="text-sm text-gray-400 capitalize">{key}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="mb-8">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Links</h2>
          <div className="flex flex-wrap gap-3">
            {token.links.telegram && (
              <a
                href={token.links.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.327.015.095.034.311.019.478z"/>
                </svg>
                Telegram
              </a>
            )}
            {token.links.twitter && (
              <a
                href={token.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter
              </a>
            )}
            {token.links.website && (
              <a
                href={token.links.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Website
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contract Info */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Contract</h2>
          <div className="bg-gray-800 p-4 rounded-lg flex items-center justify-between">
            <code className="text-sm text-gray-300 break-all">{token.tokenAddress}</code>
            <button
              onClick={() => navigator.clipboard.writeText(token.tokenAddress)}
              className="ml-4 p-2 hover:bg-gray-700 rounded transition-colors"
              title="Copy address"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Created on {token.createdAt}
          </p>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <p className="text-center text-gray-500 text-sm mt-8">
        This is not financial advice. Always do your own research before investing.
      </p>
    </div>
  )
}
