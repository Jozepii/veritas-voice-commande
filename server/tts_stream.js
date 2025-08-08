// server/tts_stream.js
const WebSocket = require('ws');

async function *ttsStream(_, text) {
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!voiceId || !apiKey) {
    console.error('❌ ELEVENLABS_VOICE_ID or ELEVENLABS_API_KEY is missing in env vars.');
    return;
  }

  console.log(`🎤 Requesting ElevenLabs voice: ${voiceId} for text: "${text}"`);

  // ElevenLabs WebSocket endpoint for streaming TTS
  const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2`;

  const ws = new WebSocket(wsUrl, {
    headers: {
      'xi-api-key': apiKey
    }
  });

  const queue = [];
  let done = false;

  ws.on('open', () => {
    console.log('🔗 Connected to ElevenLabs TTS stream');
    // Send the text to be spoken
    ws.send(JSON.stringify({
      text,
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    }));
    // End the stream
    ws.send(JSON.stringify({ text: '' }));
  });

  ws.on('message', (data) => {
    if (Buffer.isBuffer(data) && data.length > 0) {
      console.log(`🎧 Received audio chunk from ElevenLabs (${data.length} bytes)`);
      const pcm16 = new Int16Array(data.buffer, data.byteOffset, Math.floor(data.byteLength / 2));
      queue.push(pcm16);
    } else {
      try {
        const evt = JSON.parse(data.toString());
        if (evt.isFinal) {
          console.log('🏁 ElevenLabs TTS stream complete');
          done = true;
        }
      } catch (err) {
        console.error('⚠️ ElevenLabs non-audio message parse error:', err.message);
      }
    }
  });

  ws.on('close', () => {
    console.log('🔌 ElevenLabs WebSocket closed');
    done = true;
  });

  ws.on('error', (err) => {
    console.error('❌ ElevenLabs WebSocket error:', err.message);
    done = true;
  });

  // Yield chunks to the caller
  while (!done || queue.length) {
    if (queue.length) {
      yield queue.shift();
    } else {
      await new Promise(r => setTimeout(r, 10));
    }
  }
}

module.exports = ttsStream;
