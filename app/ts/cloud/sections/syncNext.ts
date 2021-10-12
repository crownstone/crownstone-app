/**
 * Created by alex on 25/08/16.
 */
import { cloudApiBase } from "./cloudApiBase";
import { MapProvider } from "../../backgroundProcesses/MapProvider";

const url = 'https://next.crownstone.rocks'
// const url = 'http://10.27.8.224:3050'

export const syncNext = {

  syncNext: function (data, background = true) {
    return cloudApiBase._setupRequest(
      'POST',
      url + '/api/sync',
      {data, background: background},
      'body'
    );
  },

  syncNextSphere: function (localSphereId: string, data, background = true) {
    let cloudSphereId = MapProvider.local2cloudMap.spheres[localSphereId] || localSphereId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      url + `/api/spheres/${cloudSphereId}/sync`,
      {data, background: background},
      'body'
    );
  },

  syncNextStone: function (localStoneId: string, data, background = true) {
    let cloudStoneId = MapProvider.local2cloudMap.stones[localStoneId] || localStoneId; // the OR is in case a cloudId has been put into this method.
    return cloudApiBase._setupRequest(
      'POST',
      url + `/api/stones/${cloudStoneId}/sync`,
      {data, background: background},
      'body'
    );
  },

};