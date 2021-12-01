import { cloudApiBase } from "./cloudApiBase";

export const hubs = {
  getHubs: function (options : any = {}) {
    return cloudApiBase._setupRequest('GET', '/Spheres/{id}/hubs', options);
  },

  createHub: function (data, background = true) : Promise<cloud_Hub> {
    return cloudApiBase._setupRequest(
      'POST',
      '/Spheres/{id}/Hub',
      { data: data, background: background },
      'query'
    );
  },

  updateHub: function (hubId, data, background = true) : Promise<cloud_Hub> {
    return cloudApiBase._setupRequest(
      'PUT',
      '/Hubs/' + hubId,
      { data: data, background: background },
      'body'
    );
  },

  getHub: function (hubId, background = true) : Promise<cloud_Hub> {
    return cloudApiBase._setupRequest('GET','/Hubs/' + hubId, {background: background});
  },

  deleteHub: function(hubId) {
    return cloudApiBase._setupRequest(
      'DELETE',
      '/Hubs/' + hubId
    );
  }
};