import {useEffect, useState} from "react";
import {EnergyUsageCacher} from "../../../backgroundProcesses/EnergyUsageCacher";
import {xUtil} from "../../../util/StandAloneUtil";
import {MONTH_INDICES, MONTH_LABEL_MAP} from "../../../Constants";
import {Text, TouchableOpacity, View, ViewStyle} from "react-native";
import * as React from "react";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import {EnergyGraphAxisSvg} from "../graphs/StaticEnergyGraphSphereSvg";
import {RoomList} from "./HistoricalDataLists";
import {getEnergyRange} from "../EnergyUsage";
import {Get} from "../../../util/GetUtil";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {EnergyIntervalCalculation} from "../EnergyIntervalCalculation";

export function HistoricalEnergyUsage(props : {sphereId: sphereId, mode: GRAPH_TYPE, startDate: number, setStartDate: (date: number) => void}) {
  let [ data, setData ]       = useState<any>(null);
  let [ loading, setLoading ] = useState<boolean>(true);

  useEffect(() => {
    async function getData() {
      let container = EnergyUsageCacher.getContainer(props.sphereId);
      let haveData = container.haveData(props.startDate, props.mode);

      if (!haveData) {
        setLoading(true);
      }
      let data = await container.getData(props.startDate, props.mode)
      setLoading(false);
      setData(data);
    }

    let interval = setInterval(() => {
      getData();
    }, 5*60e3 + 5000);

    getData();

    return () => {
      clearInterval(interval);
    }
  },[props.mode, props.startDate, props.sphereId])


  let startDate = props.startDate;
  let range = getEnergyRange(props.mode, startDate)

  let indicator;
  switch(props.mode) {
    case "LIVE":
      break;
    case "DAY":
      indicator = xUtil.getDateFormat(startDate)

      break;
    case "WEEK":
      indicator = `${xUtil.getDateFormat(range.start)} - ${xUtil.getDateFormat(range.end)}`;
      break;
    case "MONTH":
      indicator = `${MONTH_LABEL_MAP(MONTH_INDICES[new Date(range.start).getMonth()])} ${new Date(range.start).getFullYear()}`;
      break;
    case "YEAR":
      indicator = new Date(range.start).getFullYear()
      break;
  }

  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'};
  return (
    <React.Fragment>
      <View style={{flexDirection:'row', justifyContent:'space-around',width: screenWidth, padding:10}}>
        <TouchableOpacity style={leftRightStyle} onPress={() => {}}>
          <Icon name={'enty-chevron-small-left'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
        <Text style={{fontWeight:'bold'}}>{indicator}</Text>
        <TouchableOpacity style={leftRightStyle} onPress={() => {}}>
          <Icon name={'enty-chevron-small-right'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
      </View>
      <EnergyGraphAxisSvg data={data} type={props.mode} width={0.9*screenWidth} height={200} />
      <RoomList mode={props.mode} data={data} />
    </React.Fragment>
  );
}


function processPerLocation(sphereId: sphereId, range: {start: Date, end: Date}, data: EnergyReturnData[], mode: GRAPH_TYPE) : EnergyData {
  let sphere = Get.sphere(sphereId);
  let locations = sphere.locations;

  let processed = [];
  let accumulated = {};

  let stones : Record<stoneId, {energy: number, timestamp: number}[]> = {}
  // sort datapoints by stone.
  for (let datapoint of data) {
    if (!stones[datapoint.stoneId]) {
      stones[datapoint.stoneId] = [];
    }
    stones[datapoint.stoneId].push({energy: datapoint.energyUsage, timestamp: new Date(datapoint.timestamp).valueOf()});
  }

  // sort datapoints by timestamp.
  for (let stoneId in stones) {
    stones[stoneId].sort((a,b) => a.timestamp - b.timestamp);
  }

  let stoneBuckets = {}
  for (let stoneId in stones) {
    let stone = Get.stone(sphereId, stoneId);
    let bucketStart = range.start.valueOf();
    let bucketEnd = EnergyIntervalCalculation.days.getNthSamplePoint(range.start.valueOf(), 1);
    // find datapoints that fit in the bucket.
    for (let stoneData of stones[stoneId]) {
      if (stoneData.timestamp >= bucketStart && stoneData.timestamp <= bucketEnd) {
        console.log("bucket")
      }
    }
  }


  // for (let datapoint of data) {
  //   let localStoneId = MapProvider.cloud2localMap.stones[datapoint.stoneId];
  //   let stone = sphere.stones[localStoneId];
  //   if (!stone) { continue; }
  //
  //   let locationId = stone.config.locationId;
  //   if (accumulated[locationId] === undefined) {
  //     accumulated[locationId] = 0;
  //   }
  //
  //   accumulated[locationId] += datapoint.energyUsage;
  //
  // }
  //
  //
  // for (let locationId in locations) {
  //
  // }
}