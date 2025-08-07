require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const transcribeAudio = require('./transcribe');
const getGPTReply = require('./gpt');
const generateSpeech = require('./tts');

const app = express();

// ✅ Accept all audio types from Twilio, not just WAV
app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }));

app.post('/twilio', async (req, res) => {
  console.log('🎙️ Call received, processing...');
  const audioBuffer = req.body;

  // Optional debug logs (remove if not needed)
  console.log('📏 Audio Buffer Length:', audioBuffer.length);
  console.log('🧾 Headers:', req.headers);

  const transcript = await transcribeAudio(audioBuffer);
  console.log('📝 Transcript:', transcript);

  const gptReply = await getGPTReply(transcript);
  console.log('🤖 GPT says:', gptReply);

  const speechBuffer = await generateSpeech(gptReply);
  if (!speechBuffer) {
    res.status(500).send('TTS failed');
    return;
  }

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': speechBuffer.length,
  });
  res.send(speechBuffer);
});

app.get('/', (req, res) => {
  res.send('✅ Veritas Voice Commander is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AI server listening on port ${PORT}`);
});
