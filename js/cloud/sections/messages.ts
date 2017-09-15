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

  getMessageInSphere: function (background = true) {
    // return this._setupRequest(
    //   'POST',
    //   '/Devices/{id}/installations?appName=' + APP_NAME,
    //   { background: background },
    //   'body'
    // );
  },

  getMessageInLocation: function (installationId, data, background = true) {
    // return this._setupRequest(
    //   'PUT',
    //   '/AppInstallations/' + installationId,
    //   { data: data, background: background },
    //   'body'
    // );
  },

  deleteMessage: function (installationId, background = true) {
    // return this._setupRequest('GET','/AppInstallations/' + installationId, {background: background});
  },

  deleteAllMessages: function(sphereId) {
    // return this._setupRequest(
    //   'DELETE',
    //   '/Devices/{id}/devices/' + installationId
    // );
  }
};