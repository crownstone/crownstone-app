import {useEffect, useState} from "react";
import {EnergyUsageCacher} from "../../../backgroundProcesses/EnergyUsageCacher";
import {xUtil} from "../../../util/StandAloneUtil";
import {MONTH_INDICES, MONTH_LABEL_MAP} from "../../../Constants";
import { ActivityIndicator, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import * as React from "react";
import { colors, screenWidth, styles } from "../../styles";
import {Icon} from "../../components/Icon";
import {EnergyGraphAxisSvg} from "../graphs/StaticEnergyGraphSphereSvg";
import { CrownstoneList, RoomList } from "./HistoricalDataLists";
import {Get} from "../../../util/GetUtil";
import {EnergyIntervalCalculation} from "../EnergyIntervalCalculation";
import {
  bucketsToLocations,
  filterBucketsForLocation,
  getEnergyRange,
  processStoneBuckets
} from "../EnergyProcessingUtil";

import { ButtonBar } from "../../components/editComponents/ButtonBar";
import {Blur} from "../../components/Blur";

export function HistoricalEnergyUsage(props : {sphereId: sphereId, mode: GRAPH_TYPE}) {
  let [ preProcessedData, setPreProcessedData ] = useState<StoneBucketEnergyData>(null);
  let [ processedData,    setProcessedData ]    = useState<EnergyData>(null);
  let [ loading,          setLoading ]          = useState<boolean>(true);
  let [ locationId,       setLocationId ]       = useState<locationId | null>(null);
  let [ startDate,        setStartDate ]        = useState<Record<GRAPH_DATE_TYPE, number> >({ DAY: Date.now(), WEEK: Date.now(), MONTH: Date.now(), YEAR: Date.now() });


  useEffect(() => {
    async function getData() {
      try {
        let container = EnergyUsageCacher.getContainer(props.sphereId);
        let haveData = container.haveData(startDate[props.mode], props.mode);
        if (!haveData) {
          setLoading(true);
        }
        let data = await container.getData(startDate[props.mode], props.mode)
        if (!data) { console.log("No data!"); }
        else       {
          setPreProcessedData(processStoneBuckets(props.sphereId, getEnergyRange(startDate[props.mode], props.mode), data, props.mode));
        }
        setLoading(false);
      }
      catch (err : any) {
        console.error(err)
      }
    };

    let interval = setInterval(() => { getData(); }, 5*60e3 + 5000);

    setPreProcessedData(null);
    setProcessedData(null);

    getData();

    return () => { clearInterval(interval); };
  },[props.mode, startDate, props.sphereId]);

  useEffect(() => {
    if (!preProcessedData) { return; };
    if (locationId) {
      setProcessedData(filterBucketsForLocation(props.sphereId, locationId, getEnergyRange(startDate[props.mode], props.mode), preProcessedData))
    }
    else {
      setProcessedData(bucketsToLocations(props.sphereId, getEnergyRange(startDate[props.mode], props.mode), preProcessedData))
    }
  }, [preProcessedData, locationId]);


  let startDateValue = startDate[props.mode];
  let range = getEnergyRange(startDateValue, props.mode);

  let indicator;
  let calculator;
  switch(props.mode) {
    case "LIVE":
      break;
    case "DAY":
      indicator = xUtil.getDateFormat(startDateValue)
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

  function changeDate(value: number) {
    let newDate = {...startDate};
    newDate[props.mode] = calculator(startDate[props.mode], value);
    setStartDate(newDate);
  }

  let location = Get.location(props.sphereId, locationId);

  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'};
  return (
    <React.Fragment>
      <View style={{flexDirection:'row', justifyContent:'space-around',width: screenWidth, padding:10}}>
        <TouchableOpacity style={leftRightStyle} onPress={() => { changeDate(-1); }}>
          <Icon name={'enty-chevron-small-left'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
        <Text style={{fontWeight:'bold'}}>{indicator}</Text>
        <TouchableOpacity style={leftRightStyle} onPress={() => { changeDate(1); }}>
          <Icon name={'enty-chevron-small-right'} size={23} color={colors.black.hex} />
        </TouchableOpacity>
      </View>
      { location && <View style={{}}><Text>{`Energy usage in ${location.config.name}`}</Text></View> }
      <View>
      <EnergyGraphAxisSvg data={processedData} type={props.mode} width={0.9*screenWidth} height={200} />
      { loading && <Blur blurType="xlight" blurAmount={5} style={{position:'absolute', top:0, left:0, height:200, width: 0.9*screenWidth, ...styles.centered}}><ActivityIndicator size={'large'} color={colors.black.rgba(0.5)} /></Blur> }
      </View>
      <View style={{flex:1}}>
        { !locationId && <RoomList sphereId={props.sphereId} data={processedData} setLocationId={setLocationId} /> }
        { locationId  && <CrownstoneList sphereId={props.sphereId} data={processedData} locationId={locationId} /> }
        { location    && <ButtonBar
          callback={() => {setLocationId(null)}}
          backgroundColor={"transparent"}
          style={{color: colors.black.hex, fontStyle: 'italic'}}
          icon={<Icon name={'enty-chevron-small-left'} size={23} color={colors.black.hex} />}
          label={`Back to Sphere energy overview...`}
        /> }
      </View>
    </React.Fragment>
  );
}
