require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { createStreamServer } = require('./server/stream');

const app = express(); // <<< THIS must come before you use app.post()

// Parse URL-encoded and JSON (needed for Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Twilio entrypoint — returns TwiML that opens a real-time audio stream
app.post('/twilio', (req, res) => {
  console.log('📞 Call started — sending TwiML...');
  const twiml = `
    <Response>
      <Connect>
        <Stream url="wss://veritas-voice-commande-production.up.railway.app/stream" track="inbound_audio"/>
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
