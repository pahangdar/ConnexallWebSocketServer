const clients = new Map(); // Map to store client connections by WebSocket

// Counters for generating unique IDs per app type
const idCounters = {
  delphi: 0,
  kiosk: 0,
};

// Add a new client to the registry
function addClient(ws) {
  clients.set(ws, { appID: null, appType: null, status: 'waiting', workingDate: null });
}

// Remove a client from the registry
function removeClient(ws) {
  clients.delete(ws);
}

// Generate a unique ID for a given app type
function generateID(appType) {
  idCounters[appType]++;
  return `${appType}_${idCounters[appType]}`;
}

// Assign an ID to a client (only if not already assigned)
function assignID(ws, appType) {
  const client = clients.get(ws);
  if (client && !client.appID) {
    const newID = generateID(appType);
    client.appID = newID;
    client.appType = appType;
    return newID;
  }
  return client?.appID || null;
}

// Update the status of a client
function updateClientStatus(ws, status) {
  const client = clients.get(ws);
  if (client) {
    const oldStatus = client.status;
    client.status = status;

    // Broadcast to Delphi apps only if the status has changed and the app is a kiosk
    if (client.appType === 'kiosk' && oldStatus !== status) {
      broadcastToDelphi({ type: 'kiosk_list_changed' });
    }
  }
}

function updateClientWorkingDate(ws, workingDate) {
  if (clients.has(ws)) {
    const client = clients.get(ws);
    client.workingDate = workingDate;
  }
}

// Get the app type and ID of a client
function getAppInfo(ws) {
  const client = clients.get(ws);
  return client ?
    { appID: client.appID,
      appType: client.appType,
      status: client.status,
      workingDate: client.workingDate
    } : null;
}

// Get all Kiosk apps and their statuses
function getKioskApps() {
  return Array.from(clients.values())
    .filter(client => client.appType === 'kiosk')
    .map(client => ({ appID: client.appID, status: client.status }));
}

// Find a specific client by app ID and type
function findClientByAppID(appID, appType) {
  for (const [ws, client] of clients.entries()) {
    if (client.appID === appID && client.appType === appType) {
      return { ws, client };
    }
  }
  return null;
}

// Broadcast a message to all Delphi apps
function broadcastToDelphi(message) {
  clients.forEach((client, ws) => {
    if (client.appType === 'delphi' && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function getClientsByWorkingDate(workingDate) {
  const delphiClients = [];
  for (const [ws, client] of clients) {
    if (client.appType === 'delphi' && client.workingDate === workingDate) {
      delphiClients.push({ ws, ...client });
    }
  }
  return delphiClients;
}

// Send a message to a specific WebSocket
function sendMessage(ws, message) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('sending message:', message);
  }
}

module.exports = {
  clients,
  addClient,
  removeClient,
  assignID,
  updateClientStatus,
  updateClientWorkingDate,
  getAppInfo,
  getKioskApps,
  findClientByAppID,
  broadcastToDelphi,
  getClientsByWorkingDate,
  sendMessage,
};
