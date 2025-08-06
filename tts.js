const axios = require('axios');

async function generateSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID/stream',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'arraybuffer',
      data: {
        text: text,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75,
        },
      },
    });

    return response.data;
  } catch (err) {
    console.error('[TTS Error]', err.message);
    return null;
  }
}

module.exports = generateSpeech;
