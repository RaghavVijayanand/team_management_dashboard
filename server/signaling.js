const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const userId = url.searchParams.get('userId');
  
  if (userId) {
    console.log(`User ${userId} connected`);
    clients.set(userId, ws);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      message: `Connected as ${userId}`
    }));
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received message type: ${data.type} from: ${userId}`);
      
      if (data.target && clients.has(data.target)) {
        // Forward message to target user
        const targetWs = clients.get(data.target);
        if (targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(message.toString());
          console.log(`Forwarded ${data.type} message to ${data.target}`);
        }
      }
    } catch (err) {
      console.error('Error parsing message:', err);
    }
  });

  ws.on('close', () => {
    if (userId) {
      console.log(`User ${userId} disconnected`);
      clients.delete(userId);
    }
  });
});

console.log('WebRTC Signaling server running on port 8080'); 