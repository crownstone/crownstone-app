import { CrownstoneSSE } from "../logic/SSE";
import { CloudAddresses } from "./indirections/CloudAddresses";
import { core } from "../Core";
import { AppState } from "react-native";
import { MapProvider } from "./MapProvider";
import { SpherePresenceManager } from "./SpherePresenceManager";
import DeviceInfo from "react-native-device-info";

type SSE_STATE = "STARTING" | "STARTED" | "STOPPED" | "UNINITIALIZED";

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
        core.eventBus.emit("transformSseEvent", event);
    }
  }


}

export const SseHandler = new SseHandlerClass();
