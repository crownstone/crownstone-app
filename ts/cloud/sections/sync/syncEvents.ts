import { CLOUD } from '../../cloudAPI'
import {LOGe} from "../../../logging/Log";
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
  let messageEventIds   = Object.keys(events.messages);
  let behaviourEventIds = Object.keys(events.behaviours);
  let sceneEventIds     = Object.keys(events.scenes);
  messageEventIds.forEach((messageEventId) => {
    let payload : SyncEvent = events.messages[messageEventId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_MESSAGES', id: messageEventId })};
    promises.push(CLOUD.forSphere(payload.sphereId).deleteMessage(payload.cloudId)
      .then(() => { success(); })
      .catch((err) => {
        // already deleted
        if (err.status === 404) { success(); }
      }));
  });


  sceneEventIds.forEach((sceneEventId) => {
    let eventData : SyncEvent = events.scenes[sceneEventId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_SCENES', id: sceneEventId })};
    if (!eventData.cloudId) { return success() }

    promises.push(
      CLOUD.forSphere(eventData.sphereId).deleteScene(eventData.cloudId)
        .then(() => { success(); })
        .catch((err) => {
          // already deleted
          if (err.status === 404) { success(); }
        })
    );
  });

  behaviourEventIds.forEach((behaviourEventId) => {
    let eventData : SyncEvent = events.behaviours[behaviourEventId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_BEHAVIOURS', id: behaviourEventId })};
    if (!eventData.cloudId) { return success() }
    if (!eventData.stoneId) { return success() } // this is for items living under stones

    promises.push(
      CLOUD.forStone(eventData.stoneId).deleteBehaviour(eventData.cloudId)
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
  let sceneEventIds = Object.keys(events.scenes);
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

    let sphere = state.spheres[payload.sphereId];
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

  sceneEventIds.forEach((sceneEventId) => {
    let payload = events.scenes[sceneEventId];
    let success = () => { actions.push({type: 'FINISHED_SPECIAL_SCENES', id: sceneEventId })};

    let sphere = state.spheres[payload.sphereId];
    if (!sphere) { return success(); }

    let scene = sphere.scenes[payload.localId];
    if (!scene) { return success(); }


    switch (payload.specialType) {
      case 'removeScenePicture':
        promises.push(CLOUD.forScene(payload.localId).deleteSceneCustomPicture({background: true}).then(() => { success(); })
          .catch((err) => {
            // even if there is no profile pic, 204 will be returned. Any other errors are.. errors?
            LOGe.cloud("syncEvents Special: Could not remove scene image from cloud", err);
          }));
        break;
      case 'uploadScenePicture':
        if (!scene.picture) {
          success();
        }
        else {
          promises.push(
            RNFS.exists(scene.picture)
              .then((fileExists) => {
                if (fileExists === false) {
                  success();
                }
                else {
                  return CLOUD.forScene(payload.localId).uploadSceneCustomPicture(scene.picture);
                }
              })
              .then(() => { success() })
              .catch((err) => {
                LOGe.cloud("syncEvents Special: Could not upload scene image to cloud", err);
              })
          )
        }
        break;
    }
  });

  return Promise.all(promises);
};
