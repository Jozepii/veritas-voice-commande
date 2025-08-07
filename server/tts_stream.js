// OpenAI Realtime: request audio response and yield PCM16@16k chunks
const { base64ToPCM16 } = require('./stt_stream');

async function *ttsStream(state, text) {
  const voice = process.env.OPENAI_TTS_VOICE || 'alloy';

  state.ws.send(JSON.stringify({
    type: 'response.create',
    response: {
      modalities: ['audio', 'text'],
      audio: { voice, format: { type: 'pcm16', sample_rate_hz: 16000, channels: 1 } },
      instructions: text
    }
  }));

  const queue = [];
  let done = false;

  function onMsg(raw) {
    let evt; try { evt = JSON.parse(raw.toString()); } catch { return; }
    if (evt.type === 'response.audio.delta') queue.push(base64ToPCM16(evt.delta));
    if (evt.type === 'response.completed') done = true;
  }
  state.ws.on('message', onMsg);

  while (!done || queue.length) {
    if (queue.length) yield queue.shift();
    else await new Promise(r => setTimeout(r, 15));
  }
  state.ws.off?.('message', onMsg);
}
module.exports = ttsStream;
