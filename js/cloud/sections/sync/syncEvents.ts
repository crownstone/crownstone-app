import { CLOUD } from '../../cloudAPI'
import { Platform } from 'react-native'
import {transferSchedules} from "../../transferData/transferSchedules";
import {LOG} from "../../../logging/Log";

/**
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const syncEvents = function(store) {
  let state = store.getState();

  let remove = state.events.remove;
  let special = state.events.special;

  let actions = [];
  let promises = [];

  promises.push(handleRemove(state, remove, actions));
  promises.push(handleSpecial(state, special, actions));

  return Promise.all(promises)
    .then(() => {
      if (actions.length > 0) {
        store.batchDispatch(actions);
      }
    })
    .catch((err) => { LOG.error('syncEvents: error', err)})

};

const handleRemove = function(state, events, actions) {
  let promises = [];
  let scheduleIds = Object.keys(events.schedules) ;
  let messageIds = Object.keys(events.messages);
  messageIds.forEach((messageId) => {
    let payload = events.messages[messageId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_MESSAGES', id: messageId })};
    promises.push(CLOUD.forSphere(payload.sphereId).deleteMessage(payload.cloudId)
      .then(() => { success(); })
      .catch((err) => {
        // already deleted
        if (err.status === 404) { success(); }
      }));
  });


  scheduleIds.forEach((scheduleId) => {
    let eventData = events.schedules[scheduleId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_SCHEDULES', id: scheduleId })};
    if (!eventData.cloudId) { return success() }
    if (!eventData.stoneId) { return success() }

    promises.push(
      CLOUD.forStone(eventData.stoneId).deleteSchedule(eventData.cloudId)
        .then(() => { success(); })
        .catch((err) => {
          // already deleted
          if (err.status === 404) { success(); }
        })
    );
  });

  return Promise.all(promises);
};

const handleSpecial = function(state, events, actions) {
  let promises = [];
  let messageIds = Object.keys(events.messages);
  let userEventIds = Object.keys(events.user);
  messageIds.forEach((dbId) => {
    let payload = events.messages[dbId];
    let success = () => { actions.push({type: 'FINISHED_SPECIAL_MESSAGES', id: dbId })};

    switch (payload.specialType) {
      case 'receivedMessage':
        promises.push(CLOUD.receivedMessage(payload.cloudId).then(() => { success(); }).catch((err) => {
          // message we are trying to mark delivered is deleted. That's ok, the sender can delete the message.
          if (err.status === 404 || err.status === 400) { success(); }
        }));
        break;
      case 'readMessage':
        promises.push(CLOUD.readMessage(payload.cloudId).then(() => { success(); }).catch((err) => {
          // message we are trying to mark read is deleted. That's ok, the sender can delete the message.
          if (err.status === 404 || err.status === 400) { success(); }
        }));
        break;
    }
  });

  userEventIds.forEach((userEventId) => {
    let payload = events.user[userEventId];
    let success = () => { actions.push({type: 'FINISHED_SPECIAL_USER', id: userEventId })};
    switch (payload.specialType) {
      case 'removeProfilePicture':
        promises.push(CLOUD.removeProfileImage({background: true}).then(() => { success(); })
          .catch((err) => {
            // even if there is no profile pic, 204 will be returned. Any other errors are.. errors?
            LOG.error("syncEvents Special: Could not remove image from cloud", err);
          }));
        break;
      case 'uploadProfilePicture':
        CLOUD.uploadProfileImage(state.user.picture)
          .then(() => { success() })
          .catch((err) => {
            LOG.error("syncEvents Special: Could not upload image to cloud", err);
          });
    }
  });

  return Promise.all(promises);
};
