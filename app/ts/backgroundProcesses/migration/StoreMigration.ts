import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";
import { upTo4_3 } from "./steps/upToV4_3";
import { StoreManager } from "../../database/storeManager";
import { clean_upTo4_4, upTo4_4 } from "./steps/upToV4_4";

export function migrate() {
  upTo3_0();
  upTo4_3();
  upTo4_4();
}

export async function migrateBeforeInitialization() : Promise<void> {
  await clean_upTo4_0();
  await clean_upTo4_4();
}