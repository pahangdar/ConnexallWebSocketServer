const WebSocket = require('ws');
const dotenv = require('dotenv');
const { handleMessage } = require('./messages');
const { addClient, removeClient, getClientInfo } = require('./clients');

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
    handleMessage(ws, JSON.parse(message), wss);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    removeClient(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Optional: Log connected clients for debugging
setInterval(() => {
  console.log('Current clients:', Array.from(wss.clients).map(ws => getClientInfo(ws)));
}, 10000);
