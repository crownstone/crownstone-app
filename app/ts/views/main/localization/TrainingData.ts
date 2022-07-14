import { NativeBus } from "../../../native/libInterface/NativeBus";
import { NATIVE_BUS_TOPICS } from "../../../Topics";
import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";
import { Get } from "../../../util/GetUtil";
import { FingerprintUtil } from "../../../util/FingerprintUtil";

interface trainingData {
  dt: timestamp,
  data: Record<string, rssi>
}

export class TrainingData {
  trainingData  : trainingData[]  = [];

  sortedDeviceIds : string[] = [];
  crownstonesAtCreation : Record<CrownstoneIdentifier, true> = {};

  subscriptions = [];

  startTime: timestamp;
  sphereId:   string;
  locationId: string;

  tick = (amountOfPoints : number) => {};

  type: FingerprintType;

  constructor(sphereId: string, locationId: string, type: FingerprintType) {
    this.sphereId   = sphereId;
    this.locationId = locationId;
    this.type       = type;
  }

  start() {
    this.trainingData          = [];
    this.sortedDeviceIds       = [];
    this.crownstonesAtCreation = {};
    this.startTime             = Date.now();

    let sphere = Get.sphere(this.sphereId);
    if (sphere) {
      for (let stoneId in sphere.stones) {
        let stone = sphere.stones[stoneId];
        this.crownstonesAtCreation[FingerprintUtil.getStoneIdentifierFromStone(stone)] = true;
      }
    }

    this._listen();
  }

  _listen() {
    this.subscriptions.push(NativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, this._collect.bind(this)));
  }

  _collect(data: ibeaconPackage[]) {
    let datapoint = {dt: Date.now() - this.startTime, data: {}};
    for (let point of data) {
      let id = `${point.major}_${point.minor}`;
      datapoint.data[id] = point.rssi;
    }

    this.trainingData.push(datapoint);

    this.tick(this.trainingData.length);
  }


  abort() {
    this.stop();
  }


  stop() {
    this.subscriptions.forEach((unsubscribe) => { unsubscribe(); });
    this.subscriptions = [];
  }

  resume() {
    this._listen();
  }

  store() {
    let fingerprintId = xUtil.getUUID();
    core.store.dispatch({
      type:       'ADD_FINGERPRINT_V2',
      sphereId:   this.sphereId,
      locationId: this.locationId,
      fingerprintId,
      data: {
        type:                  this.type,
        createdOnDeviceType:   FingerprintUtil.getDeviceTypeDescription(), // ${device type string}_${userId who collected it}
        crownstonesAtCreation: this.crownstonesAtCreation, // maj_min as id representing the Crownstone.
        data:                  this.trainingData,
      }
    });
  }
}
