const axios = require('axios');

async function getGPTReply(transcript) {
  try {
    const systemPrompt = \`
You are a helpful, polite AI receptionist for a small business.
You answer phone calls, offer appointment times, and confirm bookings.
Keep responses short, friendly, and speakable in one breath.
\`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript },
        ],
        max_tokens: 100,
        temperature: 0.6,
      },
      {
        headers: {
          Authorization: \`Bearer \${process.env.OPENAI_API_KEY}\`,
        },
      }
    );

    return response.data.choices[0].message.content.trim();
  } catch (err) {
    console.error('[GPT Error]', err.message);
    return 'Sorry, something went wrong.';
  }
}

module.exports = getGPTReply;
