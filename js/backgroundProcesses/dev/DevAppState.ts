import { xUtil } from "../../util/StandAloneUtil";
import { EncryptionManager } from "../../native/libInterface/Encryption";

export const TESTING_SPHERE_NAME = "Dev app Sphere"

class DevAppStateClass {

  sphereId = null;
  name = null;
  iBeaconUUID = null;
  uid = null
  meshAccessAddress = null;

  ADMIN_KEY            = null;
  MEMBER_KEY           = null;
  BASIC_KEY            = null;
  LOCALIZATION_KEY     = null;
  SERVICE_DATA_KEY     = null;
  MESH_NETWORK_KEY     = null;
  MESH_APPLICATION_KEY = null;

  initialized = false;

  init() {
    if (this.initialized === false) {
      this.initialized = true;

      this.sphereId = "DEV_APP_SPHERE_ID";

      this.name = TESTING_SPHERE_NAME;
      this.iBeaconUUID = "1843423e-e175-4af0-a2e4-31e32f729a8a";
      this.uid = 1;
      this.meshAccessAddress = "4f745905";

      this.ADMIN_KEY = "adminKeyForCrown";
      this.MEMBER_KEY = "memberKeyForHome";
      this.BASIC_KEY = "guestKeyForOther";
      this.LOCALIZATION_KEY = "localizationKeyX";
      this.SERVICE_DATA_KEY = "guestKeyForOther";
      this.MESH_NETWORK_KEY = "meshKeyForStones";
      this.MESH_APPLICATION_KEY = "meshAppForStones";

      let devKeySet = {
        adminKey: "adminKeyForCrown",
        memberKey: "memberKeyForHome",
        basicKey: "guestKeyForOther",
        localizationKey: "localizationKeyX",
        serviceDataKey: "guestKeyForOther",
        referenceId: this.sphereId,
        iBeaconUuid: this.iBeaconUUID,
      };

      EncryptionManager.clearAdditionalKeysets();
      EncryptionManager.loadAdditionalKeyset(devKeySet);
    }
  }

  getSetupData() {
    return {
      crownstoneId:       Math.floor(Math.random()*255),
      sphereId:           this.uid,
      adminKey:           this.ADMIN_KEY,
      memberKey:          this.MEMBER_KEY,
      basicKey:           this.BASIC_KEY,
      localizationKey:    this.LOCALIZATION_KEY,
      serviceDataKey:     this.SERVICE_DATA_KEY,
      meshNetworkKey:     this.MESH_NETWORK_KEY,
      meshApplicationKey: this.MESH_APPLICATION_KEY,
      meshDeviceKey:      "aStoneKeyForMesh",
      meshAccessAddress:  this.meshAccessAddress,
      ibeaconUUID:        this.iBeaconUUID,
      ibeaconMajor:       Math.floor(Math.random()*60000),
      ibeaconMinor:       Math.floor(Math.random()*60000),
    }
  }
}

export const DevAppState = new DevAppStateClass();