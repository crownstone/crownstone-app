import {Get} from "../../util/GetUtil";
import {EnergyUsageUtil} from "./EnergyUsageUtil";
import {DataUtil} from "../../util/DataUtil";

export function getDayData(startDate) {
  return getData(startDate,24, 3600, 100, true);
}

export function getWeekData(startDate) {
  let dateOnMonday = EnergyUsageUtil.getMonday(startDate);
  return getData(dateOnMonday,7, 10*3600, 100, false);
}

export function getMonthData(startDate) {
  return getData(startDate,31, 10*3600, 100, false);
}

export function getYearData(startDate) {
  return getData(startDate,12, 30*10*3600, 100, false);
}



function getData(startTime, count, maxValue, minValue, useGaussian: boolean) : EnergyData {
  /** Generate Data **/
  let valueCount = count;

  function gaussian(x) {
    let std = 4;
    let mean = 12;
    let exponent = Math.exp(-(Math.pow(x - mean,2)/(2*Math.pow(std,2))));
    let stoneProbability = exponent / (Math.sqrt(2*Math.PI) * std);
    return stoneProbability;
  }

  let activeSphere = Get.activeSphere();
  if (!activeSphere) { return {startTime: startTime, colorMap: {}, data: []};}

  let locations = DataUtil.getLocationsInSphereAlphabetically(activeSphere.id);


  let data = []
  for (let i = 0; i < valueCount; i++) {
    data.push({});
    let value;

    for (let location of locations) {
      if (useGaussian) {
        value = gaussian(i)*Math.random()*maxValue+ Math.random()*minValue;
      }
      else {
        value = Math.random()*maxValue+ Math.random()*minValue;
      }
      data[i][location.id] = value;
    }
  }
  /** end of Generate Data **/
  return {startTime: startTime, colorMap: EnergyUsageUtil.getLocationColorList(activeSphere.id), data};
}