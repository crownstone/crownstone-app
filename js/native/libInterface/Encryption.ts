import { Alert, AppState }       from 'react-native';
import { eventBus } from "../../util/EventBus";
import { BluenetPromiseWrapper } from "./BluenetPromise";
import { Bluenet } from "./Bluenet";


class EncryptionManagerClass {
  _initialized : boolean = false;
  store : any;
  _uuid : string;
  _readyForLocalization = false;

  loadStore(store) {
    if (this._initialized === false) {
      this.store = store;
      this._initialized = true;

      eventBus.on("KEYS_UPDATED",         () => { this.setKeySets(); });
      eventBus.on('userLoggedInFinished', () => { this.setKeySets() });

      this.setKeySets();
    }
  }

  setKeySets() {
    let state = this.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let keysets : keySet[] = [];

    for (let i = 0; i < sphereIds.length; i++) {
      let sphere = state.spheres[sphereIds[i]];
      keysets.push({
        adminKey:    sphere.config.adminKey,
        memberKey:   sphere.config.memberKey,
        guestKey:    sphere.config.guestKey,
        referenceId: sphereIds[i],
        iBeaconUuid: sphere.config.iBeaconUUID
      });
    }

    if (keysets.length == 0) {
      Bluenet.clearKeySets()
    }
    else {
      BluenetPromiseWrapper.setKeySets(keysets)
        .catch((err) => { console.log("Error EncryptionManager:", err);})
    }
  }
}

export const EncryptionManager = new EncryptionManagerClass()