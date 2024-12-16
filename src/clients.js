const clients = new Map(); // Store client info by WebSocket connection
const idCounters = { delphi: 1, react: 1 }; // Separate counters for each app type

function addClient(ws) {
  // Add a new client with default data
  clients.set(ws, { appID: null, appType: null });
}

function removeClient(ws) {
  // Remove the client from the registry
  clients.delete(ws);
}

function generateUniqueID(appType) {
  // Generate a unique ID for the given app type
  const id = `${appType}_${idCounters[appType]}`;
  idCounters[appType]++;
  return id;
}

function assignID(ws, appType) {
  const client = clients.get(ws);
  if (client && !client.appID) {
    // Generate and assign a unique ID if not already assigned
    const uniqueID = generateUniqueID(appType);
    client.appID = uniqueID;
    client.appType = appType;
    return uniqueID;
  }
  // Return the existing ID if already assigned
  return client ? client.appID : null;
}

function getClientInfo(ws) {
  // Retrieve app type and ID for the given connection
  const client = clients.get(ws);
  if (client) {
    return { appID: client.appID, appType: client.appType };
  }
  return null;
}

module.exports = {
  addClient,
  removeClient,
  assignID,
  getClientInfo,
};
