import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Basic auth check - Supabase Edge Functions automatically validate JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      throw new Error('Missing authorization header')
    }

    console.log('Request authenticated via Supabase')

    // Check if API key is configured
    if (!ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }

    // Parse request body
    const { existingContent, categoryName, suggestionType } = await req.json()

    // Build the prompt based on suggestion type and category
    let systemPrompt = 'You are a creative writing assistant. CRITICAL: Your response must contain ONLY the suggested content itself. Do NOT include ANY preamble, explanation, meta-commentary, or phrases like "Here\'s...", "Here is...", "This...", etc. Start your response directly with the actual content.'
    let userPrompt = ''

    if (
      categoryName?.toLowerCase().includes('music') ||
      categoryName?.toLowerCase().includes('lyrics') ||
      categoryName?.toLowerCase().includes('song')
    ) {
      systemPrompt =
        'You are a creative songwriting assistant. CRITICAL: Your response must contain ONLY the lyrics or content itself. Do NOT include ANY preamble, explanation, or meta-commentary. Start your response directly with the actual lyrics or content.'
    }

    switch (suggestionType) {
      case 'continue':
        userPrompt = `Continue this text naturally:\n\n${existingContent}\n\nIMPORTANT: Start your response directly with the continuation. Do not write "Here's a continuation" or any similar phrase.`
        break
      case 'expand':
        userPrompt = `Expand on this content with more detail:\n\n${existingContent}\n\nIMPORTANT: Start your response directly with the expanded content. Do not write any introductory phrases.`
        break
      case 'rewrite':
        userPrompt = `Rewrite this in a different way:\n\n${existingContent}\n\nIMPORTANT: Start your response directly with the rewritten content. Do not write any introductory phrases.`
        break
      case 'brainstorm':
        userPrompt = `Provide 3-5 creative ideas based on:\n\n${existingContent}\n\nIMPORTANT: Start your response directly with the ideas. Do not write any introductory phrases.`
        break
      default:
        userPrompt = `Suggest how to continue or improve:\n\n${existingContent}\n\nIMPORTANT: Start your response directly with the suggested content. Do not write any introductory phrases.`
    }

    // Call Anthropic API
    const requestBody = {
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }

    console.log('Calling Anthropic API with model:', requestBody.model)

    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error response:', errorText)
      console.error('Response status:', anthropicResponse.status)

      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        throw new Error(`Anthropic API error (${anthropicResponse.status}): ${errorText}`)
      }

      throw new Error(errorData.error?.message || errorData.message || JSON.stringify(errorData))
    }

    const data = await anthropicResponse.json()
    let suggestion = data.content[0].text

    // Strip common preamble patterns and explanatory text
    // Remove lines that start with explanatory phrases
    const preamblePatterns = [
      /^Here'?s?\s+.*?:?\s*\n*/im,
      /^This\s+.*?:?\s*\n*/im,
      /^I'?v?e?\s+.*?:?\s*\n*/im,
      /^The\s+.*?:?\s*\n*/im,
      /^Let me\s+.*?:?\s*\n*/im,
      /^I can\s+.*?:?\s*\n*/im,
      /^Sure,?\s+.*?:?\s*\n*/im,
      /^Of course,?\s+.*?:?\s*\n*/im,
    ]

    for (const pattern of preamblePatterns) {
      suggestion = suggestion.replace(pattern, '')
    }

    // Remove trailing explanatory paragraphs (often start with line breaks and explanatory words)
    // Split into paragraphs and filter out likely meta-commentary
    const paragraphs = suggestion.split(/\n\n+/)
    const filteredParagraphs = paragraphs.filter((p, idx) => {
      const trimmed = p.trim().toLowerCase()
      // Keep first paragraphs, but check last few for meta-commentary
      if (idx < paragraphs.length - 2) return true

      // Remove paragraphs that explain what was done
      const metaPatterns = [
        /^(this|these|the above|i'?v?e?)\s+(continuation|suggestion|expansion|rewrite|text|content|lyrics)/i,
        /^(note|keep in mind|remember|as you can see)/i,
        /^(feel free|you can|you may want)/i,
      ]

      return !metaPatterns.some(pattern => pattern.test(trimmed))
    })

    suggestion = filteredParagraphs.join('\n').trim()

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in generate-ai-suggestion:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorDetails = {
      error: errorMessage,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : undefined
    }

    return new Response(JSON.stringify(errorDetails), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
