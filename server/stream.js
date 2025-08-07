const WebSocket = require('ws');
const url = require('url');
const { muLawDecode, muLawEncode } = require('./ulaw');
const STT = require('./stt_stream');
const ttsStream = require('./tts_stream');
const getGPTReply = require('../gpt'); // your existing GPT fn

function createStreamServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = url.parse(req.url);
    if (pathname === '/stream') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else socket.destroy();
  });

  wss.on('connection', (ws) => {
    let streamSid = null;
    const session = STT.start();
    let speaking = false;

    ws.on('message', async (raw) => {
      const data = JSON.parse(raw.toString());

      if (data.event === 'start') {
        streamSid = data.start.streamSid;
        console.log('🔌 Stream started', streamSid);
        return;
      }

      if (data.event === 'media') {
        const ulaw = Buffer.from(data.media.payload, 'base64');
        const pcm16_8k = muLawDecode(ulaw);
        STT.push(session, pcm16_8k);

        if (!speaking) STT.flush(session);

        const utter = STT.maybeFinalize(session);
        if (utter && !speaking) {
          speaking = true;
          (async () => {
            const reply = await getGPTReply(utter.text);
            for await (const pcm16_16k of ttsStream(session, reply)) {
              const down = new Int16Array(Math.floor(pcm16_16k.length / 2)); // 16k -> 8k
              for (let i = 0, j = 0; j < down.length; i += 2, j++) down[j] = pcm16_16k[i];
              const u = muLawEncode(down);
              ws.send(JSON.stringify({ event: 'media', streamSid, media: { payload: u.toString('base64') } }));
            }
            ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'ai_segment_done' } }));
            speaking = false;
          })().catch(e => { console.error('speak err', e.message); speaking = false; });
        }
        return;
      }

      if (data.event === 'stop') {
        console.log('🛑 Stream stopped', streamSid);
        STT.stop(session);
        ws.close();
      }
    });

    ws.on('close', () => { try { STT.stop(session); } catch {} });
  });

  return wss;
}
module.exports = { createStreamServer };
