
import {MapProvider} from "../../backgroundProcesses/MapProvider";

export const messages = {

  createMessage: function (data, background) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/messages',
      { data: data, background: background },
      'body'
    );
  },

  receivedMessage: function (localMessageId, background) {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'POST',
      '/Messages/' + cloudMessageId + '/delivered',
      { background: background },
      'body'
    );
  },

  readMessage: function (localMessageId, background) {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'POST',
      '/Messages/' + cloudMessageId + '/read',
      { background: background },
      'body'
    );
  },


  getMessage: function (localMessageId, background = true) {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Messages/' + cloudMessageId,
      { data: {filter:{"include":["recipients","delivered","read"]}}, background: background }
    );
  },

  getNewMessagesInSphere: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/myNewMessages',
      { background: background }
    );
  },

  getAllMessagesInSphere: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/myMessages',
      { background: background }
    );
  },

  getNewMessagesInLocation: function (localLocationId, background = true) {
    let cloudLocationId = MapProvider.local2cloudMap.locations[localLocationId] || localLocationId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/myNewMessagesInLocation/' + cloudLocationId,
      { background: background }
    );
  },

  getActiveMessages: function(background = true) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/myActiveMessages/',
      {background : background}
    );
  },

  addRecipient: function(recipientId, background = true) {
    // recipientId is a userId, these are the same in the cloud as locally.
    return this._setupRequest(
      'PUT',
      '/Messages/{id}/recipients/rel/' + recipientId,
      { background: background }
    );
  },

  deleteMessage: function (localMessageId, background = true) {
    let cloudMessageId = MapProvider.local2cloudMap.messages[localMessageId] || localMessageId; // the OR is in case a cloudId has been put into this method.
    return this._setupRequest(
      'DELETE',
      '/Spheres/{id}/messages/' + cloudMessageId,
      { background: background }
    );
  },

  deleteAllMessages: function (background = true) {
    return this._setupRequest(
      'DELETE',
      '/Spheres/{id}/deleteAllMessages',
      { background: background }
    );
  },
};