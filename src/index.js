const WebSocket = require('ws');
const dotenv = require('dotenv');

const { handleMessage } = require('./messages');
const { addClient, removeClient, getAppInfo, clients, broadcastToDelphi } = require('./clients');

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
    try {
      const parsedMessage = JSON.parse(message);
      console.log('Received message:', parsedMessage);
      handleMessage(ws, parsedMessage);
    } catch (error) {
      console.error('Invalid message format:', message);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    const appInfo = getAppInfo(ws);
    if (appInfo?.appType === 'kiosk') {
      broadcastToDelphi({ type: 'kiosk_list_changed' });
    }
    removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Log connected apps every second
setInterval(() => {
  console.log('Connected Apps:');
  for (const [ws, client] of clients.entries()) {
    const appInfo = getAppInfo(ws);
    if (appInfo) {
      console.log(`AppID: ${appInfo.appID}, Type: ${appInfo.appType}, Status: ${appInfo.status}, workingDate: ${appInfo.workingDate}`);
    }
  }
}, 1000);
