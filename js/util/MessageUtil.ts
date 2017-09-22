

import {CLOUD} from "../cloud/cloudAPI";
import {Util} from "./Util";
import {LOG} from "../logging/Log";

export const MessageUtil = {
  uploadMessage: function(store, sphereId, messageId, message, recipients) {
    // upload message to cloud
    CLOUD.forSphere(sphereId).createMessage({
      triggerLocationId: message.triggerLocationId,
      triggerEvent: message.triggerEvent,
      content: message.content,
      everyoneInSphere: message.everyoneInSphere,
      everyoneInSphereIncludingOwner: message.everyoneInSphereIncludingOwner
    })
      .then((result) => {
        let cloudId = result.id;

        // add cloudId to message
        store.dispatch({
          type:'APPEND_MESSAGE',
          sphereId: sphereId,
          messageId: messageId,
          data: { cloudId: cloudId }
        });

        return Util.promiseBatchPerformer(recipients, (recipientId) => {
          return CLOUD.forMessage(cloudId).addRecipient(recipientId);
        });
      })
      .then(() => {
        // add cloudId to message
        store.dispatch({
          type:'APPEND_MESSAGE',
          sphereId: sphereId,
          messageId: messageId,
          data: { sent: true, sentAt: new Date().valueOf() }
        });
      })
      .catch((err) => {
        LOG.error("MessageUtil: failed to send message to cloud", err);
        store.dispatch({
          type:'APPEND_MESSAGE',
          sphereId: sphereId,
          messageId: messageId,
          data: { sendFailed: true }
        });
      });
  }
};