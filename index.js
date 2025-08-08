app.post('/twilio', (req, res) => {
  console.log('📞 Call started — sending TwiML...');
  const twiml = `
    <Response>
      <Connect>
        <Stream url="wss://veritas-voice-commande-production.up.railway.app/stream" track="inbound_audio" />
      </Connect>
    </Response>
  `;
  res.type('text/xml').send(twiml.trim());
});
