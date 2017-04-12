import {APP_NAME} from "../../ExternalConfig";

export const installations = {
  getInstallations: function (options : any = {}) {
    return this._setupRequest('GET', '/Devices/{id}/installations', options);
  },

  createInstallation: function (data, background = true) {
    // return this.getInstallations({background: background})
    //   .then((installations) => {
    //     let installationId = null;
    //     for (let i = 0; i < installations.length; i++) {
    //       if (installations[i].appName === data.appName) {
    //         installationId = installations[i].id;
    //         break;
    //       }
    //     }
    //   })
    return this._setupRequest(
      'POST',
      '/Devices/{id}/installations?appName=' + APP_NAME,
      { data: data, background: background },
      'body'
    );
  },

  updateInstallation: function (installationId, data, background = true) {
    return this._setupRequest(
      'PUT',
      '/AppInstallation/' + installationId,
      { data: data, background: background },
      'body'
    );
  },

  deleteInstallation: function(installationId) {
    return this._setupRequest(
      'DELETE',
      '/Devices/{id}/devices/' + installationId
    );
  }
};