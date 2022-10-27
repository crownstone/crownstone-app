
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("EnergyUsageUtil", key)(a,b,c,d,e);
}
import * as React from "react";
import {ActivityIndicator, Text, View} from "react-native";
import {colors} from "../styles";
import {Mixer} from "../../util/colorCharm/Mixer";
import {DataUtil} from "../../util/DataUtil";
import {PowerUsageCacher} from "../../backgroundProcesses/PowerUsageCacher";
import { Get } from "../../util/GetUtil";

const COLOR_LIST_LARGE = [
  colors.csBlueLighter.hex,
  colors.csBlue.hex,
  colors.csBlueDarker.hex,
  colors.blue.hex,
  colors.lightCsOrange.hex,
  colors.csOrange.hex,
];

const COLOR_LIST_MEDIUM = [
  colors.csBlueDarker.hex,
  colors.blue.hex,
  colors.green.hex,
];

const COLOR_LIST_SMALL = [
  colors.csBlue.hex,
  colors.blue.hex,
];

export const EnergyUsageUtil = {

  // get timestamp of the monday on the week of the provided timestamp
  getMonday: function(timestamp) : number {
    let date = new Date(timestamp);
    let day = date.getDay();
    let diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff)).getTime();
  },


  getLiveLocationEnergyUsage: function(sphereId: sphereId, locationId: locationId) {
    let stones = DataUtil.getStonesInLocation(sphereId, locationId);

    let powerData = [];
    for (let stoneId in stones) {
      powerData.push(PowerUsageCacher.getRecentData(sphereId, stones[stoneId].config.handle));
    }

    return <PendingEnergyState powerData={powerData} baseUnit={ lang("W")} />
  },


  getEnergyUsage: function(data: EnergyData | null, itemId) {
    let sum = 0;

    if (data) {
      for (let dataPoint of data.data) {
        if (dataPoint[itemId]) {
          sum += dataPoint[itemId];
        }
      }

    }

    let { scalingFactor, unit } = getScalingAndUnit(sum, 'Wh');
    return `${(sum*scalingFactor).toFixed(1)} ${unit}`;
  },


  getLiveStoneEnergyUsage: function(sphereId, stoneId, value : number = null ) {
    let stone = Get.stone(sphereId, stoneId);

    if (value === null) {
      value = PowerUsageCacher.getRecentData(sphereId, stone.config.handle);
    }
    return <PendingEnergyState powerData={[value]} showCollection={false} baseUnit={ lang("W")} />
  },


  getLocationColorList(sphereId) : Record<locationId, colorString> {
    let locations = DataUtil.getLocationsInSphereAlphabetically(sphereId);

    // get an array of the ids
    let idArray = locations.map(location => location.id);

    return getColorMap(idArray);
  },


  getStoneColorList(sphereId, locationId?) {
    let stones = DataUtil.getStonesInLocation(sphereId, locationId);

    // map the object to an array of names and ids
    let stoneMap = []
    for (let stoneId in stones) {
      stoneMap.push({name:stones[stoneId]?.config?.name ?? "Unknown", id: stoneId});
    }

    // sort by name alphabetically
    stoneMap.sort((a,b) => { return a.name > b.name ? 1 : -1});

    // get an array of the ids
    let idArray = stoneMap.map(location => location.id);

    return getColorMap(idArray);
  },
}


function getScalingAndUnit(value, baseUnit: string) : {scalingFactor: number, unit: string} {
  let unit = baseUnit as string;
  let scalingFactor = 1;
  if (value > 1e6) {
    scalingFactor = 0.000001;
    unit = 'M' + unit;
  }
  else if (value > 1000) {
    scalingFactor = 0.001;
    unit = 'k' + unit;
  }

  return {scalingFactor, unit};
}



function getColorMap(idArray: string[]) {
  const ColorCharmMixer = new Mixer();
  let list;

  if      (idArray.length > 10) { list = COLOR_LIST_LARGE;  }
  else if (idArray.length > 5)  { list = COLOR_LIST_MEDIUM; }
  else                          { list = COLOR_LIST_SMALL;   }

  let gradient = ColorCharmMixer.linear([list], idArray.length, 'hcl').toHex();
  let colorMap = {};
  let index = 0;
  for (let id of idArray) {
    colorMap[id] = gradient[index++%gradient.length];
  }

  return colorMap;
}


function PendingEnergyState(props: {powerData: (number|null)[], showCollection?: boolean, baseUnit: string}) {
  let missingValues = 0;
  let sum = 0;
  for (let point of props.powerData) {
    if (point === null) { missingValues++; }
    else                { sum += point;    }
  }

  if (missingValues > 0) {
    if (props.showCollection !== false) {
      return (
        <View style={{flex: 1, justifyContent: 'flex-end', paddingRight: 15, flexDirection:'row', alignItems:'center'}}>
          <Text style={{fontSize:13, color: colors.black.rgba(0.5), paddingRight: 10}}>{`${props.powerData.length - missingValues} / ${props.powerData.length}`}</Text><ActivityIndicator size={"small"}/>
        </View>
      );
    }

    return (
      <View style={{flex: 1, justifyContent: 'flex-end', paddingRight: 15, flexDirection:'row'}}>
        <ActivityIndicator size={"small"}/>
      </View>
    );
  }
  else {
    let {scalingFactor, unit} = getScalingAndUnit(sum, props.baseUnit);
    let value = (sum*scalingFactor).toFixed(1);
    return (
      <View style={{flex: 1, alignItems: 'flex-end', paddingRight: 15}}>
        <Text style={{fontSize:13, color: colors.black.rgba(0.75)}}>{`${value} ${unit}`}</Text>
      </View>
    );
  }
}

