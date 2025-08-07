const axios = require('axios');

async function transcribeAudio(audioBuffer) {
  try {
    const response = await axios({
      method: 'POST',
      url: 'https://api.deepgram.com/v1/listen?punctuate=true&language=en-US',
      headers: {
        'Authorization': `Token ${process.env.DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/octet-stream', // This is safer than audio/wav
      },
      data: audioBuffer,
    });

    const transcript = response.data.results?.channels[0]?.alternatives[0]?.transcript || '';
    return transcript;
  } catch (err) {
    console.error('[Transcription Error]', err.response?.data || err.message);
    return '[transcription failed]';
  }
}

module.exports = transcribeAudio;
