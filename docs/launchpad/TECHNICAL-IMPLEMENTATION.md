# Техническая реализация

> Смарт-контракты, API и архитектура Axiome Launch Suite

## Содержание

1. [Архитектура системы](#архитектура-системы)
2. [Смарт-контракты](#смарт-контракты)
3. [Backend API](#backend-api)
4. [Frontend интеграция](#frontend-интеграция)
5. [Безопасность](#безопасность)
6. [Деплой и инфраструктура](#деплой-и-инфраструктура)

---

## Архитектура системы

### Общая схема

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                     │
│                         (Next.js 16 + React 19)                          │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Studio  │  │ Explorer │  │  Wallet  │  │Launchpad │  │Dashboard │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │             │             │             │             │          │
│       └─────────────┴─────────────┴─────────────┴─────────────┘          │
│                                   │                                       │
│                          Axiome Connect SDK                               │
│                          (Wallet Integration)                             │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
┌───────────────────┴────────────────┐  ┌──────────┴──────────────────────┐
│           BACKEND API              │  │        AXIOME BLOCKCHAIN         │
│          (Next.js API)             │  │                                  │
├────────────────────────────────────┤  ├──────────────────────────────────┤
│  ┌────────────────────────────────┐│  │  ┌──────────────────────────────┐│
│  │      AI Generation API         ││  │  │     CW20 Token Contract      ││
│  │  (OpenAI / Anthropic Claude)   ││  │  │        (code_id: 1)          ││
│  └────────────────────────────────┘│  │  └──────────────────────────────┘│
│  ┌────────────────────────────────┐│  │  ┌──────────────────────────────┐│
│  │     Token Analysis API         ││  │  │    LAUNCH Token Contract     ││
│  │   (Risk scoring, metrics)      ││  │  │   (Staking, Governance)      ││
│  └────────────────────────────────┘│  │  └──────────────────────────────┘│
│  ┌────────────────────────────────┐│  │  ┌──────────────────────────────┐│
│  │      Launchpad API             ││  │  │   Fair Launch Contract       ││
│  │  (Projects, rounds, claims)    ││  │  │   (Bonding Curve, LP)        ││
│  └────────────────────────────────┘│  │  └──────────────────────────────┘│
│  ┌────────────────────────────────┐│  │  ┌──────────────────────────────┐│
│  │     Indexer Service            ││  │  │    Presale Contract          ││
│  │  (Events, balances, txs)       ││  │  │   (Rounds, Vesting)          ││
│  └────────────────────────────────┘│  │  └──────────────────────────────┘│
└────────────────────────────────────┘  │  ┌──────────────────────────────┐│
                                        │  │   Liquidity Lock Contract    ││
┌────────────────────────────────────┐  │  │      (LP locking)            ││
│           DATABASE                 │  │  └──────────────────────────────┘│
│          (PostgreSQL)              │  │  ┌──────────────────────────────┐│
├────────────────────────────────────┤  │  │   Vesting Contract           ││
│  • Projects                        │  │  │   (Token distribution)       ││
│  • Users / KYC                     │  │  └──────────────────────────────┘│
│  • Launches                        │  └──────────────────────────────────┘
│  • Votes                           │
│  • Analytics                       │          ┌─────────────────────┐
└────────────────────────────────────┘          │   AxiomeSwap DEX    │
                                                │   (LP creation)     │
                                                └─────────────────────┘
```

### Технологический стек

| Компонент | Технология | Версия |
|-----------|------------|--------|
| Frontend | Next.js + React | 16 / 19 |
| Styling | Tailwind CSS | 4.x |
| Animations | Framer Motion | 12.x |
| State | React Query + Zustand | - |
| Backend | Next.js API Routes | 16 |
| Database | PostgreSQL + Prisma | 17 / 7 |
| Blockchain | Axiome (Cosmos SDK) | - |
| Contracts | CosmWasm (Rust) | 2.x |
| Wallet | Axiome Connect | - |

---

## Смарт-контракты

### 1. LAUNCH Token Contract

Расширенный CW20 контракт с дополнительными функциями.

```rust
// Структура состояния
pub struct State {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
    pub total_supply: Uint128,
    pub minter: Option<Addr>,
}

// Staking структура
pub struct StakingInfo {
    pub staked_amount: Uint128,
    pub stake_time: Timestamp,
    pub tier: StakingTier,
    pub pending_rewards: Uint128,
}

pub enum StakingTier {
    Bronze,    // 100+ LAUNCH
    Silver,    // 1,000+ LAUNCH
    Gold,      // 10,000+ LAUNCH
    Platinum,  // 50,000+ LAUNCH
}

// Основные методы
#[cw_serde]
pub enum ExecuteMsg {
    // CW20 стандартные
    Transfer { recipient: String, amount: Uint128 },
    Burn { amount: Uint128 },
    Send { contract: String, amount: Uint128, msg: Binary },

    // Staking
    Stake { amount: Uint128 },
    Unstake { amount: Uint128 },
    ClaimRewards {},

    // Governance
    Vote { proposal_id: u64, vote: VoteOption },
    CreateProposal { title: String, description: String, actions: Vec<ProposalAction> },

    // Admin
    UpdateConfig { config: Config },
    AddToBlacklist { address: String },
}

#[cw_serde]
pub enum QueryMsg {
    // CW20 стандартные
    Balance { address: String },
    TokenInfo {},
    Minter {},

    // Staking
    StakingInfo { address: String },
    TotalStaked {},
    EstimatedRewards { address: String },

    // Governance
    Proposal { id: u64 },
    Proposals { start_after: Option<u64>, limit: Option<u32> },
    VotingPower { address: String },
}
```

### 2. Fair Launch Contract

Контракт для проведения Fair Launch с bonding curve.

```rust
pub struct LaunchConfig {
    // Токен
    pub token_name: String,
    pub token_symbol: String,
    pub total_supply: Uint128,

    // Bonding Curve
    pub base_price: Decimal,           // Начальная цена
    pub curve_coefficient: Decimal,     // k
    pub curve_exponent: Decimal,        // n

    // Лимиты
    pub soft_cap: Uint128,
    pub hard_cap: Uint128,
    pub max_buy_per_wallet: Uint128,

    // Тайминг
    pub start_time: Timestamp,
    pub end_time: Timestamp,
    pub cooldown_period: u64,           // Секунды между покупками

    // Ликвидность
    pub liquidity_percent: Decimal,     // % на LP
    pub liquidity_lock_months: u32,

    // Создатель
    pub creator: Addr,
    pub creator_deposit: Uint128,       // Залог LAUNCH
}

pub struct LaunchState {
    pub total_raised: Uint128,
    pub total_sold: Uint128,
    pub participants: u32,
    pub is_finalized: bool,
    pub is_successful: bool,
}

#[cw_serde]
pub enum ExecuteMsg {
    // Участие
    Buy {},                             // Покупка токенов (отправляет AXM)
    Refund {},                          // Возврат при неуспехе

    // Финализация
    Finalize {},                        // Завершение и создание LP
    ClaimTokens {},                     // Получение токенов после успеха

    // Создатель
    WithdrawFunds {},                   // Вывод средств после успеха
    UpdateConfig { config: LaunchConfig },  // До начала продажи

    // Admin
    EmergencyStop {},
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    State {},
    CurrentPrice {},
    UserContribution { address: String },
    EstimatedTokens { amount: Uint128 },
    TimeRemaining {},
}

// Расчет цены по bonding curve
fn calculate_price(state: &LaunchState, config: &LaunchConfig) -> Decimal {
    let supply_ratio = Decimal::from_ratio(
        state.total_sold,
        config.total_supply
    );

    config.base_price * (
        Decimal::one() +
        config.curve_coefficient *
        supply_ratio.pow(config.curve_exponent.to_u32().unwrap())
    )
}

// Расчет количества токенов за AXM
fn calculate_tokens_for_axm(
    axm_amount: Uint128,
    state: &LaunchState,
    config: &LaunchConfig
) -> Uint128 {
    // Интеграция под кривой для точного расчета
    // Используется численное интегрирование
    integrate_bonding_curve(axm_amount, state, config)
}
```

### 3. Presale Contract

Контракт для многораундовых presale с вестингом.

```rust
pub struct PresaleConfig {
    pub token_address: Addr,
    pub listing_price: Decimal,
    pub soft_cap: Uint128,
    pub hard_cap: Uint128,
    pub liquidity_percent: Decimal,
    pub rounds: Vec<PresaleRound>,
}

pub struct PresaleRound {
    pub name: String,
    pub discount: Decimal,              // Скидка от listing price
    pub allocation: Uint128,            // Количество токенов
    pub min_stake: Uint128,             // Минимум LAUNCH для участия
    pub max_per_wallet: Uint128,        // Лимит на кошелек
    pub vesting_tge: Decimal,           // % при TGE
    pub vesting_months: u32,            // Период вестинга
    pub start_time: Timestamp,
    pub end_time: Timestamp,
}

pub struct UserAllocation {
    pub round: String,
    pub purchased: Uint128,
    pub price: Decimal,
    pub claimed: Uint128,
    pub vesting_start: Option<Timestamp>,
}

#[cw_serde]
pub enum ExecuteMsg {
    // Участие
    Participate { round: String },      // Покупка в раунде
    Claim {},                           // Claim доступных токенов

    // TGE
    StartTGE {},                        // Запуск Token Generation Event
    AddLiquidity {},                    // Добавление ликвидности

    // Admin
    UpdateRound { round: PresaleRound },
    Refund {},                          // При неуспехе
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Round { name: String },
    Rounds {},
    UserAllocation { address: String },
    ClaimableAmount { address: String },
    TotalRaised {},
    WhitelistStatus { address: String, round: String },
}

// Расчет доступных для claim токенов
fn claimable_amount(
    allocation: &UserAllocation,
    current_time: Timestamp,
    round: &PresaleRound
) -> Uint128 {
    let vesting_start = match allocation.vesting_start {
        Some(t) => t,
        None => return Uint128::zero(), // TGE еще не начался
    };

    // TGE часть
    let tge_amount = allocation.purchased * round.vesting_tge;

    // Vested часть
    let months_passed = (current_time.seconds() - vesting_start.seconds())
        / (30 * 24 * 60 * 60);
    let months_passed = std::cmp::min(months_passed, round.vesting_months as u64);

    let vesting_amount = allocation.purchased * (Decimal::one() - round.vesting_tge);
    let vested = vesting_amount * Decimal::from_ratio(months_passed, round.vesting_months);

    let total_unlocked = tge_amount + vested;

    // Вычитаем уже полученное
    if total_unlocked > allocation.claimed {
        total_unlocked - allocation.claimed
    } else {
        Uint128::zero()
    }
}
```

### 4. Liquidity Lock Contract

```rust
pub struct LockConfig {
    pub lp_token: Addr,
    pub beneficiary: Addr,
    pub lock_end: Timestamp,
    pub cliff_end: Option<Timestamp>,
    pub unlock_schedule: UnlockSchedule,
}

pub enum UnlockSchedule {
    Instant,                            // Всё сразу после lock_end
    Linear { months: u32 },             // Линейная разблокировка
    Stepped { steps: Vec<UnlockStep> }, // Поэтапная
}

pub struct UnlockStep {
    pub time: Timestamp,
    pub percent: Decimal,
}

pub struct LockState {
    pub total_locked: Uint128,
    pub total_withdrawn: Uint128,
}

#[cw_serde]
pub enum ExecuteMsg {
    Lock { amount: Uint128, config: LockConfig },
    Withdraw {},
    ExtendLock { new_end: Timestamp },
}

#[cw_serde]
pub enum QueryMsg {
    LockInfo { id: u64 },
    WithdrawableAmount { id: u64 },
    AllLocks { beneficiary: Option<String> },
}
```

### 5. Vesting Contract

```rust
pub struct VestingSchedule {
    pub beneficiary: Addr,
    pub token: Addr,
    pub total_amount: Uint128,
    pub start_time: Timestamp,
    pub cliff_months: u32,
    pub vesting_months: u32,
    pub tge_percent: Decimal,
}

pub struct VestingState {
    pub claimed: Uint128,
    pub last_claim: Option<Timestamp>,
}

#[cw_serde]
pub enum ExecuteMsg {
    CreateVesting { schedule: VestingSchedule },
    Claim {},
    RevokeVesting { beneficiary: String },  // Только admin
}

#[cw_serde]
pub enum QueryMsg {
    VestingInfo { beneficiary: String },
    ClaimableAmount { beneficiary: String },
    AllVestings { start_after: Option<String>, limit: Option<u32> },
}
```

### Деплой контрактов

```bash
# 1. Компиляция контрактов
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.14.0

# 2. Загрузка на блокчейн
axiomed tx wasm store artifacts/launch_token.wasm \
  --from deployer --gas auto --gas-adjustment 1.3

# 3. Инициализация LAUNCH токена
axiomed tx wasm instantiate $CODE_ID \
  '{
    "name": "Axiome Launch Token",
    "symbol": "LAUNCH",
    "decimals": 6,
    "initial_balances": [
      {"address": "axm1treasury...", "amount": "40000000000000"},
      {"address": "axm1liquidity...", "amount": "20000000000000"},
      ...
    ],
    "minter": {"minter": "axm1admin...", "cap": "100000000000000"}
  }' \
  --label "LAUNCH Token" --from deployer --admin axm1admin...

# 4. Верификация контракта
axiomed query wasm contract-state smart $CONTRACT_ADDR '{"token_info":{}}'
```

---

## Backend API

### API Endpoints

#### Projects API

```typescript
// GET /api/projects
// Список проектов с фильтрацией
interface GetProjectsRequest {
  status?: 'upcoming' | 'active' | 'completed' | 'failed'
  type?: 'fair_launch' | 'presale'
  verified?: boolean
  page?: number
  limit?: number
  sort?: 'newest' | 'ending_soon' | 'most_raised' | 'highest_score'
}

interface GetProjectsResponse {
  projects: Project[]
  pagination: {
    total: number
    page: number
    limit: number
    hasMore: boolean
  }
}

// GET /api/projects/:id
// Детали проекта
interface Project {
  id: string
  name: string
  symbol: string
  description: string
  logo: string

  // Тип и статус
  type: 'fair_launch' | 'presale'
  status: 'upcoming' | 'active' | 'completed' | 'failed'
  verification: 'unverified' | 'basic' | 'premium' | 'audited'

  // Метрики
  raised: string
  softCap: string
  hardCap: string
  participants: number
  trustScore: number

  // Тайминг
  startTime: string
  endTime: string

  // Ссылки
  website?: string
  twitter?: string
  telegram?: string
  discord?: string
  whitepaper?: string

  // Контракты
  tokenAddress?: string
  launchContract: string
  lpAddress?: string
}

// POST /api/projects
// Создание проекта
interface CreateProjectRequest {
  name: string
  symbol: string
  description: string
  logo: string

  type: 'fair_launch' | 'presale'
  config: FairLaunchConfig | PresaleConfig

  // Опционально
  website?: string
  twitter?: string
  telegram?: string

  // AI-сгенерированный контент
  aiContent?: {
    tokenomics: object
    launchPlan: object
    faq: object[]
    promo: object
  }
}
```

#### Launch API

```typescript
// POST /api/launch/participate
// Участие в launch
interface ParticipateRequest {
  projectId: string
  amount: string          // В AXM
  round?: string          // Для presale
}

interface ParticipateResponse {
  transactionPayload: TransactionPayload
  estimatedTokens: string
  currentPrice: string
}

// GET /api/launch/:projectId/status
// Статус launch
interface LaunchStatus {
  raised: string
  sold: string
  participants: number
  currentPrice: string
  timeRemaining: number
  userContribution?: string
  userTokens?: string
}

// POST /api/launch/claim
// Claim токенов
interface ClaimRequest {
  projectId: string
}

interface ClaimResponse {
  transactionPayload: TransactionPayload
  claimableAmount: string
}
```

#### Staking API

```typescript
// GET /api/staking/info
// Информация о стейкинге пользователя
interface StakingInfo {
  stakedAmount: string
  tier: 'none' | 'bronze' | 'silver' | 'gold' | 'platinum'
  stakingTime: string
  pendingRewards: string
  votingPower: string
  apr: string
}

// POST /api/staking/stake
interface StakeRequest {
  amount: string
}

// POST /api/staking/unstake
interface UnstakeRequest {
  amount: string
}

// POST /api/staking/claim-rewards
// Claim staking rewards
```

#### Verification API

```typescript
// POST /api/verification/submit
interface VerificationRequest {
  projectId: string
  level: 'basic' | 'premium' | 'audited'

  // Basic
  email: string
  twitter: string
  telegram: string

  // Premium
  kycData?: {
    fullName: string
    country: string
    idType: string
    idNumber: string
    idFrontImage: string    // Base64
    idBackImage: string
    selfieImage: string
  }

  // Audited
  auditReport?: string      // URL к отчету
}

// GET /api/verification/:projectId/status
interface VerificationStatus {
  level: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
}
```

#### Analytics API

```typescript
// GET /api/analytics/platform
interface PlatformAnalytics {
  totalProjects: number
  totalRaised: string
  totalParticipants: number
  activeStakers: number
  totalStaked: string
  launchSuccessRate: number

  // По времени
  projectsByMonth: { month: string; count: number }[]
  raisedByMonth: { month: string; amount: string }[]
}

// GET /api/analytics/project/:id
interface ProjectAnalytics {
  priceHistory: { time: string; price: string }[]
  participantsGrowth: { time: string; count: number }[]
  raisedGrowth: { time: string; amount: string }[]
  holderDistribution: { range: string; count: number }[]
}
```

### Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model Project {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Основное
  name            String
  symbol          String
  description     String   @db.Text
  logo            String?

  // Тип
  type            LaunchType
  status          LaunchStatus @default(UPCOMING)
  verification    VerificationLevel @default(UNVERIFIED)

  // Создатель
  creatorAddress  String
  creatorDeposit  String?

  // Контракты
  tokenAddress    String?
  launchContract  String?
  lpAddress       String?

  // Метрики (кэш)
  raised          String   @default("0")
  participants    Int      @default(0)
  trustScore      Int      @default(50)

  // Тайминг
  startTime       DateTime
  endTime         DateTime

  // Конфигурация
  config          Json

  // AI контент
  aiContent       Json?

  // Ссылки
  website         String?
  twitter         String?
  telegram        String?
  discord         String?
  whitepaper      String?

  // Связи
  participations  Participation[]
  verification    Verification?
  votes           ProjectVote[]
  analytics       ProjectAnalytics[]

  @@index([status])
  @@index([creatorAddress])
  @@index([type])
}

enum LaunchType {
  FAIR_LAUNCH
  PRESALE
}

enum LaunchStatus {
  DRAFT
  UPCOMING
  ACTIVE
  COMPLETED
  FAILED
  CANCELLED
}

enum VerificationLevel {
  UNVERIFIED
  BASIC
  PREMIUM
  AUDITED
}

model Participation {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())

  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])

  address         String
  amount          String
  round           String?  // Для presale
  tokens          String
  claimed         String   @default("0")
  txHash          String

  @@unique([projectId, address, round])
  @@index([address])
}

model Verification {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  projectId       String   @unique
  project         Project  @relation(fields: [projectId], references: [id])

  level           VerificationLevel
  status          VerificationStatus @default(PENDING)

  // Данные
  email           String?
  socialLinks     Json?
  kycData         Json?    // Зашифрованные KYC данные
  auditReport     String?

  // Результат
  reviewedBy      String?
  reviewedAt      DateTime?
  rejectionReason String?

  @@index([status])
}

enum VerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

model StakingPosition {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  address         String   @unique
  amount          String
  tier            StakingTier
  stakedAt        DateTime
  lastClaim       DateTime?
  totalRewards    String   @default("0")

  @@index([tier])
}

enum StakingTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}

model ProjectVote {
  id              String   @id @default(cuid())
  createdAt       DateTime @default(now())

  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])

  voterAddress    String
  voteType        VoteType
  vote            Boolean  // true = за, false = против
  power           String   // Voting power на момент голосования

  @@unique([projectId, voterAddress, voteType])
}

enum VoteType {
  FEATURE
  DELIST
  WARNING
}

model ProjectAnalytics {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())

  projectId       String
  project         Project  @relation(fields: [projectId], references: [id])

  price           String?
  raised          String
  participants    Int
  holders         Int?
  volume24h       String?

  @@index([projectId, timestamp])
}
```

### Indexer Service

Сервис для индексации событий блокчейна:

```typescript
// src/services/indexer.ts

import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import { prisma } from '@/lib/prisma'

interface BlockEvent {
  type: string
  attributes: { key: string; value: string }[]
}

export class BlockchainIndexer {
  private client: CosmWasmClient
  private lastProcessedBlock: number = 0

  async start() {
    this.client = await CosmWasmClient.connect(RPC_ENDPOINT)

    // Восстановление с последнего обработанного блока
    const state = await prisma.indexerState.findFirst()
    this.lastProcessedBlock = state?.lastBlock ?? 0

    // Запуск polling
    this.poll()
  }

  private async poll() {
    while (true) {
      try {
        const currentHeight = await this.client.getHeight()

        for (let height = this.lastProcessedBlock + 1; height <= currentHeight; height++) {
          await this.processBlock(height)
          this.lastProcessedBlock = height
        }

        // Сохранение состояния
        await prisma.indexerState.upsert({
          where: { id: 'main' },
          update: { lastBlock: this.lastProcessedBlock },
          create: { id: 'main', lastBlock: this.lastProcessedBlock }
        })

        await sleep(1000) // 1 секунда между проверками
      } catch (error) {
        console.error('Indexer error:', error)
        await sleep(5000)
      }
    }
  }

  private async processBlock(height: number) {
    const block = await this.client.getBlock(height)
    const txs = await this.client.searchTx({ height })

    for (const tx of txs) {
      await this.processTx(tx)
    }
  }

  private async processTx(tx: IndexedTx) {
    const events = this.parseEvents(tx.events)

    // Обработка событий Fair Launch
    if (events.has('wasm-fair_launch_buy')) {
      await this.handleFairLaunchBuy(events.get('wasm-fair_launch_buy')!)
    }

    // Обработка событий Presale
    if (events.has('wasm-presale_participate')) {
      await this.handlePresaleParticipation(events.get('wasm-presale_participate')!)
    }

    // Обработка стейкинга
    if (events.has('wasm-stake')) {
      await this.handleStake(events.get('wasm-stake')!)
    }

    // И т.д.
  }

  private async handleFairLaunchBuy(event: BlockEvent) {
    const projectId = event.attributes.find(a => a.key === 'project_id')?.value
    const buyer = event.attributes.find(a => a.key === 'buyer')?.value
    const amount = event.attributes.find(a => a.key === 'amount')?.value
    const tokens = event.attributes.find(a => a.key === 'tokens')?.value
    const txHash = event.attributes.find(a => a.key === 'tx_hash')?.value

    if (!projectId || !buyer || !amount || !tokens) return

    await prisma.participation.upsert({
      where: {
        projectId_address_round: {
          projectId,
          address: buyer,
          round: null
        }
      },
      update: {
        amount: { increment: BigInt(amount) }.toString(),
        tokens: { increment: BigInt(tokens) }.toString()
      },
      create: {
        projectId,
        address: buyer,
        amount,
        tokens,
        txHash: txHash || ''
      }
    })

    // Обновление метрик проекта
    await prisma.project.update({
      where: { id: projectId },
      data: {
        raised: { increment: BigInt(amount) }.toString(),
        participants: { increment: 1 }
      }
    })
  }
}
```

---

## Frontend интеграция

### Axiome Connect SDK

```typescript
// src/lib/axiome/connect.ts

import { AxiomeConnectType, TransactionPayload } from './types'

/**
 * Создание ссылки для подписи транзакции через Axiome Wallet
 */
export function buildAxiomeSignLink(payload: TransactionPayload): string {
  const jsonPayload = JSON.stringify(payload)
  const base64Payload = Buffer.from(jsonPayload).toString('base64')
  return `axiomesign://${base64Payload}`
}

/**
 * Payload для отправки AXM
 */
export function buildBankSendPayload(
  from: string,
  to: string,
  amount: string,
  denom: string = 'uaxm'
): TransactionPayload {
  return {
    type: 'bank_send' as AxiomeConnectType,
    value: {
      from_address: from,
      to_address: to,
      amount: [{ denom, amount }]
    }
  }
}

/**
 * Payload для CW20 transfer
 */
export function buildCW20TransferPayload(
  sender: string,
  contract: string,
  recipient: string,
  amount: string
): TransactionPayload {
  return {
    type: 'cosmwasm_execute' as AxiomeConnectType,
    value: {
      sender,
      contract,
      msg: {
        transfer: {
          recipient,
          amount
        }
      },
      funds: []
    }
  }
}

/**
 * Payload для создания CW20 токена
 */
export function buildCW20InstantiatePayload(
  sender: string,
  codeId: number,
  name: string,
  symbol: string,
  decimals: number,
  initialSupply: string,
  mintEnabled: boolean
): TransactionPayload {
  const msg: CW20InstantiateMsg = {
    name,
    symbol,
    decimals,
    initial_balances: [
      {
        address: sender,
        amount: initialSupply
      }
    ]
  }

  if (mintEnabled) {
    msg.mint = {
      minter: sender
    }
  }

  return {
    type: 'cosmwasm_instantiate' as AxiomeConnectType,
    value: {
      sender,
      code_id: codeId,
      label: `${symbol} Token`,
      msg,
      funds: []
    }
  }
}

/**
 * Payload для участия в Fair Launch
 */
export function buildFairLaunchBuyPayload(
  sender: string,
  launchContract: string,
  amount: string
): TransactionPayload {
  return {
    type: 'cosmwasm_execute' as AxiomeConnectType,
    value: {
      sender,
      contract: launchContract,
      msg: {
        buy: {}
      },
      funds: [
        { denom: 'uaxm', amount }
      ]
    }
  }
}

/**
 * Payload для стейкинга LAUNCH
 */
export function buildStakePayload(
  sender: string,
  launchToken: string,
  amount: string
): TransactionPayload {
  return {
    type: 'cosmwasm_execute' as AxiomeConnectType,
    value: {
      sender,
      contract: launchToken,
      msg: {
        stake: {
          amount
        }
      },
      funds: []
    }
  }
}
```

### React Hooks

```typescript
// src/hooks/useLaunchpad.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useWallet } from '@/hooks/useWallet'

export function useProjects(filters: ProjectFilters) {
  return useQuery({
    queryKey: ['projects', filters],
    queryFn: () => fetchProjects(filters),
    staleTime: 30_000, // 30 секунд
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
    staleTime: 10_000,
  })
}

export function useLaunchStatus(projectId: string) {
  return useQuery({
    queryKey: ['launchStatus', projectId],
    queryFn: () => fetchLaunchStatus(projectId),
    refetchInterval: 5_000, // Обновление каждые 5 секунд
  })
}

export function useParticipate() {
  const queryClient = useQueryClient()
  const { address } = useWallet()

  return useMutation({
    mutationFn: async ({ projectId, amount }: ParticipateParams) => {
      const response = await fetch('/api/launch/participate', {
        method: 'POST',
        body: JSON.stringify({ projectId, amount })
      })
      return response.json()
    },
    onSuccess: (data, { projectId }) => {
      // Инвалидация кэша
      queryClient.invalidateQueries({ queryKey: ['launchStatus', projectId] })
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    }
  })
}

export function useStakingInfo() {
  const { address } = useWallet()

  return useQuery({
    queryKey: ['staking', address],
    queryFn: () => fetchStakingInfo(address!),
    enabled: !!address,
    staleTime: 60_000,
  })
}
```

### Компоненты

```typescript
// src/components/launchpad/ProjectCard.tsx

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const t = useTranslations('launchpad')
  const progress = (BigInt(project.raised) * 100n) / BigInt(project.hardCap)

  return (
    <motion.div
      className="bg-card rounded-2xl border border-border p-6"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <Image
          src={project.logo || '/placeholder-token.png'}
          alt={project.name}
          width={48}
          height={48}
          className="rounded-full"
        />
        <div>
          <h3 className="font-semibold">{project.name}</h3>
          <span className="text-muted-foreground">${project.symbol}</span>
        </div>
        <VerificationBadge level={project.verification} />
      </div>

      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
        {project.description}
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>{t('raised')}</span>
          <span>{formatAXM(project.raised)} / {formatAXM(project.hardCap)}</span>
        </div>
        <Progress value={Number(progress)} />
      </div>

      <div className="flex justify-between items-center">
        <StatusBadge status={project.status} />
        <TrustScore score={project.trustScore} />
      </div>

      <Link href={`/launchpad/${project.id}`}>
        <Button className="w-full mt-4">
          {project.status === 'ACTIVE' ? t('participate') : t('viewDetails')}
        </Button>
      </Link>
    </motion.div>
  )
}
```

---

## Безопасность

### Аудит контрактов

Перед mainnet деплоем необходим аудит:

1. **Внутренний review**
   - Code review командой
   - Unit тесты с >90% покрытием
   - Integration тесты
   - Fuzzing тесты

2. **Внешний аудит**
   - Партнерство с аудиторскими компаниями
   - Публикация отчетов

### Защита API

```typescript
// src/middleware/security.ts

import { rateLimit } from 'express-rate-limit'
import { validateAddress } from '@/lib/axiome'

// Rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100,
  message: 'Too many requests'
})

// Stricter limit для транзакций
export const txLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  max: 10,
  message: 'Transaction rate limit exceeded'
})

// Валидация адресов
export function validateAxiomeAddress(address: string): boolean {
  if (!address.startsWith('axm1')) return false
  if (address.length !== 43) return false
  return validateAddress(address)
}

// Проверка подписи сообщения
export async function verifySignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  // Верификация подписи Axiome wallet
  // ...
}
```

### Защита данных

```typescript
// src/lib/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'

export function encryptKYCData(data: object): EncryptedData {
  const key = Buffer.from(process.env.KYC_ENCRYPTION_KEY!, 'hex')
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return {
    iv: iv.toString('hex'),
    data: encrypted,
    tag: cipher.getAuthTag().toString('hex')
  }
}

export function decryptKYCData(encrypted: EncryptedData): object {
  const key = Buffer.from(process.env.KYC_ENCRYPTION_KEY!, 'hex')
  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(encrypted.iv, 'hex')
  )
  decipher.setAuthTag(Buffer.from(encrypted.tag, 'hex'))

  let decrypted = decipher.update(encrypted.data, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return JSON.parse(decrypted)
}
```

---

## Деплой и инфраструктура

### Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/launchpad
      - REDIS_URL=redis://redis:6379
      - AXIOME_RPC=http://49.13.3.227:26657
      - AXIOME_REST=http://49.13.3.227:1317
    depends_on:
      - db
      - redis
    restart: unless-stopped

  indexer:
    build:
      context: .
      dockerfile: Dockerfile.indexer
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/launchpad
      - AXIOME_RPC=http://49.13.3.227:26657
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:17
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=launchpad
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes (Production)

```yaml
# k8s/deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: launchpad-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: launchpad
  template:
    metadata:
      labels:
        app: launchpad
    spec:
      containers:
        - name: app
          image: axiome/launchpad:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: launchpad-secrets
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: launchpad-service
spec:
  selector:
    app: launchpad
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: launchpad-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
    - hosts:
        - suite.axiome.pro
      secretName: launchpad-tls
  rules:
    - host: suite.axiome.pro
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: launchpad-service
                port:
                  number: 80
```

### Мониторинг

```typescript
// src/lib/monitoring.ts

import * as Sentry from '@sentry/nextjs'
import { metrics } from '@opentelemetry/api'

// Sentry для error tracking
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

// Метрики
const meter = metrics.getMeter('launchpad')

export const counters = {
  projectsCreated: meter.createCounter('projects_created'),
  participations: meter.createCounter('participations'),
  tokensCreated: meter.createCounter('tokens_created'),
  stakeEvents: meter.createCounter('stake_events'),
}

export const gauges = {
  activeProjects: meter.createObservableGauge('active_projects'),
  totalStaked: meter.createObservableGauge('total_staked'),
  platformTVL: meter.createObservableGauge('platform_tvl'),
}

// Health check endpoint
export async function healthCheck(): Promise<HealthStatus> {
  const checks = await Promise.all([
    checkDatabase(),
    checkBlockchain(),
    checkRedis(),
  ])

  return {
    status: checks.every(c => c.ok) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }
}
```

---

## Заключение

Техническая реализация Axiome Launch Suite включает:

1. **5 смарт-контрактов** на CosmWasm
2. **RESTful API** на Next.js
3. **Indexer сервис** для синхронизации с блокчейном
4. **React компоненты** с real-time обновлениями
5. **Безопасность** на всех уровнях
6. **Масштабируемая инфраструктура** на Kubernetes

Все компоненты спроектированы с учетом:
- Безопасности (аудит, шифрование, rate limiting)
- Производительности (кэширование, индексация)
- Масштабируемости (микросервисы, горизонтальное масштабирование)
- Удобства разработки (TypeScript, Prisma, React Query)
