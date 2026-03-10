'use client'

import { useState, type ReactNode, type ComponentType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslations } from 'next-intl'
import {
  Zap,
  Layers,
  PlusCircle,
  LayoutList,
  BarChart3,
  Wallet,
  ShoppingBag,
  TrendingUp,
  Newspaper,
  MessageCircle,
  Users,
  UserCircle,
  HelpCircle,
  ChevronDown,
  ExternalLink,
} from 'lucide-react'
import {
  GiCrossedSwords,
  GiTrophy,
  GiCrown,
  GiCutDiamond,
  GiFlame,
} from 'react-icons/gi'

const COINFLIP_URL = 'https://coinflip.axiome-launch.com/game'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.4 },
}

/* ─── Reusable components ─── */

function Section({
  id,
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  id: string
  icon: ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  children: ReactNode
}) {
  return (
    <motion.section id={id} className="mb-16 scroll-mt-24" {...fadeUp}>
      <div className="flex items-center gap-3 mb-6">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
      </div>
      {children}
    </motion.section>
  )
}

function InfoBox({
  type = 'info',
  children,
}: {
  type?: 'info' | 'tip' | 'warning'
  children: ReactNode
}) {
  const s = {
    info: 'bg-indigo-500/5 border-indigo-500/15',
    tip: 'bg-emerald-500/5 border-emerald-500/15',
    warning: 'bg-amber-500/5 border-amber-500/15',
  }
  const icons = { info: 'ℹ️', tip: '💡', warning: '⚠️' }
  return (
    <div className={`rounded-xl border p-4 ${s[type]}`}>
      <div className="flex items-start gap-2.5">
        <span className="text-sm shrink-0 mt-0.5">{icons[type]}</span>
        <div className="text-sm text-zinc-400 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

function Steps({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-3">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <p className="text-sm text-zinc-300 leading-relaxed">{item}</p>
        </div>
      ))}
    </div>
  )
}

function Bullets({
  items,
  color = 'indigo',
}: {
  items: string[]
  color?: string
}) {
  const dotColors: Record<string, string> = {
    indigo: 'text-indigo-400',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
    rose: 'text-rose-400',
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
          <span className={`${dotColors[color] || dotColors.indigo} mt-0.5 shrink-0`}>•</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  )
}

function DataTable({
  headers,
  rows,
}: {
  headers: string[]
  rows: string[][]
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-zinc-900/80">
            {headers.map((h, i) => (
              <th
                key={i}
                className="text-left text-zinc-400 font-medium px-4 py-3 border-b border-zinc-800"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20 transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Divider({ label }: { label?: string }) {
  return (
    <div className="my-16 flex items-center gap-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
      {label && (
        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">
          {label}
        </span>
      )}
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
    </div>
  )
}

function FaqItem({
  q,
  a,
  isOpen,
  onClick,
}: {
  q: string
  a: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <div className="border-b border-zinc-800/40 last:border-0">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between py-4 text-left group"
      >
        <span className="text-sm font-medium text-white pr-4 group-hover:text-indigo-300 transition-colors">
          {q}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-zinc-400 pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold text-white mb-3 mt-6 first:mt-0">
      {children}
    </h3>
  )
}

/* ─── Main page ─── */

export default function CoinFlipGuidePage() {
  const t = useTranslations('docs')
  const g = (key: string) => t(`guide.${key}`)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      {/* ──── HERO ──── */}
      <motion.div className="mb-16" {...fadeUp}>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
          <GiCrossedSwords className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">
            {g('hero.badge')}
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {g('hero.title')}
        </h1>
        <p className="text-xl text-zinc-300 mb-3 max-w-2xl">
          {g('hero.subtitle')}
        </p>
        <p className="text-zinc-500 mb-8 max-w-2xl text-sm">
          {g('hero.desc')}
        </p>
        <a
          href={COINFLIP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20 hover:shadow-amber-500/30"
        >
          {g('hero.cta')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </motion.div>

      {/* ═══════════════ QUICKSTART ═══════════════ */}

      {/* 1. Getting Started */}
      <Section
        id="getting-started"
        icon={Zap}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        title={g('gettingStarted.title')}
      >
        <p className="text-zinc-400 mb-6">{g('gettingStarted.subtitle')}</p>

        <H3>{g('gettingStarted.reqTitle')}</H3>
        <Bullets
          color="emerald"
          items={[1, 2, 3].map((i) => g(`gettingStarted.req${i}`))}
        />

        <H3>{g('gettingStarted.connectTitle')}</H3>
        <Steps
          items={[1, 2, 3].map((i) => g(`gettingStarted.connectStep${i}`))}
        />

        <H3>{g('gettingStarted.firstTitle')}</H3>
        <Steps
          items={[1, 2, 3].map((i) => g(`gettingStarted.first${i}`))}
        />

        <div className="mt-6">
          <InfoBox type="tip">{g('gettingStarted.note')}</InfoBox>
        </div>
      </Section>

      <Divider label={g('divider.gameplay')} />

      {/* 2. Main Page */}
      <Section
        id="main-page"
        icon={Layers}
        iconBg="bg-blue-500/15"
        iconColor="text-blue-400"
        title={g('mainPage.title')}
      >
        <p className="text-zinc-400 mb-6">{g('mainPage.subtitle')}</p>
        <DataTable
          headers={[g('mainPage.tabHeader'), g('mainPage.descHeader')]}
          rows={[1, 2, 3, 4].map((i) => [
            g(`mainPage.tab${i}`),
            g(`mainPage.tabDesc${i}`),
          ])}
        />
        <H3>{g('mainPage.elementsTitle')}</H3>
        <Bullets
          color="blue"
          items={[1, 2, 3, 4].map((i) => g(`mainPage.element${i}`))}
        />
        <div className="mt-4">
          <InfoBox type="info">{g('mainPage.note')}</InfoBox>
        </div>
      </Section>

      {/* 3. Create Bet */}
      <Section
        id="create-bet"
        icon={PlusCircle}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
        title={g('createBet.title')}
      >
        <H3>{g('createBet.howTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4, 5, 6].map((i) => g(`createBet.step${i}`))}
        />

        <H3>{g('createBet.exampleTitle')}</H3>
        <DataTable
          headers={['', g('createBet.valueHeader')]}
          rows={[1, 2, 3, 4, 5].map((i) => [
            g(`createBet.exLabel${i}`),
            g(`createBet.exValue${i}`),
          ])}
        />

        <H3>{g('createBet.limitsTitle')}</H3>
        <Bullets
          items={[1, 2, 3].map((i) => g(`createBet.limit${i}`))}
        />
      </Section>

      {/* 4. Accept Bet */}
      <Section
        id="accept-bet"
        icon={GiCrossedSwords}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        title={g('acceptBet.title')}
      >
        <H3>{g('acceptBet.howTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4, 5].map((i) => g(`acceptBet.step${i}`))}
        />

        <H3>{g('acceptBet.techTitle')}</H3>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-5">
          <Steps
            items={[1, 2, 3, 4, 5].map((i) => g(`acceptBet.tech${i}`))}
          />
        </div>

        <H3>{g('acceptBet.filterTitle')}</H3>
        <Bullets
          color="amber"
          items={[1, 2, 3, 4].map((i) => g(`acceptBet.filter${i}`))}
        />
      </Section>

      {/* 5. My Bets */}
      <Section
        id="my-bets"
        icon={LayoutList}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        title={g('myBets.title')}
      >
        <p className="text-zinc-400 mb-6">{g('myBets.subtitle')}</p>

        <div className="grid gap-4">
          {(['open', 'inGame', 'results'] as const).map((key) => (
            <div
              key={key}
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-5"
            >
              <h4 className="text-white font-semibold mb-2">
                {g(`myBets.${key}Title`)}
              </h4>
              <p className="text-sm text-zinc-400">
                {g(`myBets.${key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 6. History & Stats */}
      <Section
        id="history"
        icon={BarChart3}
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        title={g('history.title')}
      >
        <p className="text-zinc-400 mb-6">{g('history.subtitle')}</p>
        <Bullets
          color="indigo"
          items={[1, 2, 3, 4, 5, 6].map((i) => g(`history.item${i}`))}
        />
      </Section>

      {/* 7. Leaderboard */}
      <Section
        id="leaderboard"
        icon={GiTrophy}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        title={g('leaderboard.title')}
      >
        <p className="text-zinc-400 mb-6">{g('leaderboard.subtitle')}</p>
        <DataTable
          headers={[g('leaderboard.modeHeader'), g('leaderboard.descHeader')]}
          rows={[1, 2, 3].map((i) => [
            g(`leaderboard.mode${i}`),
            g(`leaderboard.modeDesc${i}`),
          ])}
        />
      </Section>

      <Divider label={g('divider.economy')} />

      {/* 8. Wallet */}
      <Section
        id="wallet"
        icon={Wallet}
        iconBg="bg-blue-500/15"
        iconColor="text-blue-400"
        title={g('wallet.title')}
      >
        <p className="text-zinc-400 mb-6">{g('wallet.subtitle')}</p>

        <H3>{g('wallet.balanceTitle')}</H3>
        <Bullets
          color="blue"
          items={[1, 2, 3].map((i) => g(`wallet.balance${i}`))}
        />

        <H3>{g('wallet.depositTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4].map((i) => g(`wallet.depositStep${i}`))}
        />

        <H3>{g('wallet.withdrawTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4].map((i) => g(`wallet.withdrawStep${i}`))}
        />

        <div className="mt-4">
          <InfoBox type="info">{g('wallet.note')}</InfoBox>
        </div>
      </Section>

      {/* 9. Shop */}
      <Section
        id="shop"
        icon={ShoppingBag}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        title={g('shop.title')}
      >
        <p className="text-zinc-400 mb-6">{g('shop.subtitle')}</p>

        <H3>{g('shop.howTitle')}</H3>
        <Steps items={[1, 2, 3, 4].map((i) => g(`shop.step${i}`))} />

        <div className="mt-6">
          <InfoBox type="tip">{g('shop.bonus')}</InfoBox>
        </div>
        <div className="mt-3">
          <InfoBox type="info">{g('shop.note')}</InfoBox>
        </div>
      </Section>

      {/* 10. Staking LAUNCH */}
      <Section
        id="staking-launch"
        icon={TrendingUp}
        iconBg="bg-emerald-500/15"
        iconColor="text-emerald-400"
        title={g('stakingLaunch.title')}
      >
        <p className="text-zinc-400 mb-6">{g('stakingLaunch.subtitle')}</p>

        <H3>{g('stakingLaunch.howTitle')}</H3>
        <Bullets
          color="emerald"
          items={[1, 2, 3].map((i) => g(`stakingLaunch.how${i}`))}
        />

        <H3>{g('stakingLaunch.stakeTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4, 5].map((i) =>
            g(`stakingLaunch.stakeStep${i}`)
          )}
        />

        <H3>{g('stakingLaunch.claimTitle')}</H3>
        <Steps
          items={[1, 2, 3].map((i) => g(`stakingLaunch.claimStep${i}`))}
        />

        <H3>{g('stakingLaunch.unstakeTitle')}</H3>
        <Steps
          items={[1, 2, 3].map((i) => g(`stakingLaunch.unstakeStep${i}`))}
        />

        <H3>{g('stakingLaunch.statsTitle')}</H3>
        <Bullets
          color="emerald"
          items={[1, 2, 3, 4, 5].map((i) => g(`stakingLaunch.stat${i}`))}
        />
      </Section>

      {/* 11. VIP */}
      <Section
        id="vip"
        icon={GiCrown}
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        title={g('vip.title')}
      >
        <p className="text-zinc-400 mb-6">{g('vip.subtitle')}</p>

        <DataTable
          headers={[
            g('vip.featureHeader'),
            'Silver',
            'Gold',
            'Diamond',
          ]}
          rows={[1, 2, 3, 4, 5, 6, 7, 8].map((i) => [
            g(`vip.feature${i}`),
            g(`vip.silver${i}`),
            g(`vip.gold${i}`),
            g(`vip.diamond${i}`),
          ])}
        />

        <div className="mt-6">
          <InfoBox type="info">{g('vip.note')}</InfoBox>
        </div>

        <H3>{g('vip.diamondTitle')}</H3>
        <Bullets
          color="amber"
          items={[1, 2, 3].map((i) => g(`vip.diamondCustom${i}`))}
        />
      </Section>

      <Divider label={g('divider.features')} />

      {/* 12. Jackpot */}
      <Section
        id="jackpot"
        icon={GiCutDiamond}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        title={g('jackpot.title')}
      >
        <p className="text-zinc-400 mb-6">{g('jackpot.subtitle')}</p>

        <H3>{g('jackpot.howTitle')}</H3>
        <Bullets
          color="violet"
          items={[1, 2, 3, 4].map((i) => g(`jackpot.how${i}`))}
        />

        <H3>{g('jackpot.levelsTitle')}</H3>
        <DataTable
          headers={[
            g('jackpot.levelHeader'),
            g('jackpot.accessHeader'),
          ]}
          rows={[1, 2, 3, 4, 5].map((i) => [
            g(`jackpot.level${i}`),
            g(`jackpot.access${i}`),
          ])}
        />

        <div className="mt-4">
          <InfoBox type="info">{g('jackpot.note')}</InfoBox>
        </div>
      </Section>

      {/* 13. Events */}
      <Section
        id="events"
        icon={GiFlame}
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        title={g('events.title')}
      >
        <p className="text-zinc-400 mb-6">{g('events.subtitle')}</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-5">
            <h4 className="text-emerald-400 font-semibold mb-2">
              {g('events.contestTitle')}
            </h4>
            <p className="text-sm text-zinc-400 mb-3">
              {g('events.contestDesc')}
            </p>
            <Bullets
              color="emerald"
              items={[1, 2, 3].map((i) => g(`events.contest${i}`))}
            />
          </div>
          <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-5">
            <h4 className="text-amber-400 font-semibold mb-2">
              {g('events.raffleTitle')}
            </h4>
            <p className="text-sm text-zinc-400 mb-3">
              {g('events.raffleDesc')}
            </p>
            <Bullets
              color="amber"
              items={[1, 2, 3].map((i) => g(`events.raffle${i}`))}
            />
          </div>
        </div>

        <H3>{g('events.sponsorTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4].map((i) => g(`events.sponsorStep${i}`))}
        />
      </Section>

      {/* 14. News */}
      <Section
        id="news"
        icon={Newspaper}
        iconBg="bg-blue-500/15"
        iconColor="text-blue-400"
        title={g('news.title')}
      >
        <p className="text-zinc-400 mb-6">{g('news.subtitle')}</p>
        <DataTable
          headers={[g('news.filterHeader'), g('news.contentHeader')]}
          rows={[1, 2, 3, 4, 5].map((i) => [
            g(`news.filter${i}`),
            g(`news.filterDesc${i}`),
          ])}
        />
        <div className="mt-4">
          <InfoBox type="info">{g('news.note')}</InfoBox>
        </div>
      </Section>

      {/* 15. Social */}
      <Section
        id="social"
        icon={MessageCircle}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
        title={g('social.title')}
      >
        <p className="text-zinc-400 mb-6">{g('social.subtitle')}</p>

        <H3>{g('social.chatTitle')}</H3>
        <Bullets
          items={[1, 2, 3, 4, 5].map((i) => g(`social.chat${i}`))}
        />

        <H3>{g('social.transferTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4].map((i) => g(`social.transferStep${i}`))}
        />

        <H3>{g('social.favTitle')}</H3>
        <p className="text-sm text-zinc-400">{g('social.favDesc')}</p>
      </Section>

      {/* 16. Referral */}
      <Section
        id="referral"
        icon={Users}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
        title={g('referral.title')}
      >
        <p className="text-zinc-400 mb-6">{g('referral.subtitle')}</p>

        <H3>{g('referral.howTitle')}</H3>
        <Steps
          items={[1, 2, 3, 4].map((i) => g(`referral.howStep${i}`))}
        />

        <H3>{g('referral.rewardsTitle')}</H3>
        <DataTable
          headers={[g('referral.levelHeader'), g('referral.rewardHeader')]}
          rows={[1, 2, 3].map((i) => [
            g(`referral.level${i}`),
            g(`referral.reward${i}`),
          ])}
        />

        <div className="mt-4">
          <InfoBox type="info">{g('referral.note')}</InfoBox>
        </div>
      </Section>

      <Divider label={g('divider.account')} />

      {/* 17. Profile */}
      <Section
        id="profile"
        icon={UserCircle}
        iconBg="bg-violet-500/15"
        iconColor="text-violet-400"
        title={g('profile.title')}
      >
        <p className="text-zinc-400 mb-6">{g('profile.subtitle')}</p>

        <H3>{g('profile.sectionsTitle')}</H3>
        <Bullets
          color="violet"
          items={[1, 2, 3, 4, 5, 6, 7].map((i) =>
            g(`profile.section${i}`)
          )}
        />

        <H3>{g('profile.achieveTitle')}</H3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/50 border border-zinc-800/40 rounded-lg px-3 py-2 text-xs text-zinc-400"
            >
              {g(`profile.achieve${i}`)}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <InfoBox type="tip">{g('profile.achieveNote')}</InfoBox>
        </div>
      </Section>

      {/* 18. FAQ */}
      <Section
        id="faq"
        icon={HelpCircle}
        iconBg="bg-indigo-500/15"
        iconColor="text-indigo-400"
        title={g('faq.title')}
      >
        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl divide-y divide-zinc-800/30 px-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <FaqItem
              key={i}
              q={g(`faq.q${i}`)}
              a={g(`faq.a${i}`)}
              isOpen={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </Section>

      {/* ──── FOOTER CTA ──── */}
      <motion.div className="text-center py-12" {...fadeUp}>
        <p className="text-zinc-500 mb-4">{g('footer.text')}</p>
        <a
          href={COINFLIP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
        >
          {g('hero.cta')}
          <ExternalLink className="w-4 h-4" />
        </a>
      </motion.div>
    </>
  )
}
