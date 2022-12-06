import {CLOUD} from "../cloud/cloudAPI";
import {core} from "../Core";
import DeviceInfo from "react-native-device-info";
import {LOGw} from "../logging/Log";
import { NATIVE_BUS_TOPICS } from "../Topics";



export class TransformManager {

  sphereId: string;
  myUserId: string;

  isHost: boolean = false;

  user_host_id: string;
  user_host_deviceId: string;

  user_B_id: string;
  user_B_deviceId: string;

  sessionState : TransformSessionState = "UNINITIALIZED";

  transformId: uuid;

  stateUpdate = (sessionState: TransformSessionState) => {}
  collectionUpdate = (collectionCount : number, collectedData: Record<string, rssi>) => {}

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

    this.eventUnsubscriber = core.eventBus.on("transformSseEvent", (data: TransformEvents) => {
      this._handleSseEvent(data);
    });
  }

  _handleSseEvent(event: TransformEvents) {
    if (event.type      !== 'transform') { return; }
    if (event.sessionId !== this.transformId) { return; }
    switch (event.subType) {
      case "sessionRequested":
        this.setSessionState("AWAITING_INVITATION_ACCEPTANCE");
        break
      case "sessionReady": ;
        this.setSessionState("SESSION_WAITING_FOR_COLLECTION_INITIALIZATION");
        break
      case "sessionStopped":
        this.setSessionState("FAILED");
        break
      case "sessionCompleted":
        this.setSessionState("FINISHED");
        this._storeData(event.result);
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



  }

  destroy() {
    CLOUD.endTransformSession(this.sphereId, this.transformId);
    for (let collectionUUID in this.collections) {
      this.collections[collectionUUID].destroy();
    }
    this.eventUnsubscriber();
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
      this.transformId = await CLOUD.requestTransformSession(this.sphereId, this.user_host_id, this.user_host_deviceId, this.user_B_id, this.user_B_deviceId);
      this.setSessionState("AWAITING_SESSION_REGISTRATION");
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform session", err);
      this.setSessionState("FAILED");
    }
  }

  async requestCollectionSession() : Promise<void> {
    try {
      await CLOUD.startTransformCollectionSession(this.sphereId, this.transformId);
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform session", err);
      this.setSessionState("FAILED");
    }
  }

  async joinSession(transformId: uuid) : Promise<void> {
    try {
      await CLOUD.joinTransformSession(this.sphereId, transformId);
      this.transformId = transformId;
      this.setSessionState("AWAITING_SESSION_START");
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to join transform session", err);
      this.setSessionState("FAILED");
    }
  }

  setSessionState(state: TransformSessionState) {
    this.sessionState = state;
    this.stateUpdate(state);
  }

  startCollectionSession(collectionId: uuid) {
    let collection = new TransformCollection(this.sphereId, this.transformId, collectionId);
    collection.errorHandler = (err) => { this.setSessionState("FAILED"); };
    this.collections[collectionId] = collection;
  }

}

export class TransformCollection {

  sphereId:     sphereId;
  transformId:  uuid;
  collectionId: uuid;

  collection : Record<string, number[]> = {};

  dataCount = 0;

  eventUnsubscriber = () => {};

  errorHandler = (err) => {};

  constructor(sphereId: sphereId, transformId: uuid, collectionId: uuid) {
    this.sphereId    = sphereId;
    this.transformId = transformId;
    this.collectionId = collectionId;
  }

  startDataCollection() {
    this.eventUnsubscriber = core.nativeBus.on(NATIVE_BUS_TOPICS.iBeaconAdvertisement, (data: ibeaconPackage[]) => {
      this.collectData(data);
    });
  }

  async submitDataCollection() {
    try {
      CLOUD.postTransformCollectionSessionData(this.sphereId, this.transformId, this.collectionId, this.collection);
    }
    catch (err: any) {
      LOGw.info("TransformManager: Failed to submit data collection", err);
      this.errorHandler(err);
    }
  }

  collectData(data: ibeaconPackage[]) {
    let hasData = false;
    for (let datapoint of data) {
      if (this.sphereId !== datapoint.referenceId) { continue; }
      hasData = true;
      if (this.collection[datapoint.id] === undefined) {
        this.collection[datapoint.id] = [];
      }
      if (datapoint.rssi < 0 && datapoint.rssi > -100) {
        this.collection[datapoint.id].push(datapoint.rssi);
      }
    }

    if (hasData) {
      this.dataCount++;
    }

    if (this.dataCount == 15) {
      this.submitDataCollection();
      this.destroy();
    }
  }

  destroy() {
    this.eventUnsubscriber();
  }



}
