import { Get } from "../../util/GetUtil";
import { EnergyIntervalCalculation } from "./EnergyIntervalCalculation";
import { MapProvider } from "../../backgroundProcesses/MapProvider";
import { stonesBehaviours } from "../../cloud/sections/stonesBehaviours";
import { EnergyUsageUtil } from "./EnergyUsageUtil";
import { DataUtil } from "../../util/DataUtil";

const WattHour = 3600;

export function processStoneBuckets(sphereId: sphereId, range: {start: Date, end: Date}, data: EnergyReturnData[], mode: GRAPH_TYPE) : StoneBucketEnergyData {
  let processed   = [];
  let accumulated = {};

  let stones : Record<stoneId, {energy: number, timestamp: number}[]> = {}
  // sort datapoints by stone.
  for (let datapoint of data) {
    let stoneId = MapProvider.cloud2localMap.stones[datapoint.stoneId] || datapoint.stoneId;
    if (!stones[stoneId]) { stones[stoneId] = []; }

    stones[stoneId].push({energy: datapoint.energyUsage, timestamp: new Date(datapoint.timestamp).valueOf()});
  }

  // sort datapoints by timestamp.
  for (let stoneId in stones) {
    stones[stoneId].sort((a,b) => a.timestamp - b.timestamp);
  }

  let stoneBuckets = {}
  let startTime = range.start.valueOf();
  let bucketCount;
  switch (mode) {
    case 'DAY':
      bucketCount  = 24;
      stoneBuckets = fillBuckets(stones, startTime, bucketCount, EnergyIntervalCalculation.hours.getNthSamplePoint);
      break;
    case 'WEEK':
      bucketCount  = 7;
      stoneBuckets = fillBuckets(stones, startTime, bucketCount, EnergyIntervalCalculation.days.getNthSamplePoint);
      break;
    case 'MONTH':
      // amount of days between start and end of the range. We round it since there may be daylight saving times in between.
      let days     = Math.round((range.end.valueOf() - range.start.valueOf()) / (1000*60*60*24));
      bucketCount  = days;
      stoneBuckets = fillBuckets(stones, startTime, bucketCount, EnergyIntervalCalculation.days.getNthSamplePoint);
      break;
    case 'YEAR':
      bucketCount  = 12;
      stoneBuckets = fillBuckets(stones, startTime, bucketCount, EnergyIntervalCalculation.months.getNthSamplePoint);
      break;
  }
  return {buckets: stoneBuckets, bucketCount: bucketCount};
}


export function bucketsToLocations(sphereId: sphereId, range: {start: Date, end: Date}, data: StoneBucketEnergyData) : EnergyData {
  let sphere    = Get.sphere(sphereId);
  let locations = DataUtil.getLocationsInSphereAlphabetically(sphereId);

  // loop over all locations and get the crownstones in that location. From the set of stones, get the energy usage.
  let locationData = {};
  for (let location of locations) {
    let locationId = location.id;
    locationData[locationId] = new Array(data.bucketCount).fill(0);

    let stonesInLocation = DataUtil.getStonesInLocation(sphereId, locationId);
    for (let stoneId in data.buckets) {
      if (stonesInLocation[stoneId]) {
        // add the energy usage to the location.
        for (let i = 0; i < data.bucketCount; i++) {
          locationData[locationId][i] += data.buckets[stoneId][i];
        }
      }
    }
  }

  let result = [];
  for (let i = 0; i < data.bucketCount; i++) {
    result.push({});
    for (let locationId in locationData) {
      result[i][locationId] = locationData[locationId][i];
    }
  }

  return {
    startTime:  range.start.valueOf(),
    colorMap:   EnergyUsageUtil.getLocationColorList(sphereId),
    data:       result,
  }
}

export function filterBucketsForLocation(sphereId: sphereId, locationId: locationId, range: {start: Date, end: Date}, data: StoneBucketEnergyData) : EnergyData {
  let stonesInLocation = DataUtil.getStonesInLocationAlphabetically(sphereId, locationId);
  let result = [];

  for (let stone of stonesInLocation) {
    if (data.buckets[stone.id]) {
      for (let i = 0; i < data.bucketCount; i++) {
        if (!result[i]) { result.push({}); }
        result[i][stone.id] = data.buckets[stone.id][i];
      }
    }
  }


  return {
    startTime:  range.start.valueOf(),
    colorMap:   EnergyUsageUtil.getStoneColorList(sphereId, locationId),
    data:       result,
  }
}

/**
 *
 * @param sortedStoneData // this is the data sorted by stoneId and timestamp. It is a map with stoneIds as key, and an array of {energy: number, timestamp: number} as value.
 * @param start           // initial bucket start time
 * @param bucketCount
 * @param nthCallback
 */
function fillBuckets(sortedStoneData, start: timestamp, bucketCount: number, nthCallback: (timestamp: timestamp, index: number) => timestamp) : Record<stoneId, number[]> {
  let stoneBuckets = {};

  for (let stoneId in sortedStoneData) {
    stoneBuckets[stoneId] = [];
    let bucketStart = start;

    // loop over all buckets to store a datapoint per stoneId per bucket
    for (let bucketIndex = 0; bucketIndex < bucketCount; bucketIndex++) {
      stoneBuckets[stoneId].push(0)
      let bucketEnd = nthCallback(start, bucketIndex+1);
      let firstValue = null;
      let lastValue  = 0;
      let lastValueBucket = null;

      let lastValueStored = false;

      function storeValue(storeBucketIndex) {
        let energyUsed = (lastValue - (firstValue ?? 0)) / WattHour;
        if (energyUsed < 0) {
          energyUsed = lastValue / WattHour;
        }
        if (energyUsed < 0.5) { energyUsed = 0; }

        stoneBuckets[stoneId][storeBucketIndex] = energyUsed;
      }

      // loop over the available data.
      for (let j = 0; j < sortedStoneData[stoneId].length; j++) {
        let datapointT = sortedStoneData[stoneId][j].timestamp;

        // the datapoint falls within the bucket
        if (datapointT >= bucketStart && datapointT <= bucketEnd) {
          if (firstValue === null) {
            firstValue = sortedStoneData[stoneId][j].energy ?? 0;
          }
          lastValue = sortedStoneData[stoneId][j].energy ?? 0;
          lastValueBucket = bucketIndex;
        }
        // the datapoint is after the bucket
        else if (datapointT > bucketEnd) {
          storeValue(bucketIndex);
          lastValueStored = true;
          break;
        }
        // we do not care if the datapoint is before the bucket.
      }

      // if we have not stored the lastValue but a part of this bucket was filled by the available data, store the data.
      if (!lastValueStored && lastValueBucket !== null) {
        storeValue(lastValueBucket);
      }



      bucketStart = bucketEnd;
    }


  }

  return stoneBuckets;
}



export function getEnergyRange(date: Date | timestamp | timeISOString, mode: GRAPH_TYPE) : {start: Date, end: Date } {
  date = new Date(date);

  if (mode === "DAY") {
    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    let end   = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    return {start, end};
  }

  if (mode === 'WEEK') {
    // get the monday of the week of the date as start and a week later as end
    let start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay()+6)%7);
    let end   = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
    return {start, end};
  }


  if (mode === 'MONTH') {
    let start = new Date(date.getFullYear(), date.getMonth(), 1);
    let end   = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return {start, end};
  }


  if (mode === 'YEAR') {
    let start = new Date(date.getFullYear(), 0, 1);
    let end   = new Date(date.getFullYear() + 1, 0, 1);
    return {start, end};
  }
}
