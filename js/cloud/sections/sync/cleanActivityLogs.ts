import {LOG} from "../../../logging/Log";
import {ACTIVITY_LOG_HISTORY_PERSISTENCE} from "../../../ExternalConfig";


export const cleanupActivity = function(state, actions) {
  LOG.info("SYNC: cleanupActivity starting");
  let deleteHistoryThreshold = new Date().valueOf() - ACTIVITY_LOG_HISTORY_PERSISTENCE;

  let sphereIds = Object.keys(state.spheres);
  // check if we have to delete old data:
  for (let i = 0; i < sphereIds.length; i++) {

    // for all spheres
    let sphere = state.spheres[sphereIds[i]];
    let stoneIds = Object.keys(sphere.stones);
    for (let j = 0; j < stoneIds.length; j++) {

      // for all stones in this sphere
      let stone = sphere.stones[stoneIds[j]];
      let activityLogIds = Object.keys(stone.activityLogs);
      let activityRangeIds = Object.keys(stone.activityRanges);

      for (let k = 0; k < activityLogIds.length; k++) {
        if (stone.activityLogs[activityLogIds[k]].timestamp < deleteHistoryThreshold) {
          actions.push({
            type: 'REMOVE_ACTIVITY_LOG',
            sphereId: sphereIds[i],
            stoneId: stoneIds[j],
            logId: activityLogIds[k]
          });
        }
      }


      for (let k = 0; k < activityRangeIds.length; k++) {
        if (
            stone.activityRanges[activityRangeIds[k]].lastDirectTime < deleteHistoryThreshold &&
            stone.activityRanges[activityRangeIds[k]].lastMeshTime   < deleteHistoryThreshold
           ) {
          actions.push({
            type: 'REMOVE_ACTIVITY_RANGE',
            sphereId: sphereIds[i],
            stoneId: stoneIds[j],
            rangeId: activityRangeIds[k]
          });
        }
      }
    }
  }
};