const axios = require('axios');

async function textToSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8
        }
      },
      responseType: 'arraybuffer'
    });

    return response.data;
  } catch (err) {
    console.error('[TTS Error]', err.response?.status, err.message);
    return null;
  }
}

module.exports = textToSpeech;
