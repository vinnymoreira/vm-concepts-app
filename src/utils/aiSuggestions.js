/**
 * AI-powered content suggestions using Supabase Edge Function
 */

import { supabase } from '../supabaseClient';

/**
 * Generate content suggestions based on existing note content
 * @param {string} existingContent - The current content of the note
 * @param {string} categoryName - The category name for context
 * @param {string} suggestionType - Type of suggestion (continue, expand, rewrite, etc.)
 * @returns {Promise<string>} - The AI-generated suggestion
 */
export async function generateContentSuggestion(existingContent, categoryName = null, suggestionType = 'continue') {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('You must be logged in to use AI suggestions');
    }

    // Get the Supabase URL from the client
    const supabaseUrl = supabase.supabaseUrl;
    const functionUrl = `${supabaseUrl}/functions/v1/generate-ai-suggestion`;

    // Make a direct fetch call to get better error details
    const rawResponse = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': supabase.supabaseKey,
      },
      body: JSON.stringify({
        existingContent,
        categoryName,
        suggestionType,
      }),
    });

    const responseText = await rawResponse.text();
    console.log('Raw response status:', rawResponse.status);
    console.log('Raw response text:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Failed to parse response: ${responseText}`);
    }

    if (!rawResponse.ok) {
      console.error('Function returned error:', data);
      throw new Error(data.error || `Function error: ${rawResponse.status}`);
    }

    if (!data || !data.suggestion) {
      console.error('Unexpected response data:', data);
      throw new Error('No suggestion returned from AI');
    }

    return data.suggestion;
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    throw error;
  }
}

/**
 * Generate suggestions specifically for lyrics/music
 * @param {string} existingLyrics - The current lyrics
 * @param {object} options - Additional options like theme, mood, style
 * @returns {Promise<string>} - The AI-generated lyrics suggestion
 */
export async function generateLyricsSuggestion(existingLyrics, options = {}) {
  // For now, use the same edge function with category context
  // You could create a separate edge function if you need more specialized lyrics handling
  return generateContentSuggestion(existingLyrics, 'Music/Lyrics', 'continue');
}
