import * as React from 'react';
import { Component, useState } from "react";
import {
  appStyleConstants,
  colors, NORMAL_ROW_SIZE,
  screenHeight,
  screenWidth,
  statusBarHeight, styles,
  tabBarHeight,
  topBarHeight
} from "../styles";
import { TouchableOpacity, View, Text, TextStyle, ScrollView, ViewStyle, ActivityIndicator, Alert } from "react-native";
import { BackgroundCustomTopBarNavbar } from "../components/Background";
import { TopBarBlur } from "../components/NavBarBlur";
import { EditIcon, MenuButton } from "../components/EditIcon";
import { HeaderTitle } from "../components/HeaderTitle";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Get } from "../../util/GetUtil";
import { useDatabaseChange, useForceUpdate } from "../components/hooks/databaseHooks";
import { BlurView } from "@react-native-community/blur";
import { EnergyGraphAxisSvg } from "./graphs/StaticEnergyGraphSphereSvg";
import { TimeButton } from "./components/TimeButton";
import { xUtil } from "../../util/StandAloneUtil";
import { MONTH_INDICES, MONTH_LABEL_MAP } from "../../Constants";
import { DataUtil } from "../../util/DataUtil";
import { Dropdown } from "../components/editComponents/Dropdown";
import { NavigationBar } from "../components/editComponents/NavigationBar";
import { IconButton } from "../components/IconButton";
import { Icon } from "../components/Icon";
import { SlideFadeInView } from "../components/animated/SlideFadeInView";
import { Mixer } from "../../util/colorCharm/Mixer";


let cachedData = null;

export function EnergyUsage(props) {
  return (
    <BackgroundCustomTopBarNavbar>
      <EnergyUsageContent />
      <TopBarBlur>
        <EnergyUsageHeader />
      </TopBarBlur>
    </BackgroundCustomTopBarNavbar>
  );
}


function EnergyUsageContent(props) {
  useDatabaseChange(['updateActiveSphere']);
  let [mode, setMode] = useState<GRAPH_TYPE>("LIVE");
  let [startDate, setStartDate] = useState<number>(Date.now());

  let activeSphere = Get.activeSphere();
  if (!activeSphere) {
    return <PowerUsageContentNoSphere />;
  }

  let locations = activeSphere.locations;

  let data;
  let indicator;
  let prev;
  let next;
  switch(mode) {
    case "LIVE":
      data = getDayData(startDate);
      break;
    case "DAY":
      data = getDayData(startDate);
      indicator = xUtil.getDateFormat(data.startTime)
      break;
    case "WEEK":
      data = getWeekData(startDate);
      indicator = `${xUtil.getDateFormat(data.startTime)} - ${xUtil.getDateFormat(data.startTime+7*24*3600000)}`;
      break;
    case "MONTH":
      data = getMonthData(startDate);
      indicator = `${MONTH_LABEL_MAP(MONTH_INDICES[new Date(data.startTime).getMonth()])} ${new Date(data.startTime).getFullYear()}`;
      break;
    case "YEAR":
      data = getYearData(startDate);
      indicator = new Date(data.startTime).getFullYear()
      break;
  }

  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'}

  return (
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
      {mode !== "LIVE" && <TouchableOpacity onPress={showDemoAlert}><EnergyGraphAxisSvg data={data} type={mode} width={0.9*screenWidth} height={200} /></TouchableOpacity>}
      {mode !== "LIVE" ?  <RoomList mode={mode} /> : <LiveRoomList /> }
    </ScrollView>
  );
}

function showDemoAlert() {
  Alert.alert(
    "Coming soon!",
    "We're working on integrating with existing hubs to gather historical data for you to see here!\n\nThese views are a taste of what's to come!",
    [{text:"OK"}]
  );
}

function LiveRoomList(props) {
  let activeSphere = Get.activeSphere();
  let items = [];
  let locations = [];
  for (let locationId in activeSphere.locations) {
    let location = activeSphere.locations[locationId];
    locations.push({name: location?.config?.name ?? "Unknown room", location});
  }
  locations.sort((a,b) => { return a.name > b.name ? 1 : -1});
  for (let locationData of locations) {
    items.push(
      <LiveRoomElement key={locationData.location.id} locationData={locationData} />
    )
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}


function LiveRoomElement(props) {
  let [open, setOpen] = useState(false);
  let location = props.locationData;
  return (
    <React.Fragment>
      <NavigationBar
        backgroundColor={"transparent"}
        label={location.name}
        labelStyle={{width:null, flex:1}}
        value={getEnergyUsage(location.location.id, "LIVE")}
        valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
        valueRight
        customValueItem
        callback={() => {setOpen(!open)}}
        icon={<IconButton name={location.location.config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: getColor(location.location.id)}} />}
        arrowDown={open}
      />
      <CrownstoneList open={open} locationId={location.location.id}/>
    </React.Fragment>
  )
}


function CrownstoneList(props: {open: boolean, locationId: locationId}) {
  let activeSphere = Get.activeSphere();
  let items = [];
  let stones = [];
  for (let stoneId in activeSphere.stones) {
    let stone = activeSphere.stones[stoneId];
    if (stone.config.locationId !== props.locationId) { continue; }
    stones.push({name: stone.config.name, id: stoneId});
  }
  if (stones.length === 0) { return <React.Fragment />; }


  stones.sort((a,b) => { return a.name > b.name ? 1 : -1});
  for (let stoneData of stones) {
    let stone = activeSphere.stones[stoneData.id];
    items.push(
      <NavigationBar
        key={stoneData.id}
        backgroundColor={"transparent"}
        label={stoneData.name}
        labelStyle={{width:null, flex:3}}
        value={getStoneEnergyUsage(stoneData.id)}
        valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
        valueRight
        customValueItem
        callback={() => { NavigationUtil.launchModal("DevicePowerUsage", {sphereId: activeSphere.id, stoneId: stoneData.id})}}
        icon={<Icon name={stone.config.icon} size={20} color={colors.black.hex} />}
      />
    )
  }

  return (
    <SlideFadeInView visible={props.open} style={{width: screenWidth, paddingLeft:20}} height={items.length*NORMAL_ROW_SIZE}>
      {items}
    </SlideFadeInView>
  );

}


function RoomList(props: { mode: GRAPH_TYPE }) {
  let activeSphere = Get.activeSphere();
  let items = [];
  let locations = [];
  for (let locationId in activeSphere.locations) {
    let location = activeSphere.locations[locationId];
    locations.push({name: location?.config?.name ?? "Unknown room", location});
  }
  locations.sort((a,b) => { return a.name > b.name ? 1 : -1});
  for (let location of locations) {
    items.push(
      <NavigationBar
        key={location.location.id}
        backgroundColor={"transparent"}
        label={location.name}
        labelStyle={{width:null, flex:1}}
        value={getEnergyUsage(location.location.id, props.mode)}
        valueStyle={{textAlign:'right', paddingRight:15, fontSize:14, color: colors.black.rgba(0.4)}}
        valueRight
        customValueItem
        callback={showDemoAlert}
        icon={<IconButton name={location.location.config.icon} size={20} color={colors.white.hex} buttonStyle={{backgroundColor: getColor(location.location.id)}} />}
      />
    )
  }

  return <View style={{width: screenWidth, paddingTop:15}}>{items}</View>;
}

function getEnergyUsage(itemId, mode) {
  let sum = 0;
  for (let data of cachedData.data ) {
    if (data[itemId]) {
      sum += data[itemId];
    }
  }

  let unit = 'Wh';
  let scalingFactor = 1;
  if (sum > 1e6) {
    scalingFactor = 0.000001;
    unit = 'MWh';
  }
  else if (sum > 1000) {
    scalingFactor = 0.001;
    unit = 'kWh';
  }

  if (mode === "LIVE") {
    return <PendingEnergyState/>
  }

  return `${(sum*scalingFactor).toFixed(1)} ${unit}`;
}

function getStoneEnergyUsage(itemId) {
  let sum = 0;
  for (let data of cachedData.data ) {
    if (data[itemId]) {
      sum += data[itemId];
    }
  }

  let unit = 'Wh';
  let scalingFactor = 1;
  if (sum > 1e6) {
    scalingFactor = 0.000001;
    unit = 'MWh';
  }
  else if (sum > 1000) {
    scalingFactor = 0.001;
    unit = 'kWh';
  }

  return Math.round(Math.random()*800) + ' W'
  return <PendingEnergyState />

  return `${(sum*scalingFactor).toFixed(1)} ${unit}`;
}


function PendingEnergyState(props) {
  return <View style={{flex:1, alignItems:'flex-end', paddingRight:15}} ><ActivityIndicator size={"small"} /></View>
}

function getColor(locationId) {
  return cachedData.colorMap[locationId];
}


function PowerUsageContentNoSphere(props) {
  return (
    <View style={{flex:1, alignItems:'flex-start', justifyContent:'center', paddingTop:topBarHeight}}>
      <View style={{flex:1}} />
      <Text style={{fontSize:22, fontWeight:'bold', padding:30}}>{"No sphere selected..."}</Text>
      <Text style={{fontSize:16, fontWeight:'bold', padding:30}}>{"Go to the overview and select a sphere."}</Text>
      <View style={{flex:3}} />
    </View>
  );
}

function EnergyUsageHeader(props) {
  return (
    <View style={{paddingLeft:15}}>
      <HeaderTitle title={'Energy usage'} />
    </View>
  );
}



function getDayData(startDate) {
  return getData(startDate,24, 3600, 100, true);
}
function getWeekData(startDate) {
  return getData(startDate,7, 10*3600, 100, false);
}

function getMonthData(startDate) {
  return getData(startDate,31, 10*3600, 100, false);
}

function getYearData(startDate) {
  return getData(startDate,12, 30*10*3600, 100, false);
}

const defaultColorList = [
  colors.csBlue.hex,
  colors.csBlueDark.hex,
  colors.csBlueDarker.hex,
  colors.csBlueLight.hex,
  colors.csBlueLighter.hex,
  colors.csBlueLightDesat.hex,
  colors.csOrange.hex,
  colors.lightCsOrange.hex,
  colors.blue.hex,
  colors.blueDark.hex,
  colors.blue3.hex,
  colors.iosBlue.hex,
  colors.iosBlueDark.hex,
  colors.lightBlue.hex,
  colors.lightBlue2.hex,
  colors.blinkColor1.hex,
  colors.blinkColor2.hex,
  colors.green.hex,
  colors.lightGreen2.hex,
  colors.lightGreen.hex,
  colors.green2.hex,
  colors.darkGreen.hex,
  colors.purple.hex,
  colors.darkPurple.hex,
  colors.darkerPurple.hex,
  colors.red.hex,
  colors.darkRed.hex,
  colors.menuRed.hex,
  colors.gray.hex,
  colors.darkGray.hex,
  colors.darkGray2.hex,
];

const genList = [
  colors.csBlueLighter.hex,
  colors.csBlue.hex,
  colors.csBlueDarker.hex,
  colors.blue.hex,
  // colors.green.hex,
  colors.lightCsOrange.hex,
  colors.csOrange.hex,
  // colors.red.hex,
  // colors.lightBlue.hex,
  // colors.darkGreen.hex,
  // colors.lightGreen.hex,
  // colors.purple.hex,
  // colors.darkerPurple.hex,
];

const ColorCharmMixer = new Mixer();

function getData(startDate, count, maxValue, minValue, useGaussian: boolean) : EnergyData {
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

  let locations : any = [];
  for (let locationId in activeSphere.locations) {
    let location = activeSphere.locations[locationId];
    locations.push({name: location?.config?.name ?? "Unknown room", location, id: locationId});
  }
  locations.sort((a,b) => { return a.name > b.name ? 1 : -1});

  console.log('defaultColorList', defaultColorList)
  let gradient = ColorCharmMixer.linear([genList], locations.length, 'hcl').toHex();
  console.log('gradient', gradient)
  let colorMap = {};
  let index = 0;
  for (let data of locations) {
    colorMap[data.id] = gradient[index++%gradient.length];
  }

  let data = []
  for (let i = 0; i < valueCount; i++) {
    data.push({});
    let value;

    for (let locationData of locations) {
      if (useGaussian) {
        value = gaussian(i)*Math.random()*maxValue+ Math.random()*minValue;
      }
      else {
        value = Math.random()*maxValue+ Math.random()*minValue;
      }
      data[i][locationData.id] = value;
    }
  }
  /** end of Generate Data **/
  cachedData = {startTime: startDate, colorMap, data};

  return cachedData;
}


