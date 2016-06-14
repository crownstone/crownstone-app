import { BluenetPromise, Bluenet } from './proxy';
import { NativeModules, NativeAppEventEmitter } from 'react-native';
import { EventBus } from '../util/eventBus'

/* Pairing process:

// crownstone is in low tx mode since it's unclaimed (no keys and no id)

// step1: scan for crownstones
// step2: if the serviceData is only 0, it is in pairing mode
// step3: bond to that crownstone, pin: 000000
// step4: read the mac address from the characteristic
// step5: connect to the cloud and create a stone with the groupId and a mac address to receive keys and ID
// step6: write encryption keys and ID to crownstone
// step7: tell crownstone to start in active mode

 */

// usage:
// let TitleMaker = NativeModules.TitleMaker;
// TitleMaker.get(1, (result) => {
//   this.state.title = result.title;
//   this.setState(this.state);
// });

export class NativeBridgeClass {
  constructor() {


    // Bluenet.reset();
    // Bluenet.initBluenet();
    //
    // Bluenet.startCollectingFingerprint('groupid', 'locationid')
    // setTimeout(() => {Bluenet.finishCollectingFingerprint()},200)
    //
    // console.log("STARTING THE CLASSES",NativeAppEventEmitter);
    //
    // this.BleEvents = new EventBus();
    // this.LocationEvents = new EventBus();
    // this.connectedTo = undefined;
    //
    // var subscription = NativeAppEventEmitter.addListener(
    //   'advertisementData',
    //   (advertisementData) => {
    //     let data = JSON.parse(advertisementData);
    //     this.BleEvents.emit('statusUpdate', {
    //       type: 'statusUpdate',
    //       handle: data.id,
    //       rssi: data.rssi,
    //       message: {
    //         id: 2,
    //         subjectId: 2,
    //         state: 1,
    //         currentUsage: 200,
    //         timestamp: new Date().valueOf(),
    //         totalUsage: 4000,
    //         temperature: 20
    //       }
    //     });
    //   });
    //
    //
    // var subscription = NativeAppEventEmitter.addListener(
    //   'iBeaconAdvertisement',
    //   (iBeaconAdvertisement) => {
    //     let data = JSON.parse(iBeaconAdvertisement)
    //     console.log("iBeaconAdvertisement:",iBeaconAdvertisement);
    //   }//this.bleEvents.emit('statusUpdate', data);}
    // );
    //
    // var subscription = NativeAppEventEmitter.addListener(
    //   'enterGroup',
    //   (enterGroup) => {
    //     console.log("enterGroup:",enterGroup);
    //   }//this.bleEvents.emit('statusUpdate', data);}
    // );
    // var subscription = NativeAppEventEmitter.addListener(
    //   'exitGroup',
    //   (exitGroup) => {console.log("exitGroup:",exitGroup);}//this.bleEvents.emit('statusUpdate', data);}
    // );
    // var subscription = NativeAppEventEmitter.addListener(
    //   'enterLocation',
    //   (enterLocation) => {console.log("enterLocation:",enterLocation);}//this.bleEvents.emit('statusUpdate', data);}
    // );
    // var subscription = NativeAppEventEmitter.addListener(
    //   'exitLocation',
    //   (exitLocation) => {console.log("exitLocation:",exitLocation);}//this.bleEvents.emit('statusUpdate', data);}
    // );
    // var subscription = NativeAppEventEmitter.addListener(
    //   'currentLocation',
    //   (currentLocation) => {console.log("currentLocation:", currentLocation);}//this.bleEvents.emit('statusUpdate', data);}
    // );


    // Don't forget to unsubscribe, typically in componentWillUnmount
    //subscription.remove();

  }

  /**
   * This would be fired on all scanResponses from crownstone
   * @param data
   *        {type:'statusUpdate/setup/dfu', handle: CUUID, RSSI: Number, message: {}}
   *
   *        message statusUpdate:
   *          {
   *            id: (uint16 Number),
   *            subjectId: (uint16 Number),
   *            state: Number,
   *            currentUsage: Number,
   *            timestamp: timeStamp,
   *            totalUsage: Number,
   *            temperature: Number
   *          }
   *        message setup:
   *          {}
   *        message dfu:
   *          {????????}
   */
  scanResponseCallback(data) {
    if (data.type == 'statusUpdate') {
      this.bleEvents.emit('statusUpdate', data);
    }
    else if (data.type === 'setup') {
      this.bleEvents.emit('foundCrownstoneInSetupMode', data);
    }
    else if (data.type === 'dfu') {
      this.bleEvents.emit('foundCrownstoneInDFUMode', data);
    }
  }

  setStatusUpdateCallback() {}
  getStonesInSetup() {}
  getStonesInDFU() {}
  
  connect(id) {return new Promise((resolve, reject) => {
    this.connectedTo = id;    resolve()
  });}

  
  disconnect() {}
  
  getMacAddress() {
    return new Promise((resolve, reject) => {
      resolve("testing")
    });
  }
  makeNoise(id) {}
  writeId(id) {}
  writeEncryptionKeys(adminKey, userKey, guestKey) {}
  startActiveMode() {}
  getState(idArray) {}

}

export const NativeBridge = new NativeBridgeClass();