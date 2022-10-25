import { cloudApiBase } from "./cloudApiBase";

export const cloudHi = {
  hi: function (endpoint: string) {
    return cloudApiBase._setupRequest('GET', endpoint + "/hi").then((result) => { return JSON.parse(result); });
  },
};
