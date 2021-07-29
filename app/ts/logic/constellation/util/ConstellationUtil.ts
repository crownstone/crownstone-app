import { core } from "../../../Core";
import { xUtil } from "../../../util/StandAloneUtil";
import { MINIMUM_FIRMWARE_VERSION_BROADCAST } from "../../../ExternalConfig";
import { AppState, Platform } from "react-native";

export const ConstellationUtil = {
  canBroadcast: function(stone: StoneData) {
    let state = core.store.getState();
    if (!stone.config.firmwareVersion) {
      return false;
    }

    if (xUtil.versions.isLower(stone.config.firmwareVersion, MINIMUM_FIRMWARE_VERSION_BROADCAST)) {
      if (state.development.broadcasting_enabled === true) {
        // bypass
      }
      else {
        return false
      }
    }

    if ((Platform.OS === 'ios' && AppState.currentState === 'active') || Platform.OS === 'android') {
      // allow broadcast attempt for whitelisted commands
      return true;
    }
    return false;
  },

}