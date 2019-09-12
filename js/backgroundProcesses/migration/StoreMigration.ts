import { upTo3_0 } from "./steps/upToV3_0";
import { clean_upTo4_0 } from "./steps/upToV4_0";

export function migrate() {
  upTo3_0();
}

export function migrateBeforeInitialization() : Promise<void> {
  return clean_upTo4_0();
}