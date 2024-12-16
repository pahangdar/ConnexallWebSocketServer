const { assignID, getClientInfo } = require('./clients');

function handleMessage(ws, message, wss) {
  switch (message.type) {
    case 'request_id':
      // Generate or return the existing ID for the client
      const appType = message.appType;
      if (!appType || !['delphi', 'react'].includes(appType)) {
        sendError(ws, 'Invalid appType');
        return;
      }
      const appID = assignID(ws, appType);
      sendMessage(ws, { type: 'assign_id', appID });
      console.log(`Assigned ID: ${appID} for appType: ${appType}`);
      break;

    case 'get_client_info':
      // Retrieve the appType and appID for the current connection
      const clientInfo = getClientInfo(ws);
      sendMessage(ws, { type: 'client_info', info: clientInfo });
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
}

function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws, error) {
  sendMessage(ws, { type: 'error', message: error });
}

module.exports = { handleMessage };
