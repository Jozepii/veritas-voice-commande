const axios = require('axios');

async function synthesizeSpeech(text) {
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      data: {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.5,
        },
      },
      responseType: 'arraybuffer',
    });

    return response.data;
  } catch (err) {
    console.error('[TTS Error]', err.response?.data || err.message);
    return null;
  }
}

module.exports = synthesizeSpeech;

