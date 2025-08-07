const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function synthesizeSpeech(text) {
  try {
    const response = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.7
        }
      },
      responseType: 'arraybuffer'
    });

    const audioBuffer = Buffer.from(response.data, 'binary');

    // Save to temp file
    const filename = `${uuidv4()}.mp3`;
    const filepath = path.join(__dirname, filename);
    fs.writeFileSync(filepath, audioBuffer);

    return filepath;
  } catch (error) {
    console.error('[TTS Error]', error.response?.data || error.message);
    return null;
  }
}

module.exports = synthesizeSpeech;
