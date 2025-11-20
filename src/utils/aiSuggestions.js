/**
 * AI-powered content suggestions using Claude API
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Generate content suggestions based on existing note content
 * @param {string} existingContent - The current content of the note
 * @param {string} categoryName - The category name for context
 * @param {string} suggestionType - Type of suggestion (continue, expand, rewrite, etc.)
 * @returns {Promise<string>} - The AI-generated suggestion
 */
export async function generateContentSuggestion(existingContent, categoryName = null, suggestionType = 'continue') {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }

  // Build the prompt based on suggestion type and category
  let systemPrompt = 'You are a creative writing assistant helping users write and develop their ideas.';
  let userPrompt = '';

  if (categoryName?.toLowerCase().includes('music') || categoryName?.toLowerCase().includes('lyrics') || categoryName?.toLowerCase().includes('song')) {
    systemPrompt = 'You are a creative songwriting assistant. Help users write compelling lyrics and develop their musical ideas.';
  }

  switch (suggestionType) {
    case 'continue':
      userPrompt = `Here's what I've written so far:\n\n${existingContent}\n\nPlease continue this naturally with 2-3 more lines or a paragraph that flows well with the existing content.`;
      break;
    case 'expand':
      userPrompt = `Here's my content:\n\n${existingContent}\n\nPlease expand on these ideas with more detail, examples, or elaboration.`;
      break;
    case 'rewrite':
      userPrompt = `Here's my content:\n\n${existingContent}\n\nPlease rewrite this in a different way while maintaining the core message and intent.`;
      break;
    case 'brainstorm':
      userPrompt = `Based on this content:\n\n${existingContent}\n\nPlease provide 3-5 creative ideas or directions I could explore next.`;
      break;
    default:
      userPrompt = `Here's what I've written:\n\n${existingContent}\n\nPlease suggest how to continue or improve this.`;
  }

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate suggestion');
    }

    const data = await response.json();
    return data.content[0].text;
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
  if (!ANTHROPIC_API_KEY) {
    throw new Error('Anthropic API key not configured. Please add VITE_ANTHROPIC_API_KEY to your .env file.');
  }

  const { theme, mood, style } = options;

  let systemPrompt = 'You are an expert songwriting assistant specializing in writing compelling, emotional, and creative lyrics.';

  let userPrompt = `Here are my current lyrics:\n\n${existingLyrics}\n\n`;

  if (theme) userPrompt += `Theme: ${theme}\n`;
  if (mood) userPrompt += `Mood: ${mood}\n`;
  if (style) userPrompt += `Style: ${style}\n`;

  userPrompt += '\nPlease suggest the next verse or chorus that continues this song naturally. Match the rhyme scheme, rhythm, and emotional tone.';

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        system: systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate lyrics suggestion');
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('Error generating lyrics suggestion:', error);
    throw error;
  }
}
