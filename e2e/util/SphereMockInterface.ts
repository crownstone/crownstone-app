import fetch from 'node-fetch';

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

export class SphereMockInterface {

  activeSphere = false;

  ibeaconUuid:   string;
  sphereLocalId: string;
  sphereCloudId: string;

  resolvers = [];

  constructor(sphereCloudId: string, ibeaconUuid: string) {
    this.sphereCloudId = sphereCloudId;
    this.ibeaconUuid   = ibeaconUuid;
  }

  /**
   * Load important sphere properties into the mock interface
   */
  async loadSphereData() {
    let calls = await this._getCalledMethods('trackIBeacon');
    for (let functionCall of calls.bluenet) {
      if (functionCall.args[0] === this.ibeaconUuid) {
        this.sphereLocalId = functionCall.args[1];
        break;
      }
    }

    for (let resolver of this.resolvers) {
      resolver();
    }

    this.resolvers = [];
  }

  waitForInitialization() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.resolvers.push(resolve);
    })
  }

  async checkForActive() : Promise<boolean> {
    let calls = await this._getCalledMethods('setLocationState');
    for (let functionCall of calls.bluenet) {
      if (this.sphereLocalId === functionCall.args[4]) {
        this.activeSphere = true;
        return true;
      }
    }
    this.activeSphere = false;
    return false;
  }


  sendAdvertisement() {

  }

  async _getCalledMethods(methodName) {
    let result = await fetch(`http://localhost:3100/functionCalls?function=${methodName}`, {
      method: "GET",
      headers: {headers}
    });

    let json = await result.json();
    return json;
  }
}
