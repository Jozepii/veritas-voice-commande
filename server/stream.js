// server/stream.js
const WebSocket = require('ws');
const url = require('url');

function createStreamServer(server) {
  const wss = new WebSocket.Server({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = url.parse(req.url);
    if (pathname === '/stream') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        console.log('✅ WebSocket connection established to /stream');
        ws.on('message', (raw) => {
          try {
            const data = JSON.parse(raw.toString());
            console.log('📨 Incoming WS event:', data.event);

            if (data.event === 'start') {
              console.log('🔌 Stream started:', data.start.streamSid);
            }
            if (data.event === 'stop') {
              console.log('🛑 Stream stopped');
            }
          } catch (err) {
            console.error('⚠️ WS message parse error:', err.message);
          }
        });
      });
    } else {
      socket.destroy();
    }
  });
}

module.exports = { createStreamServer };
