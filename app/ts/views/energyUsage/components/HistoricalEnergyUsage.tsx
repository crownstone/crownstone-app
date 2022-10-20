import {useEffect, useState} from "react";
import {EnergyUsageCacher} from "../../../backgroundProcesses/EnergyUsageCacher";
import {xUtil} from "../../../util/StandAloneUtil";
import {MONTH_INDICES, MONTH_LABEL_MAP} from "../../../Constants";
import {Text, TouchableOpacity, View, ViewStyle} from "react-native";
import * as React from "react";
import {colors, screenWidth} from "../../styles";
import {Icon} from "../../components/Icon";
import {EnergyGraphAxisSvg} from "../graphs/StaticEnergyGraphSphereSvg";
import { CrownstoneList, RoomList } from "./HistoricalDataLists";
import {Get} from "../../../util/GetUtil";
import {MapProvider} from "../../../backgroundProcesses/MapProvider";
import {EnergyIntervalCalculation} from "../EnergyIntervalCalculation";
import {
  bucketsToLocations,
  filterBucketsForLocation,
  getEnergyRange,
  processStoneBuckets
} from "../EnergyProcessingUtil";

export function HistoricalEnergyUsage(props : {sphereId: sphereId, mode: GRAPH_TYPE, startDate: number, setStartDate: (date: number) => void}) {
  let [ data,             setData ]             = useState<any>(null);
  let [ preProcessedData, setPreProcessedData ] = useState<StoneBucketEnergyData>(null);
  let [ processedData,    setProcessedData ]    = useState<EnergyData>(null);
  let [ loading,          setLoading ]          = useState<boolean>(true);
  let [ locationId,       setLocationId ]       = useState<locationId | null>(null);

  useEffect(() => {
    async function getData() {
      try {
        let container = EnergyUsageCacher.getContainer(props.sphereId);
        let haveData = container.haveData(props.startDate, props.mode);
        if (!haveData) {
          setLoading(true);
        }
        let data = await container.getData(props.startDate, props.mode)
        setLoading(false);
        setData(data);
        console.log("PREPROCESSING DATA");
        setPreProcessedData(processStoneBuckets(props.sphereId, getEnergyRange(props.startDate, props.mode), data, props.mode));
      }
      catch (err : any) {
        console.error(err)
      }
    };

    let interval = setInterval(() => {
      getData();
    }, 5*60e3 + 5000);


    getData();

    return () => { clearInterval(interval); };
  },[props.mode, props.startDate, props.sphereId]);

  useEffect(() => {
    console.log("---PROCESSING DATA");
    if (!preProcessedData) { return; };
    if (locationId) {
      setProcessedData(filterBucketsForLocation(props.sphereId, locationId, getEnergyRange(props.startDate, props.mode), preProcessedData))
    }
    else {
      setProcessedData(bucketsToLocations(props.sphereId, getEnergyRange(props.startDate, props.mode), preProcessedData))
    }

    console.log("preProcessedData", preProcessedData);
    console.log("processedData",    processedData);
  }, [preProcessedData, locationId]);


  let startDate = props.startDate;
  let range = getEnergyRange(startDate, props.mode);

  let indicator;
  let calculator;
  switch(props.mode) {
    case "LIVE":
      break;
    case "DAY":
      indicator = xUtil.getDateFormat(startDate)
      calculator = EnergyIntervalCalculation.days.getNthSamplePoint;
      break;
    case "WEEK":
      indicator = `${xUtil.getDateFormat(range.start)} - ${xUtil.getDateFormat(range.end)}`;
      calculator = EnergyIntervalCalculation.weeks.getNthSamplePoint;
      break;
    case "MONTH":
      indicator = `${MONTH_LABEL_MAP(MONTH_INDICES[new Date(range.start).getMonth()])} ${new Date(range.start).getFullYear()}`;
      calculator = EnergyIntervalCalculation.months.getNthSamplePoint;
      break;
    case "YEAR":
      indicator = new Date(range.start).getFullYear()
      calculator = EnergyIntervalCalculation.years.getNthSamplePoint;
      break;
  }

  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'};
  return (
    <React.Fragment>
      <View style={{flexDirection:'row', justifyContent:'space-around',width: screenWidth, padding:10}}>
        <TouchableOpacity style={leftRightStyle} onPress={() => { props.setStartDate(calculator(props.startDate, -1)); }}>
          <Icon name={'enty-chevron-small-left'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
        <Text style={{fontWeight:'bold'}}>{indicator}</Text>
        <TouchableOpacity style={leftRightStyle} onPress={() => { props.setStartDate(calculator(props.startDate, 1)); }}>
          <Icon name={'enty-chevron-small-right'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
      </View>
      <EnergyGraphAxisSvg data={processedData} type={props.mode} width={0.9*screenWidth} height={200} />
      <View style={{flex:1}}>
        { !locationId && <RoomList sphereId={props.sphereId} data={processedData} setLocationId={setLocationId} /> }
        { locationId  && <CrownstoneList sphereId={props.sphereId} data={processedData} locationId={locationId} /> }
      </View>
    </React.Fragment>
  );
}
