import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";
// import { DataUtil } from "../../util/DataUtil";
// import { core } from "../../core";
// import { AicoreTwilight } from "../../views/deviceViews/smartBehaviour/supportCode/AicoreTwilight";
// import { AicoreBehaviour } from "../../views/deviceViews/smartBehaviour/supportCode/AicoreBehaviour";
// import { BEHAVIOUR_TYPES } from "../../router/store/reducers/stoneSubReducers/rules";

export function migrate() {
  let actions = [];

  upTo3_0();
}

export function migrateBeforeInitialization() : Promise<void> {
  return clean_upTo4_0();
}