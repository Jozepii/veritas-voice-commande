require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const https = require('https');
const transcribeAudio = require('./transcribe');
const getGPTReply = require('./gpt');
const generateSpeech = require('./tts');

const app = express();

// Parse URL-encoded and JSON (needed for Twilio webhooks)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Accepts Twilio call and gives recording instructions
app.post('/twilio', async (req, res) => {
  console.log('📞 Call started — sending recording instructions...');

  const twiml = `
    <Response>
      <Say voice="alice">Hello, thank you for calling. Please tell me how I can assist you today after the tone.</Say>
      <Record 
        maxLength="10" 
        action="/recording" 
        method="POST" 
        playBeep="true" 
        trim="trim-silence" 
      />
      <Say>We did not receive your recording. Goodbye.</Say>
    </Response>
  `;

  res.set('Content-Type', 'text/xml');
  res.send(twiml.trim());
});

// Handles the recording after user speaks
app.post('/recording', async (req, res) => {
  const recordingUrl = req.body.RecordingUrl;
  console.log('🎙️ Recording received:', recordingUrl);

  if (!recordingUrl) {
    console.error('❌ No recording URL found.');
    return res.status(400).send('No recording URL');
  }

  const audioUrl = `${recordingUrl}.mp3`;

  try {
    const audioBuffer = await new Promise((resolve, reject) => {
      https.get(audioUrl, (response) => {
        const data = [];
        response.on('data', chunk => data.push(chunk));
        response.on('end', () => resolve(Buffer.concat(data)));
      }).on('error', reject);
    });

    const transcript = await transcribeAudio(audioBuffer);
    console.log('📝 Transcript:', transcript);

    const gptReply = await getGPTReply(transcript);
    console.log('🤖 GPT says:', gptReply);

    const speechBuffer = await generateSpeech(gptReply);

    const twiml = `
      <Response>
        <Say voice="Polly.Joanna">${gptReply}</Say>
        <Say>Thank you for calling. Goodbye.</Say>
      </Response>
    `;

    res.set('Content-Type', 'text/xml');
    res.send(twiml.trim());

  } catch (err) {
    console.error('❌ Error processing recording:', err.message || err);
    res.status(500).send('Error processing recording');
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('✅ Veritas Voice Commander is running.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AI server listening on port ${PORT}`);
});
