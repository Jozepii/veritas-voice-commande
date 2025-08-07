const axios = require('axios');
const fs = require('fs');

async function textToSpeech(text) {
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      data: {
        text,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer'
    });

    return response.data; // raw audio buffer
  } catch (err) {
    console.error('[TTS Error]', err.response?.data?.toString() || err.message);
    return null;
  }
}

module.exports = textToSpeech;


