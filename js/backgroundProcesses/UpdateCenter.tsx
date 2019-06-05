
import { Languages } from "../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("UpdateCenter", key)(a,b,c,d,e);
}
import { core } from "../core";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";
import * as React from "react";
import { DfuUtil } from "../util/DfuUtil";
import { NavigationUtil } from "../util/NavigationUtil";

export const UpdateCenter = {
  checkForFirmwareUpdates: function() {
    let state = core.store.getState();
    let spheres = state.spheres;

    Object.keys(spheres).forEach((sphereId) => {
      let updatableStones = DfuUtil.getUpdatableStones(sphereId);
      if (updatableStones.amountOfStones > 0) {
        OnScreenNotifications.setNotification({
          source: "UpdateCenter",
          id: "UpdateCenter" + sphereId,
          sphereId: sphereId,
          label: lang("Update_available_"),
          icon: "c1-update-arrow",
          callback: () => {
            NavigationUtil.launchModal( "DfuIntroduction", {sphereId: sphereId});
          }
        });
      }
      else {
        OnScreenNotifications.removeNotification("UpdateCenter" + sphereId);
      }
    })
  }
}
