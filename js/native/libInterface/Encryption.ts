import { BluenetPromiseWrapper } from "./BluenetPromise";
import { Bluenet } from "./Bluenet";
import { core } from "../../core";
import { LOGe } from "../../logging/Log";
import { KEY_TYPES } from "../../Enums";


class EncryptionManagerClass {
  _initialized : boolean = false;
  _uuid : string;
  _readyForLocalization = false;

  init() {
    if (this._initialized === false) {
      this._initialized = true;

      core.eventBus.on("sphereCreated",        () => { this.setKeySets(); });
      core.eventBus.on("KEYS_UPDATED",         () => { this.setKeySets(); });
      core.eventBus.on('userLoggedInFinished', () => { this.setKeySets(); });
      core.eventBus.on("databaseChange",       (data) => {
        let change = data.change;
        if (change.changeSpheres || change.updateActiveSphere) {
          this.setKeySets();
        }
      });

      this.setKeySets();
    }
  }

  setKeySets() {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let keysets : keySet[] = [];

    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = state.spheres[sphereIds[i]];
      let sphereKeyIds = Object.keys(sphere.keys);

      let keyMap = {};
      for (let i = 0; i < sphereKeyIds.length; i++) {
        let key = sphere.keys[sphereKeyIds[i]];
        if (key.ttl === 0) {
          keyMap[key.keyType] = key.key;
        }
      }

      keysets.push({
        adminKey:       keyMap[KEY_TYPES.ADMIN_KEY],
        memberKey:      keyMap[KEY_TYPES.MEMBER_KEY],
        basicKey:       keyMap[KEY_TYPES.BASIC_KEY],
        serviceDataKey: keyMap[KEY_TYPES.SERVICE_DATA_KEY],
        referenceId:    sphereIds[i],
        iBeaconUuid:    sphere.config.iBeaconUUID
      });
    }

    if (keysets.length == 0) {
      Bluenet.clearKeySets()
    }
    else {
      BluenetPromiseWrapper.setKeySets(keysets)
        .catch((err) => { LOGe.info("Error EncryptionManager:", err);})
    }
  }
}

export const EncryptionManager = new EncryptionManagerClass();