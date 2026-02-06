/**
 * Environment variable validation
 *
 * Validates required environment variables at startup.
 * Import this module early in the application lifecycle.
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
] as const

const productionRequiredEnvVars = [
  'TELEGRAM_BOT_TOKEN',
  'VERIFICATION_WALLET_ADDRESS',
] as const

const warningEnvVars = [
  'AXIOME_REST_URL',
  'OPENAI_API_KEY',
] as const

export function validateEnv(): void {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required vars
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // Check JWT_SECRET is not the default
  if (process.env.JWT_SECRET === 'axiome-launch-suite-secret-key-change-in-production') {
    console.error('[ENV] CRITICAL: Using default JWT_SECRET. Change this in production!')
    if (process.env.NODE_ENV === 'production') {
      missing.push('JWT_SECRET (using insecure default)')
    }
  }

  // Production-only required vars
  if (process.env.NODE_ENV === 'production') {
    for (const key of productionRequiredEnvVars) {
      if (!process.env[key]) {
        missing.push(key)
      }
    }
  }

  // Warning vars (not fatal)
  for (const key of warningEnvVars) {
    if (!process.env[key]) {
      warnings.push(key)
    }
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn(`[ENV] Missing optional environment variables: ${warnings.join(', ')}`)
  }

  // Fail on missing required vars
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`
    console.error(`[ENV] FATAL: ${error}`)
    if (process.env.NODE_ENV === 'production') {
      throw new Error(error)
    }
  }
}

// Export validated env vars with defaults
export const env = {
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || 'axiome-launch-suite-secret-key-change-in-production',
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  AXIOME_REST_URL: process.env.AXIOME_REST_URL || 'https://axiome-api.quantnode.tech',
  VERIFICATION_WALLET_ADDRESS: process.env.VERIFICATION_WALLET_ADDRESS || 'axm1weskc3hd8d5u0d5s0wprys0sqljqkcak6twd24',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

// Run validation on module load
validateEnv()
