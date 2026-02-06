import 'server-only'

export {
  VERIFICATION_ADDRESS,
  VERIFICATION_AMOUNT,
  VERIFICATION_AMOUNT_DISPLAY,
  generateVerificationCode,
  createVerificationChallengeAsync,
  getPendingVerificationAsync,
  deleteVerification,
  verifyTransactionAsync,
  createChallengeToken,
  verifyChallengeToken,
  cleanupExpiredVerificationsInDB
} from './verification'

export {
  validateTelegramAuth,
  parseTelegramAuthData,
  createSessionTokenV2,
  verifySessionTokenV2,
  type TelegramAuthData
} from './telegram'
