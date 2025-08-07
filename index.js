require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { createStreamServer } = require('./server/stream');

const app = express();

// Parse URL-encoded and JSON (needed for Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Twilio entrypoint — open the realtime stream immediately (no Twilio <Say>)
app.post('/twilio', (req, res) => {
  console.log('📞 Call started — opening real-time stream...');

  const host = process.env.PUBLIC_HOST; // e.g. veritas-voice-commande-production.up.railway.app
  if (!host) {
    console.error('❌ PUBLIC_HOST is not set!');
  }

  const twiml = `
    <Response>
      <Connect>
        <Stream url="wss://${host}/stream" track="inbound_audio" />
      </Connect>
    </Response>
  `;

  res.type('text/xml').send(twiml.trim());
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
