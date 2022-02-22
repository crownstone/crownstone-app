import fetch from 'node-fetch';

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json'
};

export class SphereMockInterface {

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
    let result = await fetch('http://localhost:3100/functionCalls?function=trackIBeacon', {
      method: "GET",
      headers: {headers}
    });

    let json = await result.json();
    console.log("JSON FROM LOAD SPHERE DATA", json)
    for (let functionCall of json.bluenet) {
      if (functionCall.args[0] === this.ibeaconUuid) {
        this.sphereLocalId = functionCall.args[1];
      }
    }

    for (let resolver of this.resolvers) {
      resolver();
    }

    console.log("Initialized sphereLocalId", this.sphereLocalId, 'ibeaconUuid', this.ibeaconUuid, 'sphereCloudId',this.sphereCloudId)

    this.resolvers = [];
  }

  waitForInitialization() : Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.resolvers.push(resolve);
    })
  }


  sendAdvertisement() {

  }
}
