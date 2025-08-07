if (!speechBuffer) {
  res.status(500).send('TTS failed');
  return;
'Content-Type': 'audio/mpeg',

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': speechBuffer.length,
  });
  res.send(speechBuffer);
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
  res.send(speechBuffer);
});

app.get('/', (req, res) => {
  res.send('✅ Veritas Voice Commander is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 AI server listening on port ${PORT}`);
});
