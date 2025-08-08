// at top of server.js
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const { Deepgram } = require('@deepgram/sdk');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get('/', (_, res) => res.send('✅ Media Stream Server running'));

const dg = new Deepgram(process.env.DEEPGRAM_API_KEY);

wss.on('connection', (ws) => {
  console.log('🔌 Twilio Media Stream connected');

  // Open Deepgram live connection once per call
  const dgLive = dg.transcription.live({
    model: 'nova',           // or 'general'
    punctuate: true,
    interim_results: true,
    encoding: 'mulaw',       // Twilio sends µ-law
    sample_rate: 8000
  });

  dgLive.on('open', () => console.log('🧠 Deepgram live session open'));
  dgLive.on('error', (e) => console.error('Deepgram error:', e));
  dgLive.on('close', () => console.log('🧠 Deepgram closed'));

  dgLive.on('transcriptReceived', (msg) => {
    try {
      const alt = JSON.parse(msg).channel.alternatives[0];
      const text = alt.transcript;
      if (text) console.log('📝', text);
      // TODO: detect end-of-utterance and trigger GPT + TTS here
    } catch (e) {}
  });

  ws.on('message', (raw) => {
    const data = JSON.parse(raw);

    if (data.event === 'start') {
      console.log('▶️ Stream start:', data.start.streamSid);
    }

    if (data.event === 'media') {
      // Twilio sends base64 µ-law @ 8kHz
      const mulaw = Buffer.from(data.media.payload, 'base64');
      dgLive.send(mulaw);
    }

    if (data.event === 'stop') {
      console.log('⏹ Stream stop');
      dgLive.finish();
    }
  });

  ws.on('close', () => {
    dgLive.finish();
    console.log('❌ Twilio socket closed');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 WS server on ${PORT}`));
