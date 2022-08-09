import { CrownstoneSSE } from "../logic/SSE";
import { CloudAddresses } from "./indirections/CloudAddresses";
import { core } from "../Core";
import { AppState } from "react-native";
import { MapProvider } from "./MapProvider";
import { SpherePresenceManager } from "./SpherePresenceManager";

type SSE_STATE = "STARTING" | "STARTED" | "STOPPED" | "UNINITIALIZED";

export class SseHandlerClass {

  SSE: typeof CrownstoneSSE;
  initialized = false;
  unsubscribe;

  sseState : SSE_STATE = "STOPPED";

  async init() {
    if (this.initialized) { return; }
    this.initialized = true;

    this.SSE = new CrownstoneSSE({sseUrl: CloudAddresses.sse});

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

    this.SSE.stop();
    this.sseState = "STOPPED";
  }

  _handleSseEvent(event : SseEvent) {
    switch (event.type) {
      case "presence":
        SpherePresenceManager.handlePresenceEvent(event);
        break;
    }
  }


}

export const SseHandler = new SseHandlerClass();
