import { NextRequest, NextResponse } from 'next/server'
import { openai, MODELS } from '@/lib/openai'
import { verifySessionTokenV2 } from '@/lib/auth/telegram'

type FieldType = 'descriptionShort' | 'descriptionLong'

const FIELD_PROMPTS: Record<FieldType, { system: string; maxLength?: number }> = {
  descriptionShort: {
    system: `You are an expert crypto copywriter. Generate a compelling, concise one-sentence description for a token.
The description should:
- Be catchy and memorable
- Explain the token's purpose clearly
- Be under 160 characters
- Not include the token name at the start (user already sees the name)
Respond with ONLY the description text, no quotes or extra formatting.`,
    maxLength: 160
  },
  descriptionLong: {
    system: `You are an expert crypto copywriter. Generate a comprehensive description for a token project.
The description should:
- Be 2-3 paragraphs
- Explain what the token does and its utility
- Describe the vision and goals
- Be engaging and professional
- Not repeat the token name excessively
Respond with ONLY the description text, no quotes or extra formatting.`
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifySessionTokenV2(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { field, context } = body as {
      field: FieldType
      context: {
        name: string
        ticker: string
        currentDescription?: string
        links?: Record<string, string>
      }
    }

    if (!field || !FIELD_PROMPTS[field]) {
      return NextResponse.json(
        { error: 'Invalid field type' },
        { status: 400 }
      )
    }

    if (!context?.name || !context?.ticker) {
      return NextResponse.json(
        { error: 'Token name and ticker are required' },
        { status: 400 }
      )
    }

    const fieldConfig = FIELD_PROMPTS[field]

    const userPrompt = `Generate a ${field === 'descriptionShort' ? 'short' : 'full'} description for:
Token Name: ${context.name}
Symbol: $${context.ticker}
${context.currentDescription ? `Current description (improve upon this): ${context.currentDescription}` : ''}
${context.links?.website ? `Website: ${context.links.website}` : ''}
${context.links?.telegram ? `Telegram: ${context.links.telegram}` : ''}`

    const completion = await openai.chat.completions.create({
      model: MODELS.free,
      messages: [
        { role: 'system', content: fieldConfig.system },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: field === 'descriptionShort' ? 100 : 500,
    })

    let content = completion.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('No response from AI')
    }

    // Remove quotes if present
    if (content.startsWith('"') && content.endsWith('"')) {
      content = content.slice(1, -1)
    }

    // Enforce max length for short description
    if (fieldConfig.maxLength && content.length > fieldConfig.maxLength) {
      content = content.substring(0, fieldConfig.maxLength - 3) + '...'
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('AI field generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
