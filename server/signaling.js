const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store active connections
const connections = new Map();

wss.on('connection', (ws) => {
  const userId = ws.url.split('?userId=')[1];
  
  if (userId) {
    connections.set(userId, ws);
    console.log(`User ${userId} connected`);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'offer':
          case 'answer':
          case 'ice-candidate':
            const targetWs = connections.get(data.target);
            if (targetWs) {
              targetWs.send(JSON.stringify({
                type: data.type,
                data: data.data,
                from: userId
              }));
            }
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      connections.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  }
});

const PORT = process.env.SIGNALING_PORT || 8080;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}); 