require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { createStreamServer } = require('./server/stream');

const app = express();

// Parse URL-encoded and JSON (needed for Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Twilio entrypoint — starts a real-time audio stream immediately
app.post('/twilio', (req, res) => {
  console.log('📞 Call started — opening real-time stream...');

  const host = process.env.PUBLIC_HOST; // e.g. veritas-voice-commande-production.up.railway.app
  if (!host) {
    console.error('❌ PUBLIC_HOST is not set!');
  }

  const twiml = `
    <Response>
      <Say voice="alice">Hello, this is your AI receptionist. You can start speaking at any time.</Say>
      <Connect>
        <Stream url="wss://${host}/stream" track="inbound_audio" />
      </Connect>
    </Response>
  `;

  res.set('Content-Type', 'text/xml');
  res.send(twiml.trim());
});

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Veritas Voice Commander is running in real-time mode.');
});

// Create HTTP server and attach WebSocket stream handler
const server = http.createServer(app);
createStreamServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 AI server listening on port ${PORT}`);
});
