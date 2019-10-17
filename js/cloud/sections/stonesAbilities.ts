import { cloudApiBase } from "./cloudApiBase";

export const stonesAbilities = {

  getStoneAbilities: function(background = true) {
    return cloudApiBase._setupRequest(
      'GET',
      '/Stones/{id}/abilities/',
      {background: background},
      'body'
    );
  },

  setStoneAbilities: function(data: any, background = true) {
    return cloudApiBase._setupRequest(
      'PUT',
      '/Stones/{id}/abilities/',
      {data: data, background: background},
      'body'
    );
  },

};