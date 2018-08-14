import { CLOUD } from '../../cloudAPI'
import { Platform } from 'react-native'
import {LOG, LOGe} from "../../../logging/Log";
const RNFS = require('react-native-fs');

/**
 * These events are used to remove/create files in the cloud.
 * In case the initial command failed, we want the user to just continue
 * what they were doing.
 *
 * To handle this, we have a list of events that we need to finalize.
 *
 *
 *
 *
 *
 *
 *
 *
 *
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
    .catch((err) => { LOGe.cloud('syncEvents: error', err)})

};

const handleRemove = function(state, events, actions) {
  let promises = [];
  let scheduleIds = Object.keys(events.schedules);
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
  let locationEventIds = Object.keys(events.locations);
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
            LOGe.cloud("syncEvents Special: Could not remove image from cloud", err);
          }));
        break;
      case 'uploadProfilePicture':
        if (!state.user.picture) {
          success();
        }
        else {
          promises.push(
            RNFS.exists(state.user.picture)
              .then((fileExists) => {
                if (fileExists === false) {
                  success();
                }
                else {
                  return CLOUD.uploadProfileImage(state.user.picture)
                }
              })
              .then(() => { success() })
              .catch((err) => {
                LOGe.cloud("syncEvents Special: Could not upload image to cloud", err);
              })
          )
        }
        break;

    }
  });

  locationEventIds.forEach((locationEventId) => {
    let payload = events.locations[locationEventId];
    let success = () => { actions.push({type: 'FINISHED_SPECIAL_LOCATIONS', id: locationEventId })};

    let sphere = state.spheres[payload.localSphereId];
    if (!sphere) { return success(); }

    let location = sphere.locations[payload.localId];
    if (!location) { return success(); }


    switch (payload.specialType) {
      case 'removeLocationPicture':
        promises.push(CLOUD.forLocation(payload.localId).deleteLocationPicture({background: true}).then(() => { success(); })
          .catch((err) => {
            // even if there is no profile pic, 204 will be returned. Any other errors are.. errors?
            LOGe.cloud("syncEvents Special: Could not remove location image from cloud", err);
          }));
        break;
      case 'uploadLocationPicture':
        if (!location.config.picture) {
          success();
        }
        else {
          promises.push(
            RNFS.exists(location.config.picture)
              .then((fileExists) => {
                if (fileExists === false) {
                  success();
                }
                else {
                  return CLOUD.forLocation(payload.localId).uploadLocationPicture(location.config.picture)
                }
              })
              .then(() => { success() })
              .catch((err) => {
                LOGe.cloud("syncEvents Special: Could not upload location image to cloud", err);
              })
          )
        }
        break;

    }
  });

  return Promise.all(promises);
};
