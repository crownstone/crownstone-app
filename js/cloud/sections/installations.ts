import {APP_NAME} from "../../ExternalConfig";
import { cloudApiBase } from "./cloudApiBase";

export const installations = {
  getInstallations: function (options : any = {}) {
    return cloudApiBase._setupRequest('GET', '/Devices/{id}/installations', options);
  },

  createInstallation: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      '/Devices/{id}/installations?appName=' + APP_NAME,
      { data: data, background: background },
      'body'
    );
  },

  updateInstallation: function (installationId, data, background = true) {
    return cloudApiBase._setupRequest(
      'PUT',
      '/AppInstallations/' + installationId,
      { data: data, background: background },
      'body'
    );
  },

  getInstallation: function (installationId, background = true) {
    return cloudApiBase._setupRequest('GET','/AppInstallations/' + installationId, {background: background});
  },

  deleteInstallation: function(installationId) {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Devices/{id}/devices/' + installationId
    );
  }
};