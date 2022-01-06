import {CLOUD} from "../cloud/cloudAPI";
import {LOGe} from "../logging/Log";
import {MapProvider} from "../backgroundProcesses/MapProvider";
import {xUtil} from "./StandAloneUtil";

export const MessageUtil = {
  uploadMessage: function(store, sphereId, messageId, message, recipients) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[message.triggerLocationId] || message.triggerLocationId;

    // upload message to cloud
    CLOUD.forSphere(sphereId).createMessage({
      triggerLocationId: cloudLocationId,
      triggerEvent: message.triggerEvent,
      content: message.content,
      everyoneInSphere: message.everyoneInSphere,
      everyoneInSphereIncludingOwner: message.everyoneInSphereIncludingOwner
    })
      .then((result) => {
        let cloudId = result.id;

        // add cloudId to message
        store.dispatch({
          type:'UPDATE_MESSAGE_CLOUD_ID',
          sphereId: sphereId,
          messageId: messageId,
          data: { cloudId: cloudId }
        });


        return xUtil.promiseBatchPerformer(recipients, (recipientId) => {
          return CLOUD.forMessage(cloudId).addRecipient(recipientId);
        });
      })
      .then(() => {
        // add cloudId to message
        store.dispatch({
          type:'APPEND_MESSAGE',
          sphereId: sphereId,
          messageId: messageId,
          data: { sent: true, sentAt: Date.now() }
        });
      })
      .catch((err) => {
        LOGe.cloud("MessageUtil: failed to send message to cloud", err?.message);
        store.dispatch({
          type:'APPEND_MESSAGE',
          sphereId: sphereId,
          messageId: messageId,
          data: { sendFailed: true }
        });
      });
  }
};