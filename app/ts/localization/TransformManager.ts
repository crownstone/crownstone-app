import {CLOUD} from "../cloud/cloudAPI";
import {core} from "../Core";
import DeviceInfo from "react-native-device-info";
import {LOGw} from "../logging/Log";



export class TransformManager {

  sphereId: string;
  userA_id: string;
  userA_deviceId: string;

  userB_id: string;
  userB_deviceId: string;

  sessionState : TransformSessionState = "UNINITIALIZED";

  transformId: uuid;

  stateUpdated = (sessionState: TransformSessionState) => {}

  eventUnsubscriber = () => {}

  constructor(sphereId:string, userB_id:string, userB_deviceId:string) {
    this.sphereId = sphereId;
    this.userA_id = core.store.getState().user.userId;
    this.userA_deviceId = DeviceInfo.getDeviceId();

    this.userB_id = userB_id;
    this.userB_deviceId = userB_deviceId;

    this.eventUnsubscriber = core.eventBus.on("transformSseEvent", (data: TransformEvents) => {
      this._handleSseEvent(data);
    })
  }

  _handleSseEvent(data: TransformEvents) {
    if (data.type      !== 'transform') { return; }
    if (data.sessionId !== this.transformId) { return; }
    switch (data.subType) {
      case "sessionRequested":
        this.setSessionState("AWAITING_INVITATION_ACCEPTANCE");
        break
      case "sessionReady": ;
        this.setSessionState("SESSION_WAITING_FOR_COLLETION_INITIALIZATION");
        break
      case "sessionStopped":
        this.setSessionState("FAILED");
        break
      case "sessionCompleted":
        this.setSessionState("FINISHED");
        break
      case "collectionSessionReady":
        this.setSessionState("READY_FOR_COLLECTION");
        break;
      case "collectionPartiallyCompleted":
        if (data.user.id === this.userA_id) {
          this.setSessionState("WAITING_ON_OTHER_USER");
        }
        else {
          this.setSessionState("WAITING_TO_FINISH_COLLECTION");
        }
        break;
      case "collectionCompleted":
        this.setSessionState("WAITING_FOR_QUALITY_CHECK");

        break;

    }
  }

  cleanup() {
    this.eventUnsubscriber();
  }

  async init() : Promise<void> {
    try {
      this.transformId = await CLOUD.requestTransformSession(this.sphereId, this.userA_id, this.userA_deviceId, this.userB_id, this.userB_deviceId);
      this.setSessionState("AWAITING_SESSION_REGISTRATION");
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform session", err);
      this.setSessionState("FAILED");
    }
  }

  setSessionState(state: TransformSessionState) {
    this.sessionState = state;
    this.stateUpdated(state);
  }

}

export class TransformCollection {

  sphereId:    sphereId;
  transformId: uuid;
  datasetId:   uuid;

  constructor(sphereId: sphereId, transformId: uuid) {
    this.sphereId    = sphereId;
    this.transformId = transformId;
  }

  async init() : Promise<void> {
    try {
      this.datasetId = await CLOUD.startTransformCollectionSession(this.sphereId, this.transformId);
    }
    catch (err : any) {
      LOGw.info("TransformManager: Failed to initialize transform collection session", err);
    }

  }

}