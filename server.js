require('dotenv').config();
const WebSocket = require('ws');
const { Deepgram } = require('@deepgram/sdk');

const PORT = process.env.PORT || 3001;
const dg = new Deepgram(process.env.DEEPGRAM_API_KEY);

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`🧠 Media Stream WebSocket server listening on port ${PORT}`);
});

wss.on('connection', (ws) => {
  console.log('📞 Twilio connected to media stream...');

  const deepgramLive = dg.transcription.live({
    punctuate: true,
    interim_results: true,
    language: 'en-US',
  });

  deepgramLive.on('open', () => {
    console.log('🎯 Deepgram live transcription started...');
  });

  deepgramLive.on('transcriptReceived', (msg) => {
    const transcript = JSON.parse(msg)?.channel?.alternatives[0]?.transcript;
    if (transcript && transcript.length > 0) {
      console.log(`📝 Transcript: ${transcript}`);
      // TODO: Send transcript to GPT + ElevenLabs here
    }
  });

  deepgramLive.on('error', (err) => console.error('❌ Deepgram error:', err));
  deepgramLive.on('close', () => console.log('🔌 Deepgram closed.'));

  ws.on('message', (msg) => {
    const data = JSON.parse(msg);

    if (data.event === 'start') {
      console.log(`🚀 Stream started: ${data.streamSid}`);
    }

    if (data.event === 'media') {
      const audio = Buffer.from(data.media.payload, 'base64');
      deepgramLive.send(audio);
    }

    if (data.event === 'stop') {
      console.log('🛑 Stream stopped.');
      deepgramLive.finish();
    }
  });

  ws.on('close', () => {
    console.log('📴 Twilio disconnected.');
    deepgramLive.finish();
  });
});
