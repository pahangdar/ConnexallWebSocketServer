const { assignID, getAppInfo, getReactApps, updateClientStatus, findClientByAppID, sendMessage } = require('./clients');

function handleMessage(ws, message) {
  switch (message.type) {
    case 'request_id':
      // Generate or retrieve an ID for the client
      const appID = assignID(ws, message.appType);
      sendMessage(ws, { type: 'assign_id', appID });
      break;

    case 'get_app_info':
      // Respond with the app type, ID, and status of the current client
      const appInfo = getAppInfo(ws);
      sendMessage(ws, { type: 'app_info', appInfo });
      break;

    case 'get_active_react_apps':
      // Respond with the list of active React apps
      const reactApps = getReactApps();
      sendMessage(ws, { type: 'active_react_apps', apps: reactApps });
      break;

    case 'start_verification':
      // Forward the verification request to the target React app
      const targetReact = findClientByAppID(message.targetAppID, 'react');
      if (targetReact) {
        updateClientStatus(targetReact.ws, 'confirming');
        sendMessage(targetReact.ws, {
          type: 'start_verification',
          requesterAppID: message.requesterAppID,
          appointmentId: message.appointmentId,
          patientData: message.patientData,
        });
      } else {
        sendMessage(ws, { type: 'error', message: 'React App not found or not available.' });
      }
      break;

    case 'verification_result':
      // Forward the verification result to the requesting Delphi app
      const targetDelphi = findClientByAppID(message.targetAppID, 'delphi');
      if (targetDelphi) {
        sendMessage(targetDelphi.ws, {
          type: 'verification_result',
          appointmentId: message.appointmentId,
          result: message.result,
          resultDetails: message.resultDetails,
        });
        const reactSender = getAppInfo(ws);
        if (reactSender) updateClientStatus(ws, 'waiting');
      }
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
}

module.exports = { handleMessage };
