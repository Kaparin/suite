/**
 * Platform Payment Service
 *
 * Handles LAUNCH token payments for:
 * - PRO subscription (monthly)
 * - Project verification
 * - Project promotion
 *
 * Payment flow:
 * 1. Create payment request → returns payment ID + transfer payload
 * 2. User signs CW20 transfer via Axiome Connect
 * 3. User submits txHash → backend verifies on-chain
 * 4. Payment confirmed → update user plan or project status
 */

import { prisma } from '@/lib/prisma'
import { LAUNCH_CONTRACT, LAUNCH_DECIMALS, toMicroAmount } from '@/lib/lock/constants'
import { axiomeClient } from '@/lib/axiome/client'
import { buildCW20TransferPayload } from '@/lib/wallet/transaction-builder'
import type { PaymentType, PaymentStatus } from '@prisma/client'

const PLATFORM_TREASURY = process.env.PLATFORM_TREASURY_ADDRESS || ''

// Payment prices in LAUNCH
export const PAYMENT_PRICES: Record<PaymentType, number> = {
  PRO_SUBSCRIPTION: 500,       // 500 LAUNCH / month
  PROJECT_VERIFICATION: 200,   // 200 LAUNCH one-time
  PROJECT_PROMOTION: 100,      // 100 LAUNCH / week
}

// Subscription duration in days
const SUBSCRIPTION_DURATIONS: Partial<Record<PaymentType, number>> = {
  PRO_SUBSCRIPTION: 30,
  PROJECT_PROMOTION: 7,
}

/**
 * Create a new payment request.
 * Returns payment record + Axiome Connect transfer payload for signing.
 */
export async function createPaymentRequest(
  userId: string,
  type: PaymentType,
  walletAddress: string,
  projectId?: string,
) {
  const price = PAYMENT_PRICES[type]
  const microAmount = toMicroAmount(price).toString()

  // For project-specific payments, verify project ownership
  if ((type === 'PROJECT_VERIFICATION' || type === 'PROJECT_PROMOTION') && projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    })
    if (!project || project.ownerId !== userId) {
      throw new Error('Not authorized for this project')
    }
  }

  // Calculate expiration for subscriptions
  const durationDays = SUBSCRIPTION_DURATIONS[type]
  const expiresAt = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : null

  // Create payment record
  const payment = await prisma.platformPayment.create({
    data: {
      userId,
      type,
      amount: microAmount,
      status: 'PENDING',
      expiresAt,
      projectId: projectId || null,
    },
  })

  // Build CW20 transfer payload for Axiome Connect
  const transferPayload = buildCW20TransferPayload({
    contractAddress: LAUNCH_CONTRACT,
    sender: walletAddress,
    recipient: PLATFORM_TREASURY,
    amount: microAmount,
    memo: `payment:${payment.id}`,
  })

  return {
    payment,
    transferPayload,
    price,
    treasury: PLATFORM_TREASURY,
  }
}

/**
 * Verify a payment by checking the on-chain transaction.
 */
export async function verifyPayment(paymentId: string, txHash: string) {
  const payment = await prisma.platformPayment.findUnique({
    where: { id: paymentId },
  })

  if (!payment) throw new Error('Payment not found')
  if (payment.status === 'CONFIRMED') return payment

  // TODO: In production, verify the txHash on-chain by querying the transaction
  // and checking: sender, recipient (treasury), amount, contract (LAUNCH)
  // For now, we trust the txHash submission and mark as confirmed

  // Update payment
  const confirmed = await prisma.platformPayment.update({
    where: { id: paymentId },
    data: {
      txHash,
      status: 'CONFIRMED',
    },
  })

  // Apply payment effects
  await applyPaymentEffects(confirmed)

  return confirmed
}

/**
 * Apply effects of a confirmed payment.
 */
async function applyPaymentEffects(payment: {
  id: string
  userId: string
  type: PaymentType
  projectId: string | null
  expiresAt: Date | null
}) {
  switch (payment.type) {
    case 'PRO_SUBSCRIPTION':
      await prisma.user.update({
        where: { id: payment.userId },
        data: { plan: 'PRO' },
      })
      break

    case 'PROJECT_VERIFICATION':
      if (payment.projectId) {
        await prisma.project.update({
          where: { id: payment.projectId },
          data: { isVerified: true },
        })
      }
      break

    case 'PROJECT_PROMOTION':
      if (payment.projectId) {
        await prisma.project.update({
          where: { id: payment.projectId },
          data: { isFeatured: true },
        })
      }
      break
  }
}

/**
 * Get user's payment history.
 */
export async function getUserPayments(userId: string) {
  return prisma.platformPayment.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

/**
 * Check if user has an active PRO subscription.
 */
export async function hasActiveProSubscription(userId: string): Promise<boolean> {
  const activeSub = await prisma.platformPayment.findFirst({
    where: {
      userId,
      type: 'PRO_SUBSCRIPTION',
      status: 'CONFIRMED',
      expiresAt: { gt: new Date() },
    },
  })
  return !!activeSub
}

/**
 * Get user's effective plan (checks both user.plan and active subscriptions).
 */
export async function getUserEffectivePlan(userId: string): Promise<'FREE' | 'PRO'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  })

  if (user?.plan === 'PRO') return 'PRO'

  // Check for active subscription
  const hasSub = await hasActiveProSubscription(userId)
  return hasSub ? 'PRO' : 'FREE'
}

/**
 * Expire old pending payments and lapsed PRO subscriptions.
 * Called from cron.
 */
export async function processExpiredPayments(): Promise<number> {
  // Expire pending payments older than 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const expiredPending = await prisma.platformPayment.updateMany({
    where: {
      status: 'PENDING',
      createdAt: { lt: oneHourAgo },
    },
    data: { status: 'EXPIRED' },
  })

  // Downgrade users whose PRO subscription expired
  const expiredSubs = await prisma.platformPayment.findMany({
    where: {
      type: 'PRO_SUBSCRIPTION',
      status: 'CONFIRMED',
      expiresAt: { lt: new Date() },
    },
    select: { userId: true },
    distinct: ['userId'],
  })

  for (const { userId } of expiredSubs) {
    // Check if user has any other active PRO sub
    const activeSub = await prisma.platformPayment.findFirst({
      where: {
        userId,
        type: 'PRO_SUBSCRIPTION',
        status: 'CONFIRMED',
        expiresAt: { gt: new Date() },
      },
    })
    if (!activeSub) {
      await prisma.user.update({
        where: { id: userId },
        data: { plan: 'FREE' },
      })
    }
  }

  // Remove featured status from expired promotions
  const expiredPromos = await prisma.platformPayment.findMany({
    where: {
      type: 'PROJECT_PROMOTION',
      status: 'CONFIRMED',
      expiresAt: { lt: new Date() },
      projectId: { not: null },
    },
    select: { projectId: true },
  })

  for (const { projectId } of expiredPromos) {
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { isFeatured: false },
      })
    }
  }

  return expiredPending.count
}
