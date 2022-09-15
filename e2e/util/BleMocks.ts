import fetch from 'node-fetch';
import { AdvertisementGenerator } from "./AdvertismentGenerator";
import { NATIVE_BUS_TOPICS } from "../../app/ts/Topics";
import { bluenetPromise_targetedMethods } from "../../tests/__testUtil/mocks/bluenetPromiseWrapper.mock";
import { iBeaconGenerator } from "./iBeaconGenerator";
const sha1 = require('sha-1');

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'Authorization': null,
};


export class BleMocks {
  ibeaconGenerator: iBeaconGenerator;

  constructor() {
    this.ibeaconGenerator = new iBeaconGenerator();
  }


  loadSphereData(sphere) {
    this.ibeaconGenerator.loadSphere(sphere);
  }


  async sendIBeaconMessage(sphereId: string, locationId: string = null) {
    let payload = this.ibeaconGenerator.generateIBeaconMessage(sphereId, locationId);
    await this._sendEvent(NATIVE_BUS_TOPICS.iBeaconAdvertisement, payload);
  }


  for(handle: string) : { succeed: MockedLib, fail: MockedLibError, disconnectEvent: () => Promise<void> } {
    return {
      succeed: this._getSuccessMethods(handle),
      fail:    this._getErrorMethods(handle),
      disconnectEvent: async () => {
        return this._sendDisconnectEvent(handle);
      }
    }
  }

  _getSuccessMethods(handle) : MockedLib {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = async (data?: any) => {
        await this.resolve(handle, method, data);
        if (method === 'phoneDisconnect' || method === 'disconnectCommand') {
          await this._sendDisconnectEvent(handle);
        }
      }
    }
    // @ts-ignore
    return res;
  }

  _getErrorMethods(handle) : MockedLibError {
    let res = {};
    for (let method of bluenetPromise_targetedMethods) {
      res[method] = async (error?: any) => {
        await this.fail(handle, method, error);
      }
    }
    // @ts-ignore
    return res;
  }

  async resolve(handle: string, functionName: string, data: any, timeout = 3) {
    let result = await fetch(
      'http://localhost:3100/success',
      {
        method:"POST",
        headers,
        body: JSON.stringify({handle, function: functionName, data, timeout})
      }
    );

    let textResult = await result.text();

    if (textResult !== "SUCCESS") {
      throw new Error(`BluenetPromise resolvePromise error CALL_DOES_NOT_EXIST for ${handle} ${functionName}`)
    }
  }

  async fail(handle: string, functionName: string, error: any, timeout = 3) {
    let result = await fetch(
      'http://localhost:3100/fail',
      {
        method:"POST",
        headers,
        body: JSON.stringify({handle, function: functionName, error, timeout})
      }
    );

    let textResult = await result.text();
    if (textResult !== "SUCCESS") {
      throw new Error(`BluenetPromise failPromise error CALL_DOES_NOT_EXIST for ${handle} ${functionName}`)
    }
  }

  async sendSetupAdvertisment(handle: string, rssi: number = -70) {
    await this._sendEvent(
      NATIVE_BUS_TOPICS.setupAdvertisement,
      AdvertisementGenerator.setupAdvertisement(handle, rssi)
    );
  }


  async sendGenericAdvertisement(handle: string, rssi: number = -70) {
    await this._sendEvent(
      NATIVE_BUS_TOPICS.crownstoneAdvertisementReceived,
      AdvertisementGenerator.genericAdvertisement(handle, rssi)
    );
  }

  async sendSetupProgress(progress: number) {
    await this._sendEvent(
      NATIVE_BUS_TOPICS.setupProgress,
      progress
    );
  }

  async _sendEvent(topic: string, data: any) {
    let result = await fetch(
      'http://localhost:3100/event',
      {
        method:"POST",
        headers,
        body: JSON.stringify({
          topic: topic,
          data: data
        })
      }
    );
  }

  async _sendDisconnectEvent(handle: string) {
    let result = await fetch(
      'http://localhost:3100/event',
      {
        method:"POST",
        headers,
        body: JSON.stringify({
          topic: NATIVE_BUS_TOPICS.disconnectedFromPeripheral,
          data: handle
        })
      }
    );
  }
}
