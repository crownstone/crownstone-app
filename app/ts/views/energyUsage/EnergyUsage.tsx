import * as React from 'react';
import { useState } from "react";
import {
  colors,
  screenWidth,
  statusBarHeight, styles,
  tabBarHeight,
  topBarHeight
} from "../styles";
import { TouchableOpacity, View, Text, ScrollView, ViewStyle, Alert } from "react-native";
import { BackgroundCustomTopBarNavbar } from "../components/Background";
import { TopBarBlur } from "../components/NavBarBlur";
import { HeaderTitle } from "../components/HeaderTitle";
import { Get } from "../../util/GetUtil";
import { useDatabaseChange } from "../components/hooks/databaseHooks";
import { EnergyGraphAxisSvg } from "./graphs/StaticEnergyGraphSphereSvg";
import { TimeButton } from "./components/TimeButton";
import { xUtil } from "../../util/StandAloneUtil";
import { MONTH_INDICES, MONTH_LABEL_MAP } from "../../Constants";
import { Icon } from "../components/Icon";
import {getDayData, getMonthData, getWeekData, getYearData} from "./MockEnergyDataGeneration";
import {LiveRoomList} from "./components/LiveLists";
import {RoomList} from "./components/HistoricalDataLists";


let cachedData = null;

export function EnergyUsage(props) {
  return (
    <BackgroundCustomTopBarNavbar>
      <EnergyUsageContent />
    </BackgroundCustomTopBarNavbar>
  );
}


function EnergyUsageContent(props) {
  useDatabaseChange(['updateActiveSphere']);
  let [mode, setMode] = useState<GRAPH_TYPE>("LIVE");
  let [startDate, setStartDate] = useState<number>(Date.now());

  let activeSphere = Get.activeSphere();
  if (!activeSphere) {
    return <ContentNoSphere />;
  }

  let indicator;
  switch(mode) {
    case "LIVE":
      break;
    case "DAY":
      cachedData = getDayData(startDate);
      indicator = xUtil.getDateFormat(cachedData.startTime)
      break;
    case "WEEK":
      cachedData = getWeekData(startDate);
      indicator = `${xUtil.getDateFormat(cachedData.startTime)} - ${xUtil.getDateFormat(cachedData.startTime+7*24*3600000)}`;
      break;
    case "MONTH":
      cachedData = getMonthData(startDate);
      indicator = `${MONTH_LABEL_MAP(MONTH_INDICES[new Date(cachedData.startTime).getMonth()])} ${new Date(cachedData.startTime).getFullYear()}`;
      break;
    case "YEAR":
      cachedData = getYearData(startDate);
      indicator = new Date(cachedData.startTime).getFullYear()
      break;
  }

  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'}

  return (
    <React.Fragment>
      <ScrollView contentContainerStyle={{paddingTop: topBarHeight-statusBarHeight, alignItems:'center', justifyContent:"center", paddingBottom:2*tabBarHeight}}>
        <View style={{flexDirection:'row', justifyContent:'space-evenly', width: screenWidth}}>
          <TimeButton selected={mode == "LIVE"}  label={"LIVE"}   callback={() => { setMode("LIVE"); }}   />
          <TimeButton selected={mode == "DAY"}   label={"Day"}    callback={() => { setMode("DAY"); }}   />
          <TimeButton selected={mode == "WEEK"}  label={"Week"}   callback={() => { setMode("WEEK"); }}  />
          <TimeButton selected={mode == "MONTH"} label={"Months"} callback={() => { setMode("MONTH"); }} />
          <TimeButton selected={mode == "YEAR"}  label={"Years"}  callback={() => { setMode("YEAR"); }}  />
        </View>
        {
          mode !== "LIVE" && (
          <View style={{flexDirection:'row', justifyContent:'space-around',width: screenWidth, padding:10}}>
            <TouchableOpacity style={leftRightStyle} onPress={() => {}}>
              <Icon name={'enty-chevron-small-left'} size={23} color={colors.black.hex} />
            </TouchableOpacity>
            <Text style={{fontWeight:'bold'}}>{indicator}</Text>
            <TouchableOpacity style={leftRightStyle} onPress={() => {}}>
              <Icon name={'enty-chevron-small-right'} size={23} color={colors.black.hex} />
            </TouchableOpacity>
          </View>
          )
        }
        {
          mode !== "LIVE" && (
            <TouchableOpacity
              style={{backgroundColor: colors.csBlue.hex, height:40, ...styles.centered, width: screenWidth}}
              onPress={showDemoAlert}
            >
              <Text style={{color: colors.white.hex, fontWeight: 'bold'}}>DEMO MODE</Text>
            </TouchableOpacity>
          )
        }
        {mode !== "LIVE" && <TouchableOpacity onPress={showDemoAlert}><EnergyGraphAxisSvg data={cachedData} type={mode} width={0.9*screenWidth} height={200} /></TouchableOpacity>}
        {mode !== "LIVE" ?  <RoomList mode={mode} data={cachedData} /> : <LiveRoomList /> }
      </ScrollView>
      <TopBarBlur xlight>
        <EnergyUsageHeader mode={mode} />
      </TopBarBlur>
    </React.Fragment>
  );
}


export function showDemoAlert() {
  Alert.alert(
    "Coming soon!",
    "We're working on integrating with existing hubs to gather historical data for you to see here!\n\nThese views are a taste of what's to come!",
    [{text:"OK"}]
  );
}


export function ContentNoSphere(props) {
  return (
    <View style={{flex:1, alignItems:'flex-start', justifyContent:'center', paddingTop:topBarHeight}}>
      <View style={{flex:1}} />
      <Text style={{fontSize:22, fontWeight:'bold', padding:30}}>{"No sphere selected..."}</Text>
      <Text style={{fontSize:16, fontWeight:'bold', padding:30}}>{"Go to the overview and select a sphere."}</Text>
      <View style={{flex:3}} />
    </View>
  );
}


function EnergyUsageHeader(props: {mode: GRAPH_TYPE}) {
  return (
    <View style={{paddingLeft:15}}>
      <HeaderTitle title={props.mode === "LIVE" ? 'Power usage' : 'Energy usage'} />
    </View>
  );
}



