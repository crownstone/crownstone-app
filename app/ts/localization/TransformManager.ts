import {CLOUD} from "../cloud/cloudAPI";
import {core} from "../Core";
import DeviceInfo from "react-native-device-info";
import {LOGw} from "../logging/Log";
import { NATIVE_BUS_TOPICS } from "../Topics";
import {Scheduler} from "../logic/Scheduler";
import {Languages} from "../Languages";
import { TransformUtil } from "../util/TransformUtil";


function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TransformManager", key)(a,b,c,d,e);
}


export const TRANSFORM_MIN_SAMPLE_THRESHOLD = 8;
export const TRANSFORM_MIN_SESSION_COUNT = 3;

export class TransformManager {

  sphereId: string;
  myUserId: string;

  isHost: boolean = false;

  user_host_id: string;
  user_host_deviceId: string;

  user_B_id: string;
  user_B_deviceId: string;

  sessionState : TransformSessionState = "UNINITIALIZED";

  transformId: uuid = null;

  stateUpdate        = (sessionState: TransformSessionState, errorMessage?: string) => {}
  collectionUpdate   = (collection: Record<string, number[]>, dataCount: number) => {}
  collectionFinished = (recommendation: CollectionState, collectionsFinished: number, stats: {A:TransformStats,B:TransformStats}) => {}

  waitForInvitationTimeout = () => {};

  collections = {};

  eventUnsubscriber = () => {}

  constructor(sphereId:string, hostUserId:string, hostUserDevice:string, otherUser:string, otherUserDevice:string, transformId?:uuid) {
    this.sphereId = sphereId;
    this.myUserId = core.store.getState().user.userId;

    this.user_host_id = hostUserId;
    this.user_host_deviceId = hostUserDevice;

    this.user_B_id = otherUser;
    this.user_B_deviceId = otherUserDevice;

    this.transformId = transformId ?? null;

    this.isHost = (this.myUserId === this.user_host_id && DeviceInfo.getDeviceId() === this.user_host_deviceId);

    this.init();
  }

  init() {
    this.eventUnsubscriber = core.eventBus.on("transformSseEvent", (data: TransformEvents) => {
      this._handleSseEvent(data);
    });
  }

  async _handleSseEvent(event: TransformEvents) {
    if (event.type      !== 'transform') { return; }
    if (event.sessionId !== this.transformId) { return; }
    switch (event.subType) {
      case "sessionRequested":
        this.setSessionState("AWAITING_INVITATION_ACCEPTANCE");
        break
      case "sessionReady": ;
        this.waitForInvitationTimeout();
        this.setSessionState("SESSION_WAITING_FOR_COLLECTION_INITIALIZATION");
        break
      case "sessionStopped":
        this.setSessionState("FAILED");
        break
      case "sessionCompleted":
        // extra timeout to give the ui time to update.
        this.eventUnsubscriber();
        await Scheduler.delay(750);
        this.setSessionState("FINALIZING")
        await Scheduler.delay(750);
        this._storeData(event.result);
        await Scheduler.delay(1500)
        this.setSessionState("FINISHED");
        break
      case "collectionSessionReady":
        this.setSessionState("COLLECTION_STARTED");
        this.startCollectionSession(event.collectionId)
        break;
      case "collectionPartiallyCompleted":
        if (event.user.id === this.myUserId) {
          this.setSessionState("WAITING_ON_OTHER_USER");
        }
        else {
          this.setSessionState("WAITING_TO_FINISH_COLLECTION");
        }
        break;
      case "collectionCompleted":
        this.setSessionState("COLLECTION_COMPLETED");
        // check if we need more data.
        this._checkCollectionQuality(event.quality);
        break;

    }
  }

  _storeData(data: TransformResult) {
    let actions = [];
    for (let i = 0; i < data.length; i++) {
      let result = data[i];
      actions.push({type:'ADD_TRANSFORM', transformId: result.sessionId + "_" + i, data: {
        fromDevice: result.fromDevice,
        toDevice: result.toDevice,
        fromUser: result.fromUser,
        toUser: result.toUser,
        transform: result.transform
      }});
    }
    // removing all processed fingerprints will trigger a reprocessing. This will take the transforms into account.
    // the FingerprintManager for this sphere will take care of this.
    core.store.batchDispatch(actions);
  }

  _checkCollectionQuality(quality: {userA: Record<string,number>, userB: Record<string,number>}) {
    // if the quality if not enough for either user, suggest a new collection.
    // if the quality is good enough, ensure we have at least 2 collections.
    // if we have had 5 collections already, allow the user to wrap up the transform.
    let userA = quality.userA;
    let userB = quality.userB;


    let buckets = [ -50, -55, -60, -65, -70, -75, -80, -85, -90 ];

    let closeBuckets = [-50, -55, -60, -65];
    let mediumBuckets = [-70, -75];
    let farBuckets = [-80, -85, -90];

    // check how many datapoints are in the close buckets
    let closeCountA = 0;
    let closeCountB = 0;
    for (let i = 0; i < closeBuckets.length; i++) {
      let bucket = closeBuckets[i];
      if (userA[bucket] !== undefined) { closeCountA += userA[bucket]; }
      if (userB[bucket] !== undefined) { closeCountB += userB[bucket]; }
    }

    // check how many datapoints are in the medium buckets
    let mediumCountA = 0;
    let mediumCountB = 0;
    for (let i = 0; i < mediumBuckets.length; i++) {
      let bucket = mediumBuckets[i];
      if (userA[bucket] !== undefined) { mediumCountA += userA[bucket]; }
      if (userB[bucket] !== undefined) { mediumCountB += userB[bucket]; }
    }

    // check how many datapoints are in the far buckets
    let farCountA = 0;
    let farCountB = 0;
    for (let i = 0; i < farBuckets.length; i++) {
      let bucket = farBuckets[i];
      if (userA[bucket] !== undefined) { farCountA += userA[bucket]; }
      if (userB[bucket] !== undefined) { farCountB += userB[bucket]; }
    }

    // check how many datapoints are in all the buckets
    let totalCountA = 0;
    let totalCountB = 0;
    for (let i = 0; i < buckets.length; i++) {
      let bucket = buckets[i];
      if (userA[bucket] !== undefined) { totalCountA += userA[bucket]; }
      if (userB[bucket] !== undefined) { totalCountB += userB[bucket]; }
    }

    // average the count between user A and user B
    let averageCount = (totalCountA + totalCountB) / 2;
    let averageCloseCount = (closeCountA + closeCountB) / 2;
    let averageMediumCount = (mediumCountA + mediumCountB) / 2;
    let averageFarCount = (farCountA + farCountB) / 2;

    // if most of the data is the close buckets, recommend FURTHER AWAY
    // if most of the data is the medium buckets, recommend DIFFERENT
    // if most of the data is the far buckets, recommend CLOSER

    // if all buckets have at least 10 datapoints, recommend FINISH
    let amountOfCompletedSessions = Object.keys(this.collections).length;

    // only the host can end the session.
    if (this.isHost) {
      if (amountOfCompletedSessions >= TRANSFORM_MIN_SESSION_COUNT) {
        if (averageCloseCount > TRANSFORM_MIN_SAMPLE_THRESHOLD && averageMediumCount > TRANSFORM_MIN_SAMPLE_THRESHOLD && averageFarCount > TRANSFORM_MIN_SAMPLE_THRESHOLD) {
          // added a delay to ensure that the collection promise can resolve.
          setTimeout(() => {
            this.finalizeSession();
          }, 1000);
          return;
        }
      }
    }

    let stats = {
      A: {close: closeCountA, mid: mediumCountA, far: farCountA, total: totalCountA},
      B: {close: closeCountB, mid: mediumCountB, far: farCountB, total: totalCountB},
    }

    if (averageCloseCount > TRANSFORM_MIN_SAMPLE_THRESHOLD) {
      this.collectionFinished("FURTHER_AWAY", Object.keys(this.collections).length, stats)
    }
    else if (averageFarCount > TRANSFORM_MIN_SAMPLE_THRESHOLD) {
      this.collectionFinished("CLOSER", Object.keys(this.collections).length, stats)
    }
    else {
      this.collectionFinished("DIFFERENT", Object.keys(this.collections).length, stats)
    }
  }

  destroy() {
    this.sessionState = "UNINITIALIZED";
    this.collections = {};
    this.eventUnsubscriber();
    CLOUD.endTransformSession(this.sphereId, this.transformId);
    for (let collectionUUID in this.collections) {
      this.collections[collectionUUID].destroy();
    }
    this.transformId = null;
  }

  async start() : Promise<void> {
    if (this.isHost) {
      await this.requestTransformSession();
    }
    else {
      await this.joinSession(this.transformId);
    }
  }

  async requestTransformSession() : Promise<void> {
    try {
      this.setSessionState("AWAITING_SESSION_REGISTRATION");
      this.transformId = await CLOUD.requestTransformSession(this.sphereId, this.user_host_deviceId, this.user_B_id, this.user_B_deviceId);
      this.waitForInvitationTimeout = Scheduler.setTimeout(() => {
        this.setSessionState("FAILED", lang("Timeout_while_waiting_for"));
      }, 60000);
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform session", err);
      this.setSessionState("FAILED", err.message);
    }
  }

  async requestCollectionSession() : Promise<void> {
    try {
      this.setSessionState("SESSION_WAITING_FOR_COLLECTION_START");
      await CLOUD.startTransformCollectionSession(this.sphereId, this.transformId);

    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform session", err);
      this.setSessionState("FAILED", err.message);
    }
  }

  async joinSession(transformId: uuid) : Promise<void> {
    try {
      this.setSessionState("AWAITING_SESSION_START");
      await CLOUD.joinTransformSession(this.sphereId, transformId);
      this.transformId = transformId;
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to join transform session", err);
      this.setSessionState("FAILED", lang("Request_not_available_any"));
    }
  }

  async finalizeSession() : Promise<void> {
    try {
      await CLOUD.finalizeTransformSession(this.sphereId, this.transformId);
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to finalize transform session", err);
      this.setSessionState("FAILED", err.message);
    }
  }

  setSessionState(state: TransformSessionState, errorMessage: string = "") {
    this.sessionState = state;
    this.stateUpdate(state, errorMessage);
  }

  startCollectionSession(collectionId: uuid) {
    let collection = new TransformCollection(this.sphereId, this.transformId, collectionId);
    collection.errorHandler = (err, errorMessage) => { this.setSessionState("FAILED", errorMessage); };
    collection.dataListener = (data, dataCount) => { this.collectionUpdate(data, dataCount); };
    this.collections[collectionId] = collection;
  }

}

export class TransformCollection {

  sphereId:     sphereId;
  transformId:  uuid;
  collectionId: uuid;

  collection : Record<string, rssi[]> = {};

  dataCount = 0;

  eventUnsubscriber = () => {};

  errorHandler = (err, errorMessage) => {};
  dataListener = (collection: Record<string, number[]>, dataCount: number) => {};

  constructor(sphereId: sphereId, transformId: uuid, collectionId: uuid) {
    this.sphereId    = sphereId;
    this.transformId = transformId;
    this.collectionId = collectionId;

    this.startDataCollection();
  }

  startDataCollection() {
    this.eventUnsubscriber = core.nativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, (data: ibeaconPackage[]) => {
      this.collectData(data);
    });
  }

  async submitDataCollection() {
    try {
      let averagedData = TransformUtil.processData(this.collection);
      await CLOUD.postTransformCollectionSessionData(this.sphereId, this.transformId, this.collectionId, DeviceInfo.getDeviceId(), averagedData);
    }
    catch (err: any) {
      LOGw.info("TransformManager: Failed to submit data collection", err);
      this.errorHandler(err, err.message);
      this.destroy();
    }
  }

  collectData(data: ibeaconPackage[]) {
    let hasData = false;
    for (let datapoint of data) {
      if (this.sphereId !== datapoint.referenceId) { continue; }
      if (this.collection[datapoint.id] === undefined) {
        this.collection[datapoint.id] = [];
      }
      if (datapoint.rssi < 0 && datapoint.rssi > -100) {
        this.collection[datapoint.id].push(datapoint.rssi);
        hasData = true;
      }
    }

    if (hasData) {
      this.dataCount++;
    }


    this.dataListener(this.collection, this.dataCount)

    let enoughData = true;
    for (let id in this.collection) {
      if (this.collection[id].length < 12) {
        enoughData = false;
      }
    }

    if (this.dataCount == 20 || this.dataCount >= 12 && enoughData) {
      this.submitDataCollection();
      this.destroy();
    }
  }

  destroy() {
    this.eventUnsubscriber();
    this.dataListener = () => {};
    this.errorHandler = () => {};
    this.dataCount = 0;
    this.collection = {}
  }



}
