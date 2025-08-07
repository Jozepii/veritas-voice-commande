// OpenAI Realtime: send 16k PCM16 in, read finalized transcripts out
const WebSocket = require('ws');

function upsample8kTo16k(int16_8k) {
  const out = new Int16Array(int16_8k.length * 2);
  let j = 0;
  for (let i = 0; i < int16_8k.length; i++) { out[j++] = int16_8k[i]; out[j++] = int16_8k[i]; }
  return out;
}
function pcm16ToBase64(int16) {
  return Buffer.from(int16.buffer, int16.byteOffset, int16.byteLength).toString('base64');
}
function base64ToPCM16(b64) {
  const buf = Buffer.from(b64, 'base64');
  return new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
}

function start() {
  const model = process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview-2025-01-01';
  const ws = new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  });

  const state = { ws, ready: false, q: [], finals: [] };

  ws.on('open', () => {
    ws.send(JSON.stringify({
      type: 'session.update',
      session: {
        input_audio_format: { type: 'pcm16', sample_rate_hz: 16000, channels: 1 },
        output_audio_format: { type: 'pcm16', sample_rate_hz: 16000, channels: 1 },
        turn_detection: { type: 'server_vad', threshold: 0.6 }
      }
    }));
    state.ready = true;
    while (state.q.length) ws.send(state.q.shift());
  });

  ws.on('message', (raw) => {
    let evt; try { evt = JSON.parse(raw.toString()); } catch { return; }
    if (evt.type === 'input_audio_buffer.transcript' && evt.final) {
      const text = (evt.transcript || '').trim();
      if (text) state.finals.push({ text });
    }
    if (evt.type === 'response.transcript.done') {
      const text = (evt.transcript || '').trim();
      if (text) state.finals.push({ text });
    }
  });

  ws.on('error', e => console.error('Realtime WS error:', e.message || e));
  return state;
}

function push(state, pcm16_8k) {
  const up = upsample8kTo16k(pcm16_8k);
  const msg = JSON.stringify({
    type: 'input_audio_buffer.append',
    audio: { type: 'pcm16', sample_rate_hz: 16000, channels: 1, data: pcm16ToBase64(up) }
  });
  state.ready ? state.ws.send(msg) : state.q.push(msg);
}
function flush(state) {
  const msg = JSON.stringify({ type: 'input_audio_buffer.commit' });
  state.ready ? state.ws.send(msg) : state.q.push(msg);
}
function maybeFinalize(state) { return state.finals.length ? state.finals.shift() : null; }
function stop(state) { try { state.ws.close(); } catch {} }

module.exports = { start, push, flush, maybeFinalize, stop, base64ToPCM16 };
