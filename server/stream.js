if (data.event === 'start') {
  streamSid = data.start.streamSid;
  console.log('🔌 Stream started', streamSid);

  // --- Send immediate greeting via ElevenLabs (Laura) so Twilio hears audio right away ---
  (async () => {
    try {
      speaking = true;
      const greeting =
        "Hi, thanks for calling. This is Laura, your virtual receptionist. How can I help you today?";

      for await (const pcm16_16k of ttsStream(session, greeting)) {
        // downsample 16k → 8k for Twilio
        const down = new Int16Array(Math.floor(pcm16_16k.length / 2));
        for (let i = 0, j = 0; j < down.length; i += 2, j++) down[j] = pcm16_16k[i];

        const u = muLawEncode(down);
        ws.send(JSON.stringify({
          event: 'media',
          streamSid,
          media: { payload: u.toString('base64') }
        }));
      }

      // Let Twilio know this chunk is done
      ws.send(JSON.stringify({ event: 'mark', streamSid, mark: { name: 'greeting_done' } }));
    } catch (e) {
      console.error('Greeting error:', e.message);
    } finally {
      speaking = false;
    }
  })();

  return;
}
