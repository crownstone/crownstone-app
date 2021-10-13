import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";
import { upTo4_3 } from "./steps/upToV4_3";
import { StoreManager } from "../../database/storeManager";
import { clean_upTo4_4, upTo4_4 } from "./steps/upToV4_4";
import { clean_upTo5_0, upTo5_0 } from "./steps/upToV5_0";
import { core } from "../../Core";
import DeviceInfo from "react-native-device-info";

export function migrate() {
  let state = core.store.getState();
  let appVersion = DeviceInfo.getReadableVersion();
  let lastMigrationVersion = state.app.migratedDataToVersion;


  upTo3_0(lastMigrationVersion, appVersion);
  upTo4_3(lastMigrationVersion, appVersion);
  upTo4_4(lastMigrationVersion, appVersion);
  upTo5_0(lastMigrationVersion, appVersion);
}

export async function migrateBeforeInitialization() : Promise<void> {
  await clean_upTo4_0();
  await clean_upTo4_4();
  await clean_upTo5_0();
}