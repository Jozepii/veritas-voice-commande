// server/stream.js
const WebSocket = require('ws');
const url = require('url');
const { muLawDecode, muLawEncode } = require('./ulaw');
const STT = require('./stt_stream');
const ttsStream = require('./tts_stream');
const getGPTReply = require('../gpt'); // your existing GPT reply logic

function createStreamServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = url.parse(req.url);
    if (pathname === '/stream') {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let streamSid = null;
    const session = STT.start();
    let speaking = false;

    ws.on('message', async (raw) => {
      const data = JSON.parse(raw.toString());

      // ---- STREAM START ----
      if (data.event === 'start') {
        streamSid = data.start.streamSid;
        console.log('🔌 Stream started', streamSid);

        // Send a 1-second 440Hz tone so we know Twilio is receiving valid μ-law audio
        const samples = new Int16Array(8000); // 1 sec at 8kHz
        for (let i = 0; i < samples.length; i++) {
          samples[i] = Math.sin(2 * Math.PI * 440 * (i / 8000)) * 10000;
        }
        const uLawTone = muLawEncode(samples);
        ws.send(JSON.stringify({
          event: 'media',
          streamSid,
          media: { payload: uLawTone.toString('base64') }
        }));
        console.log('✅ Sent 1-second test tone to Twilio');

        // Now attempt Laura's greeting
        (async () => {
          try {
            speaking = true;
            const greeting = "Hi, this is Laura, your virtual receptionist. How can I help you today?";
            let gotAudio = false;

            for await (const pcm16_16k of ttsStream(session, greeting)) {
              gotAudio = true;
              const down = new Int16Array(Math.floor(pcm16_16k.length / 2));
              for (let i = 0, j = 0; j < down.length; i += 2, j++) down[j] = pcm16_16k[i];
              const u = muLawEncode(down);
              ws.send(JSON.stringify({
                event: 'media',
                streamSid,
                media: { payload: u.toString('base64') }
              }));
            }

            if (!gotAudio) {
              console.error('❌ No audio chunks returned from ElevenLabs for greeting');
            } else {
              console.log('✅ Sent Laura greeting audio');
            }

            ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'greeting_done' } }));
          } catch (e) {
            console.error('Greeting error:', e.message);
          } finally {
            speaking = false;
          }
        })();

        return;
      }

      // ---- INCOMING CALLER AUDIO ----
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
              const down = new Int16Array(Math.floor(pcm16_16k.length / 2)); // 16k → 8k
              for (let i = 0, j = 0; j < down.length; i += 2, j++) down[j] = pcm16_16k[i];
              const u = muLawEncode(down);
              ws.send(JSON.stringify({
                event: 'media',
                streamSid,
                media: { payload: u.toString('base64') }
              }));
            }
            ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'ai_segment_done' } }));
          })()
            .catch((e) => console.error('Speak error:', e.message))
            .finally(() => { speaking = false; });
        }
        return;
      }

      // ---- STREAM STOP ----
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
