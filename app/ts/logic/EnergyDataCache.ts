import {getEnergyRange} from "../views/energyUsage/EnergyUsage";
import {CLOUD} from "../cloud/cloudAPI";
import {LOGe} from "../logging/Log";


export class EnergyDataCache {
  sphereId : sphereId;

  dayData   : {[startTime: timeISOString]: { updateTime: timestamp, data: EnergyReturnData[] } } = {};
  weekData  : {[startTime: timeISOString]: { updateTime: timestamp, data: EnergyReturnData[] } } = {};
  monthData : {[startTime: timeISOString]: { updateTime: timestamp, data: EnergyReturnData[] } } = {};
  yearData  : {[startTime: timeISOString]: { updateTime: timestamp, data: EnergyReturnData[] } } = {};

  constructor(sphereId: sphereId) {
    this.sphereId = sphereId;
  }

  haveData(date: Date | timestamp | timeISOString, mode: GRAPH_TYPE) : boolean {
    let dateRange = getEnergyRange(date, mode);

    let startDate = dateRange.start.toISOString();
    switch (mode) {
      case 'DAY':
        return this.dayData[startDate] !== undefined;
      case 'WEEK':
        return this.weekData[startDate] !== undefined;
      case 'MONTH':
        return this.monthData[startDate] !== undefined;
      case 'YEAR':
        return this.yearData[startDate] !== undefined;
    }
    return false;
  }

  async getData(date: Date | timestamp | timeISOString, mode: GRAPH_TYPE) : Promise<any> {
    date = new Date(date);
    let range = getEnergyRange(date, 'DAY');

    let container = this.dayData;
    switch (mode) {
      case 'DAY':
        break;
      case 'WEEK':
        container = this.weekData; break;
      case 'MONTH':
        container = this.monthData; break;
      case 'YEAR':
        container = this.yearData; break;
    }


    let getData = async () => {
      try {
        let result = await CLOUD.forSphere(this.sphereId).getEnergyUsage(range.start, range.end, mode.toLowerCase());
        container[startDate] = {updateTime: Date.now(), data: result};
      }
      catch (err) {
        LOGe.cloud("Could not get energy usage for sphere", this.sphereId, err);
        return null;
      }
    }

    let startDate = range.start.toISOString();
    if (container[startDate] === undefined) {
      await getData();
      return container[startDate]?.data ?? null;
    }
    else {
      if (container[startDate].updateTime < Date.now() - 4*60e3) {
        await getData();
        return container[startDate].data;
      }
      container[startDate].data;
    }
  }

}