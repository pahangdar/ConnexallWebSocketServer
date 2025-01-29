const { assignID, getAppInfo, getKioskApps, updateClientStatus, updateClientWorkingDate,
   findClientByAppID, sendMessage, broadcastToDelphi, getClientsByWorkingDate } = require('./clients');

function handleMessage(ws, message) {
  switch (message.type) {
    case 'request_id':
      // Generate or retrieve an ID for the client
      const appID = assignID(ws, message.appType);
      sendMessage(ws, { type: 'assign_id', appID });
      if (message.appType === 'kiosk') {
        broadcastToDelphi({ type: 'kiosk_list_changed' });
      }
      break;

    case 'get_app_info':
      // Respond with the app type, ID, and status of the current client
      const appInfo = getAppInfo(ws);
      sendMessage(ws, { type: 'app_info', appInfo });
      break;

    case 'get_active_kiosk_apps':
      // Respond with the list of active Kiosk apps
      const kioskApps = getKioskApps();
      sendMessage(ws, { type: 'active_kiosk_apps', apps: kioskApps });
      break;

    case 'start_verification':
      // Forward the verification request to the target Kiosk app
      const targetKiosk = findClientByAppID(message.targetAppID, 'kiosk');
      if (targetKiosk) {
        updateClientStatus(targetKiosk.ws, 'confirming');
        sendMessage(targetKiosk.ws, {
          type: 'start_verification',
          requesterAppID: message.requesterAppID,
          appointmentId: message.appointmentId,
          patientData: message.patientData,
        });
      } else {
        sendMessage(ws, { type: 'error', message: 'Kiosk App not found or not available.' });
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
        console.log(`✅ Verification result sent to ${message.targetAppID}`);
      } else {
        console.warn(`⚠️ Target Delphi ${message.targetAppID} not found! Kiosk status will be reset to 'waiting'.`);
      }
      // Always reset kiosk status to 'waiting' (even if Delphi was not found)
      const kioskSender = getAppInfo(ws);
      if (kioskSender) {
        updateClientStatus(ws, 'waiting');
        console.log(`🔄 Kiosk ${kioskSender.appID} status reset to 'waiting'`);
      }
      break;

    case 'update_working_date':
      updateClientWorkingDate(ws, message.workingDate);
      sendMessage(ws, { type: 'working_date_updated', workingDate: message.workingDate });
      break;

    case 'notify_table_change':
      const { table, workingDate, senderAppID } = message;
      const delphiClients = getClientsByWorkingDate(workingDate);
      delphiClients.forEach(({ ws: delphiWs }) => {
        sendMessage(delphiWs, { type: 'table_updated', table, workingDate, senderAppID });
      });
      break;

    default:
      console.warn('Unknown message type:', message.type);
  }
}

module.exports = { handleMessage };
