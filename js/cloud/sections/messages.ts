
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
      '/Messages/' + messageId + '/delivered',
      { background: background },
      'body'
    );
  },

  readMessage: function (messageId, background) {
    return this._setupRequest(
      'POST',
      '/Messages/' + messageId + '/read',
      { background: background },
      'body'
    );
  },


  getMessage: function (messageId, background = true) {
    return this._setupRequest(
      'GET',
      '/Messages/' + messageId,
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

  getNewMessagesInLocation: function (locationId, background = true) {
    return this._setupRequest(
      'GET',
      '/Spheres/{id}/myNewMessagesInLocation/' + locationId,
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
    return this._setupRequest(
      'PUT',
      '/Messages/{id}/recipients/rel/' + recipientId,
      { background: background }
    );
  },

  deleteMessage: function (messageId, background = true) {
    return this._setupRequest(
      'DELETE',
      '/Spheres/{id}/messages/' + messageId,
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