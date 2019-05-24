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
          label: "Update available!",
          icon: "c1-update-arrow",
          callback: () => {
            NavigationUtil.navigate( "DfuIntroduction", {sphereId: sphereId});
          }
        });
      }
    })
  }
}
