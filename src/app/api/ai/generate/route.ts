import { NextRequest, NextResponse } from 'next/server'
import { openai, MODELS } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectName, idea, audience, utilities, tone, language } = body

    if (!projectName || !idea) {
      return NextResponse.json(
        { error: 'Project name and idea are required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert crypto token advisor and copywriter. Your task is to help create comprehensive token launch materials.
You must respond in ${language === 'ru' ? 'Russian' : 'English'}.
The tone should be ${tone === 'fun' ? 'fun, playful, meme-style with emojis' : 'professional and serious'}.

Generate a complete token package including:
1. Description (short and long versions)
2. Tokenomics (supply, distribution, vesting)
3. 7-day launch plan
4. FAQ (5 questions)
5. Promotional texts for Telegram and Twitter

Respond in JSON format only.`

    const userPrompt = `Create a token package for:
Project Name: ${projectName}
Idea: ${idea}
Target Audience: ${audience || 'General crypto users'}
Utilities: ${utilities || 'None specified'}

Return JSON with this exact structure:
{
  "description": {
    "short": "One sentence description",
    "long": "Full description, 2-3 paragraphs"
  },
  "tokenomics": {
    "supply": "e.g., 1,000,000,000",
    "distribution": {
      "team": 10,
      "marketing": 15,
      "liquidity": 40,
      "community": 35
    },
    "vesting": "Description of vesting schedule"
  },
  "launchPlan": [
    "Day 1: ...",
    "Day 2: ...",
    "Day 3: ...",
    "Day 4: ...",
    "Day 5: ...",
    "Day 6: ...",
    "Day 7: ..."
  ],
  "faq": [
    { "question": "...", "answer": "..." }
  ],
  "promoTexts": {
    "telegram": "Post for Telegram channel",
    "twitter": "Tweet (max 280 chars)"
  }
}`

    const completion = await openai.chat.completions.create({
      model: MODELS.free,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const result = JSON.parse(content)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('AI generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
