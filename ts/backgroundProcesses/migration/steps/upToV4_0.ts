import { StoreManager } from "../../../router/store/storeManager";

export const clean_upTo4_0 = function() {
  return StoreManager.persistor.destroyDataFields([
    {spheres: { _id_ : "appliances"}},
    {spheres: { _id_ : { stones: { _id_ : "activityLogs"}}}},
    {spheres: { _id_ : { stones: { _id_ : "activityRanges"}}}},
    {spheres: { _id_ : { stones: { _id_ : "powerUsage"}}}},
    {spheres: { _id_ : { stones: { _id_ : "schedules"}}}},
    {spheres: { _id_ : { stones: { _id_ : "behaviour"}}}},
    "events", // this is a one time delete to clear unused fields
  ], "MIGRATED_4.0")
}
