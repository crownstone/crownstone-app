import { StoreManager } from "../../../router/store/storeManager";

export const clean_upTo4_4 = function() {
  return StoreManager.persistor.destroyDataFields([{spheres: { _id_ : "layout"}}], "MIGRATED_4.4")
}
