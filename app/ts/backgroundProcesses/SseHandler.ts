import { CrownstoneSSE } from "../logic/SSE";
import { CloudAddresses } from "./indirections/CloudAddresses";
import { core } from "../Core";
import { AppState } from "react-native";
import { MapProvider } from "./MapProvider";
import { SpherePresenceManager } from "./SpherePresenceManager";
import DeviceInfo from "react-native-device-info";
import { OnScreenNotifications } from "../notifications/OnScreenNotifications";
import { colors } from "../views/styles";
import { Get } from "../util/GetUtil";
import { SphereDeleted } from "../views/static/SphereDeleted";
import * as React from "react";

type SSE_STATE = "STARTING" | "STARTED" | "STOPPED" | "UNINITIALIZED";


import { Languages } from "../Languages"
import { NavigationUtil } from "../util/navigation/NavigationUtil";
import {Scheduler} from "../logic/Scheduler";

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SseHandler", key)(a,b,c,d,e);
}

export class SseHandlerClass {

  SSE: typeof CrownstoneSSE;
  initialized = false;
  unsubscribe;

  sseState : SSE_STATE = "STOPPED";

  async init() {
    if (this.initialized) { return; }
    this.initialized = true;

    this.SSE = new CrownstoneSSE({sseUrl: CloudAddresses.sse, loginUrl: CloudAddresses.cloud_v1 + 'users/login', projectName: `CrownstoneApp${DeviceInfo.getReadableVersion()}`});
    let state = core.store.getState();
    await this.SSE.loginHashed(state.user.email, state.user.passwordHash);

    if (AppState.currentState === "active") {
      await this.start();
    }

    this.unsubscribe = core.eventBus.on("AppStateChange", (state) => {
      if (state === "active") {
        this.start();
      }
      else if (state === "background") {
        this.stop();
      }
    });
  }

  reset() {
    this.unsubscribe();
    this.stop();
  }

  async start() {
    // We use the states since the appState can change from active to inactive without going to background.
    // this would lead to multiple start/stops
    if (!this.SSE) { return; }
    if (this.sseState !== "STOPPED" && this.sseState !== 'UNINITIALIZED') { return; }

    this.sseState = "STARTING";

    await this.SSE.start((event) => { this._handleSseEvent(event); }).catch();

    this.sseState = "STARTED";
  }

  stop() {
    if (!this.SSE) { return; }

    this.SSE.closeEventSource();
    this.sseState = "STOPPED";
  }

  _handleSseEvent(event : SseEvent) {
    switch (event.type) {
      case "presence":
        SpherePresenceManager.handlePresenceEvent(event);
        break;
      case "transform":
        if(event.subType === "sessionRequested") {
          let localSphereId = MapProvider.cloud2localMap.spheres[event.sphere.id];
          let sphere = Get.sphere(localSphereId);
          let userToHelp;
          let state = core.store.getState();

          const notificationSourceId = 'LocalizationTransform';

          let myUserId = state.user.userId;
          if (event.userA.id === myUserId) {
            // this is you but with a different device.
            userToHelp = state.user;
          }
          else {
            userToHelp = sphere.users[event.userA.id];
          }
          if (event.userB.id === myUserId) {
            if (event.deviceIdB === DeviceInfo.getDeviceId()) {

              if (OnScreenNotifications.hasOtherNotificationsFromSource(notificationSourceId, event.sessionId)) {
                OnScreenNotifications.removeAllNotificationsFrom(notificationSourceId)
              }

              let clearValidityTimeout = Scheduler.setTimeout(() => {
                OnScreenNotifications.removeNotification(event.sessionId);
              }, 60000);

              OnScreenNotifications.setNotification({
                source: notificationSourceId,
                id: event.sessionId,
                label: lang("_asks_for_your_help_", userToHelp.firstName),
                sphereId: localSphereId,
                icon: 'fa5-home',
                iconSize: 30,
                iconColor: colors.black.hex,
                backgroundColor: colors.blue.rgba(0.5),
                callback: () => {
                  clearValidityTimeout();
                  NavigationUtil.launchModal("LocalizationTransform", {
                    sphereId: localSphereId,
                    sessionId: event.sessionId,
                    isHost:false,
                    otherUserId: event.userA.id,
                    otherDeviceId: event.deviceIdA,
                    isModal: true,
                  });
                }
              });
            }
          }
        }
        core.eventBus.emit("transformSseEvent", event);
    }
  }


}

export const SseHandler = new SseHandlerClass();
