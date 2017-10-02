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

  let create = state.events.create;
  let update = state.events.update;
  let remove = state.events.remove;
  let special = state.events.special;

  let actions = [];
  let promises = [];


  promises.push(handleCreate(state, create, actions));
  promises.push(handleUpdate(state, update, actions));
  promises.push(handleRemove(state, remove, actions));
  promises.push(handleSpecial(state, special, actions));

  return Promise.all(promises)
    .then(() => {
      if (actions.length > 0) {
        store.batchDispatch(actions);
      }
    })
    .catch((err) => { console.log('syncEvents: error', err)})

};

const handleCreate = function(state, events, actions) {
  return _handleCreateAndUpdate('CREATE', 'createOnCloud', state, events, actions);
};


const handleUpdate = function(state, events, actions) {
  return _handleCreateAndUpdate('UPDATE', 'updateOnCloud', state, events, actions);
};

const _handleCreateAndUpdate = function(type, transferMethod, state, events, actions) {
  let promises = [];
  let scheduleIds = Object.keys(events.schedules);
  scheduleIds.forEach((scheduleId) => {
    let eventData = events.schedules[scheduleId];
    let success = () => { actions.push({type: 'FINISHED_' + type + '_SCHEDULES', id: scheduleId })};

    let sphere = state.spheres[eventData.sphereId];
    if (!sphere) { LOG.error("SyncEvents: NO SPHERE"); return success(); }

    let stone = sphere.stones[eventData.stoneId];
    if (!stone) { LOG.error("SyncEvents: NO stone"); return success(); }


    let localSchedule = stone.schedules[scheduleId];
    if (!localSchedule) { LOG.error("SyncEvents: NO localSchedule"); return success(); }

    let payload = {localId: scheduleId, localData: localSchedule, sphereId: eventData.sphereId, stoneId: eventData.stoneId, cloudId: localSchedule.cloudId };
    promises.push(
      transferSchedules[transferMethod](actions, payload)
        .then(() => { success(); })
        .catch((err) => {
          // item does not exist in cloud, so we cant update it. Create it.
          if (type === 'UPDATE' && err.status === 404) {
            return transferSchedules.createOnCloud(actions, payload)
              .then(() => { success(); })
              .catch((err) => { LOG.error("SyncEvents: could not CREATE schedule on cloud", err);})
          }
          else {
            LOG.error("SyncEvents: could not " + type + " schedule on cloud", err);
          }
        })
    );
  });

  return Promise.all(promises);
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

  return Promise.all(promises);
};
