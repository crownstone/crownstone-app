import {APP_NAME} from "../../ExternalConfig";

export const messages = {

  createMessage: function (data, background) {
    return this._setupRequest(
      'POST',
      '/Spheres/{id}/messages',
      { data: data, background: background },
      'body'
    );
  },

  receivedMessage: function (messageId, background) {
    return this._setupRequest(
      'POST',
      '/Messages/' + messageId,
      { background: background },
      'body'
    );
  },

  readMessage: function (messageId, background) {
    return this._setupRequest(
      'POST',
      '/Messages/' + messageId,
      { background: background },
      'body'
    );
  },


  getMessage: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Messages/{id}',
      { data: {filter:{"include":{"relation":["recipients","delivered","read"]}}}, background: background }
    );
  },

  getNewMessagesInSphere: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Sphere/{id}/myNewMessages',
      { background: background }
    );
  },

  getAllMessagesInSphere: function (background = true) {
    return this._setupRequest(
      'GET',
      '/Sphere/{id}/myMessages',
      { background: background }
    );
  },

  getNewMessagesInLocation: function (locationId, background = true) {
    return this._setupRequest(
      'GET',
      '/Sphere/{id}/myNewMessagesInLocation/' + locationId,
      { background: background }
    );
  },

  getActiveMessages: function(background = true) {
    return this._setupRequest(
      'GET',
      '/Sphere/{id}/myActiveMessages/',
      { background: background }
    );
  },

  addRecipient: function(recipientId, background = true) {
    return this._setupRequest(
      'PUT',
      '/Messages/{id}/recipients/rel/' + recipientId,
      { background: background }
    );
  },

  deleteMessage: function (messageId, background = true) {
    return this._setupRequest(
      'DELETE',
      '/Sphere/{id}/messages/' + messageId,
      { background: background }
    );
  },

  deleteAllMessages: function (background = true) {
    return this._setupRequest(
      'DELETE',
      '/Sphere/{id}/deleteAllMessages',
      { background: background }
    );
  },
};