const axios = require('axios');
const https = require('https');

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
