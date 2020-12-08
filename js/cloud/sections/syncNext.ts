/**
 * Created by alex on 25/08/16.
 */
import { cloudApiBase } from "./cloudApiBase";

export const syncNext = {

  syncNext: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      'https://next.crownstone.rocks/api/user/sync',
      {data, background: background},
      'body'
    );
  },

};