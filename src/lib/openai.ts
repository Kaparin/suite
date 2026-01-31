import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const MODELS = {
  free: process.env.OPENAI_MODEL_FREE || 'gpt-4o-mini',
  premium: process.env.OPENAI_MODEL_PREMIUM || 'gpt-4o',
}

export function getModelForPlan(plan: 'FREE' | 'PRO'): string {
  return plan === 'PRO' ? MODELS.premium : MODELS.free
}
