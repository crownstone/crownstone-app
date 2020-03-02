
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("UpdateCenter", key)(a,b,c,d,e);
}
import { core } from "../core";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";
import { NavigationUtil } from "../util/NavigationUtil";
import { DfuUtil } from "../util/DfuUtil";
import { LOG } from "../logging/Log";

class UpdateCenterClass {
  _initialized: boolean = false;
  updateAvailable: boolean = false;

  constructor() { }

  init() {
    LOG.info('Init UpdateCenter', this._initialized);
    if (this._initialized === false) {
      core.eventBus.on("databaseChange", (data) => {
        let change = data.change;

        if (change.changeStones || change.updateStoneCoreConfig || change.firmwareVersionsAvailable) {
          this.checkForFirmwareUpdates();
        }
      });
    }
    this._initialized = true;
  }

  checkForFirmwareUpdates() {
    let state = core.store.getState();
    let spheres = state.spheres;
    Object.keys(spheres).forEach((sphereId) => {
      let updatableStones = DfuUtil.getUpdatableStones(sphereId);
      if (updatableStones.amountOfStones > 0) {
        this.updateAvailable = true;
        // OnScreenNotifications.setNotification({
        //   source: "UpdateCenter",
        //   id: "UpdateCenter" + sphereId,
        //   sphereId: sphereId,
        //   label: lang("Update_available_"),
        //   icon: "c1-update-arrow",
        //   callback: () => {
        //     NavigationUtil.launchModal( "DfuIntroduction", {sphereId: sphereId});
        //   }
        // });
      }
      else {
        this.updateAvailable = false;
        OnScreenNotifications.removeNotification("UpdateCenter" + sphereId);
      }
    })
  }
}

export const UpdateCenter = new UpdateCenterClass();
