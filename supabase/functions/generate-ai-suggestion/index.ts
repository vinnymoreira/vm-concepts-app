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
    let systemPrompt = 'You are a creative writing assistant helping users write and develop their ideas.'
    let userPrompt = ''

    if (
      categoryName?.toLowerCase().includes('music') ||
      categoryName?.toLowerCase().includes('lyrics') ||
      categoryName?.toLowerCase().includes('song')
    ) {
      systemPrompt =
        'You are a creative songwriting assistant. Help users write compelling lyrics and develop their musical ideas.'
    }

    switch (suggestionType) {
      case 'continue':
        userPrompt = `Here's what I've written so far:\n\n${existingContent}\n\nPlease continue this naturally with 2-3 more lines or a paragraph that flows well with the existing content.`
        break
      case 'expand':
        userPrompt = `Here's my content:\n\n${existingContent}\n\nPlease expand on these ideas with more detail, examples, or elaboration.`
        break
      case 'rewrite':
        userPrompt = `Here's my content:\n\n${existingContent}\n\nPlease rewrite this in a different way while maintaining the core message and intent.`
        break
      case 'brainstorm':
        userPrompt = `Based on this content:\n\n${existingContent}\n\nPlease provide 3-5 creative ideas or directions I could explore next.`
        break
      default:
        userPrompt = `Here's what I've written:\n\n${existingContent}\n\nPlease suggest how to continue or improve this.`
    }

    // Call Anthropic API
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',
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
      const errorData = await anthropicResponse.json()
      console.error('Anthropic API error:', errorData)
      throw new Error(errorData.error?.message || JSON.stringify(errorData))
    }

    const data = await anthropicResponse.json()
    const suggestion = data.content[0].text

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
