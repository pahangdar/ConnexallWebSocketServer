const WebSocket = require('ws');
const dotenv = require('dotenv');
const { handleMessage } = require('./messages');
const { addClient, removeClient, getAppInfo, clients } = require('./clients');

dotenv.config();

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  addClient(ws);

  ws.on('message', (message) => {
    console.log('Received message:', message);
    handleMessage(ws, JSON.parse(message));
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Log connected apps every second
setInterval(() => {
  console.log('Connected Apps:');
  for (const [ws, client] of require('./clients').clients.entries()) {
    const appInfo = getAppInfo(ws);
    if (appInfo) {
      console.log(`AppID: ${appInfo.appID}, Type: ${appInfo.appType}, Status: ${appInfo.status}`);
    }
  }
}, 1000);
