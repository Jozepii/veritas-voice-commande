const axios = require('axios');

async function textToSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      data: {
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer',
    });

    return response.data;
  } catch (err) {
    console.error('[TTS Error]', err.message);
    return null;
  }
}

module.exports = textToSpeech;
