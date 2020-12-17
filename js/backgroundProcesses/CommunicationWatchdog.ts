import { DataUtil } from "../util/DataUtil";
import { StoneAvailabilityTracker } from "../native/advertisements/StoneAvailabilityTracker";
import { BroadcastStateManager } from "./BroadcastStateManager";
import { Platform } from "react-native";

/**
 * This should keep track of the following methods
 * - registerTrackedDevice
 * - trackedDeviceHeartbeat
 *
 * Let's make this a general module that will ENSURE the successful delivery of commands.
 *
 * This is essentially a combination of the StoneAvailabilityChecker's sendCommandToNearestCrownstones and a retrying mechanicsm
 */
class CommunicationWatchdogClass {

  async registerTrackedDevice(sphereId) : Promise<number | void> {
    let preferences = DataUtil.getDevicePreferences(sphereId);
    return StoneAvailabilityTracker.sendCommandToNearestCrownstones(
      sphereId,
      {
        commandName: 'registerTrackedDevice',
        trackingNumber: preferences.trackingNumber,
        locationUID: () => {
          return BroadcastStateManager.getCurrentLocationUID();
        },
        profileId: 0,
        rssiOffset: preferences.rssiOffset,
        ignoreForPresence: preferences.ignoreForBehaviour,
        tapToToggleEnabled: preferences.tapToToggleEnabled,
        deviceToken: preferences.activeRandomDeviceToken, // we register the active token since this one is ALWAYS the same as the one we broadcast on the background.
        ttlMinutes: 120
      },
      2)
      .then((promises) => {
        return Promise.all(promises);
      })
      .then(() => {
        return Date.now();
      })
      .catch((err) => {
        console.log("SOMETHING WENT WRONG", err)
      })
  }

  trackedDeviceHeartbeat() {
    if (Platform.OS !== 'ios') { return }

    let activeSphereId = BroadcastStateManager.getSphereInLocationState();
    // this means we're broadcasting in an active sphere.
    if (activeSphereId !== null) {
      let preferences = DataUtil.getDevicePreferences(activeSphereId);

      StoneAvailabilityTracker.sendCommandToNearestCrownstones(
        activeSphereId,
        {
          commandName: 'trackedDeviceHeartbeat',
          trackingNumber: preferences.trackingNumber,
          locationUID: () => {
            return BroadcastStateManager.getCurrentLocationUID();
          },
          deviceToken: preferences.activeRandomDeviceToken, // we register the active token since this one is ALWAYS the same as the one we broadcast on the background.
          ttlMinutes: 3
        },
        2)
        .then((promises) => {
          return Promise.all(promises);
        })
        .catch((err) => {
          console.log("SOMETHING WENT WRONG", err)
        })

    }
  }

}

export const CommunicationWatchdog = new CommunicationWatchdogClass()