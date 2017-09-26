import { CLOUD } from '../../cloudAPI'
import { Platform } from 'react-native'

/**
 * @param store
 * @returns {Promise.<TResult>|*}
 */
export const syncEvents = function(store, background = true) {
  let state = store.getState();

  let create = state.events.create;
  let update = state.events.update;
  let remove = state.events.remove;
  let special = state.events.special;

  let actions = [];
  let promises = [];

  promises.push(handleCreate(create, actions, background));
  promises.push(handleUpdate(update, actions, background));
  promises.push(handleRemove(remove, actions, background));
  promises.push(handleSpecial(special, actions, background));

  return Promise.all(promises)
    .then(() => {
      if (actions.length > 0) {
        store.batchDispatch(actions);
      }
    })
    .catch((err) => { console.log('syncEvents: error', err)})

};

const handleCreate = function(events, actions, background) {};
const handleUpdate = function(events, actions, background) {};

const handleRemove = function(events, actions, background) {
  let promises = [];
  let messageIds = Object.keys(events.messages);
  messageIds.forEach((messageId) => {
    let payload = events.messages[messageId];
    let success = () => { actions.push({type: 'FINISHED_REMOVE_MESSAGES', id: messageId })};
    promises.push(CLOUD.forSphere(payload.sphereId).deleteMessage(payload.cloudId, background)
      .then(() => { success(); })
      .catch((err) => {
        // already deleted
        if (err.status === 404) { success(); }
      }));
  });

  return Promise.all(promises);
};

const handleSpecial = function(events, actions, background) {
  let promises = [];
  let messageIds = Object.keys(events.messages);
  messageIds.forEach((dbId) => {
    let payload = events.messages[dbId];
    let success = () => { actions.push({type: 'FINISHED_SPECIAL_MESSAGES', id: dbId })};
    switch (payload.specialType) {
      case 'receivedMessage':
        promises.push(CLOUD.receivedMessage(payload.cloudId, background).then(() => { success(); }).catch((err) => {}));
        break;
      case 'readMessage':
        promises.push(CLOUD.readMessage(payload.cloudId, background).then(() => { success(); }).catch((err) => {}));
        break;
    }
  });

  return Promise.all(promises);
};
