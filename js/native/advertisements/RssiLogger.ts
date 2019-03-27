import { core } from "../../core";

class RssiLoggerClass {
  log = {};

  constructor() {
    core.eventBus.on("iBeaconOfValidCrownstone",       (data) => { this.log[data.stoneId] = { t: new Date().valueOf(), rssi: data.rssi }; });
    core.eventBus.on("AdvertisementOfValidCrownstone", (data) => { this.log[data.stoneId] = { t: new Date().valueOf(), rssi: data.rssi }; })
  }

  getNearestStoneId(reduxIdMap : map, inTheLastNSeconds : number = 2, rssiThreshold = -100) {
    let ids = Object.keys(reduxIdMap);
    let nearestRssi = -1000;
    let nearestId = null;

    let timeThreshold = new Date().valueOf() - 1000*inTheLastNSeconds;
    for (let i = 0; i < ids.length; i++) {
      let item = this.log[ids[i]];
      if (item && item.t >= timeThreshold && item.rssi > nearestRssi && (rssiThreshold === null || item.rssi > rssiThreshold)) {
        nearestRssi = item.rssi;
        nearestId = ids[i]
      }
    }

    return nearestId;
  }

}

export const RssiLogger = new RssiLoggerClass();