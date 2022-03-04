import { NativeModules, NativeEventEmitter } from 'react-native';
import { LOGe, LOGi } from '../../logging/Log'
import { DISABLE_NATIVE } from "../../ExternalConfig";
import { xUtil } from "../../util/StandAloneUtil";
import { Bluenet } from "./Bluenet";
import { EventBusClass } from '../../util/EventBus';
import {BridgeConfig} from "./BridgeConfig";
import { NATIVE_BUS_TOPICS } from "../../Topics";

let BluenetEmitter = { addListener: (a,b) => { return {remove:() => {}} }};

if (DISABLE_NATIVE !== true && BridgeConfig.mockBluenet !== true) {
  BluenetEmitter = new NativeEventEmitter(NativeModules.BluenetJS);
}

export class NativeBusClass {
  topics: NativeBusTopics;
  refMap: any;

  _registeredEvents = {};
  
  subscribersForNearest = 0;
  subscribersForUnverified = 0;

  _count = 0;
  _id : string;
  _type = 'NativeBus'
  _subscriptionCount = {};

  _mirrorBus : EventBusClass;

  constructor() {
    this._id = xUtil.getUUID();
    this._subscriptionCount = {};
    this.topics = NATIVE_BUS_TOPICS;

    this.refMap = {};
    Object.keys(this.topics).forEach((key) => {
      this.refMap[this.topics[key]] = true;
    });

    this._mirrorBus = new EventBusClass("NativeBusMirror");
  }

  on(topic, callback) {
    if (!(topic)) {
      LOGe.event("Attempting to subscribe to undefined topic:", topic);
      return;
    }
    if (!(callback)) {
      LOGe.event("Attempting to subscribe without callback to topic:", topic);
      return;
    }
    if (this.refMap[topic] === undefined) {
      LOGe.event("Attempting to subscribe to a topic that does not exist in the native bus.", topic);
      return;
    }

    // if required, enable topics we dont use often
    this._checkTopicAvailability(topic);

    // initialize the reference map for logging
    if (this._subscriptionCount[topic] === undefined) {
      this._subscriptionCount[topic] = 0;
    }

    this._subscriptionCount[topic] += 1;
    this._count += 1;
    LOGi.event(`Subscribed to topic[${topic}], topicCount:[${this._subscriptionCount[topic]}], totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);

    // generate unique id
    let id = xUtil.getUUID();

    // subscribe to native event.
    let subscription = BluenetEmitter.addListener(topic, callback);
    let clearMirror  = this._mirrorBus.on(topic, callback);

    let removeCallback = () => {
      if (this._registeredEvents[id]) {
        this._subscriptionCount[topic] -= 1;
        this._count -= 1;
        LOGi.event(`Unsubscribed from topic[${topic}], topicCount:[${this._subscriptionCount[topic]}], totalCount:[${this._count}] type:[${this._type}] busId:[${this._id}]`);
        subscription.remove();

        // disable unused topics if possible.
        this._cleanupTopicAvailability(topic);

        this._registeredEvents[id] = undefined;
        delete this._registeredEvents[id];
        clearMirror();
      }
    };

    this._registeredEvents[id] = removeCallback;

    // return unsubscribe function.
    return removeCallback;
  }

  /**
   * Used for mocking the nativebus.
   * @param topic
   * @param data
   */
  emit(topic, data) {
    this._mirrorBus.emit(topic, data);
  }

  clearAllEvents() {
    LOGi.info("Clearing all native event listeners.");
    this._count = 0;
    LOGi.event(`EventBus: Clearing all event listeners.  busId:${this._id}`);
    this._subscriptionCount = {}
    let keys = Object.keys(this._registeredEvents);
    keys.forEach((key) => {
      if (typeof this._registeredEvents[key] === 'function') {
        this._registeredEvents[key]();
      }
    });
    this._mirrorBus.clearAllEvents()
  }


  _checkTopicAvailability(topic) {
    if (topic === this.topics.nearest || topic === this.topics.nearestSetup) {
      if (this.subscribersForNearest === 0) {
        Bluenet.subscribeToNearest();
      }
      this.subscribersForNearest++;
    }
    else if (topic === this.topics.crownstoneAdvertisementReceived || topic === this.topics.unverifiedAdvertisementData) {
      if (this.subscribersForUnverified === 0) {
        Bluenet.subscribeToUnverified();
      }
      this.subscribersForUnverified++;
    }
  }

  _cleanupTopicAvailability(topic) {
    if (topic === this.topics.nearest || topic === this.topics.nearestSetup) {
      if (this.subscribersForNearest > 0) {
        this.subscribersForNearest--;
      }

      if (this.subscribersForNearest === 0) {
        Bluenet.unsubscribeNearest();
      }
    }
    else if (topic === this.topics.crownstoneAdvertisementReceived || topic === this.topics.unverifiedAdvertisementData) {
      if (this.subscribersForUnverified > 0) {
        this.subscribersForUnverified--;
      }

      if (this.subscribersForUnverified === 0) {
        Bluenet.unsubscribeUnverified();
      }
    }
  }
}

export const NativeBus = new NativeBusClass();


/** type defs **/

//
// type type_beacon = {
//   id        : string,
//   uuid      : string,
//   major     : number,
//   minor     : number,
//   rssi      : number,
//   referenceId : string,
// }


/** end of type **/
