import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";
import { upTo4_3 } from "./steps/upToV4_3";
import { clean_upTo4_4, upTo4_4 } from "./steps/upToV4_4";
import { clean_upTo5_0, upTo5_0 } from "./steps/upToV5_0";
import { clean_upTo6_0, upTo6_0 } from "./steps/upToV6_0";
import { core } from "../../Core";

export function migrate() {
  let state = core.store.getState();
  let lastMigrationVersion = state.app.migratedDataToVersion;
  upTo3_0(lastMigrationVersion, '3.0.0.0');
  upTo4_3(lastMigrationVersion, '4.3.0.0');
  upTo4_4(lastMigrationVersion, '4.4.0.0');
  upTo5_0(lastMigrationVersion, '5.0.0.0');
  upTo6_0(lastMigrationVersion, '6.0.0.0');
}

export async function migrateBeforeInitialization() : Promise<void> {
  await clean_upTo4_0();
  await clean_upTo4_4();
  await clean_upTo5_0();
  await clean_upTo6_0();
}
