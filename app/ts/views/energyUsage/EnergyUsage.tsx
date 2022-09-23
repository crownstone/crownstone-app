
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("EnergyUsage", key)(a,b,c,d,e);
}
import * as React from 'react';
import {useEffect, useState} from "react";
import {
  availableScreenHeight,
  colors,
  screenWidth,
  statusBarHeight, styles,
  tabBarHeight,
  topBarHeight
} from "../styles";
import {TouchableOpacity, View, Text, ScrollView, ViewStyle, Alert, ActivityIndicator, Linking} from "react-native";
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
import {LiveRoomList} from "./components/LiveLists";
import {RoomList} from "./components/HistoricalDataLists";
import {Scheduler} from "../../logic/Scheduler";
import {Button} from "../components/Button";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {core} from "../../Core";

let cachedData = null;

export function EnergyUsage(props) {
  return (
    <BackgroundCustomTopBarNavbar testID={'energyUsageTab'}>
      <EnergyUsageContent />
    </BackgroundCustomTopBarNavbar>
  );
}


async function checkUploadPermission() {
  await Scheduler.delay(200);
  return false;
}

// {
//   "energyUsage": 1250526,
//   "interval": "1d",
//   "stoneId": "1",
//   "timestamp": "2022-02-04T23:00:00.000Z",
// }

function EnergyUsageContent(props) {
  useDatabaseChange(['updateActiveSphere', 'changeSphereFeatures']);
  let [checkedUploadPermission, setCheckedUploadPermission] = useState<boolean>(false);
  let [hasUploadPermission,     setHasUploadPermission]     = useState<boolean>(false);
  let [mode, setMode]                                       = useState<GRAPH_TYPE>("LIVE");
  let [startDate, setStartDate]                             = useState<number>(Date.now());

  useEffect(() => {
    if (mode !== "LIVE" && checkedUploadPermission === false) {
      checkUploadPermission()
        .then((result) => {
          setCheckedUploadPermission(true);
          setHasUploadPermission(result);
        })
    }
  }, [mode, checkedUploadPermission]);


  let activeSphere = Get.activeSphere();
  if (!activeSphere) {
    return <ContentNoSphere />;
  }

  let permission = Get.energyCollectionPermission(activeSphere.id);
  if (permission !== hasUploadPermission) {
    setHasUploadPermission(permission);
  }

  return (
    <React.Fragment>
      <ScrollView contentContainerStyle={{flexGrow:1, paddingTop: topBarHeight-statusBarHeight, alignItems:'center', justifyContent:"center", paddingBottom:2*tabBarHeight}}>
        <View style={{flexDirection:'row', justifyContent:'space-evenly', width: screenWidth}}>
          <TimeButton selected={mode == "LIVE"}  label={ lang("LIVE")}   callback={() => { setMode("LIVE");  }} />
          <TimeButton selected={mode == "DAY"}   label={ lang("Day")}    callback={() => { setMode("DAY");   }} />
          <TimeButton selected={mode == "WEEK"}  label={ lang("Week")}   callback={() => { setMode("WEEK");  }} />
          <TimeButton selected={mode == "MONTH"} label={ lang("Months")} callback={() => { setMode("MONTH"); }} />
          <TimeButton selected={mode == "YEAR"}  label={ lang("Years")}  callback={() => { setMode("YEAR");  }} />
        </View>
        {
          mode !== "LIVE" ?
            <HistoricalEnergyUsage
              sphereId={activeSphere.id}
              mode={mode}
              startDate={startDate}
              setStartDate={setStartDate}
              hasUploadPermission={hasUploadPermission}
              setHasUploadPermission={setHasUploadPermission}
              checkedUploadPermission={checkedUploadPermission}
            />
             :
            <LiveRoomList />
        }
      </ScrollView>
      <TopBarBlur xlight>
        <EnergyUsageHeader mode={mode} />
      </TopBarBlur>
    </React.Fragment>
  );
}


function HistoricalEnergyUsage(props : {sphereId: sphereId, mode: GRAPH_TYPE, startDate: number, setStartDate: (date: number) => void, hasUploadPermission: boolean, checkedUploadPermission: boolean, setHasUploadPermission: (hasPermission: boolean) => void}) {
  let leftRightStyle : ViewStyle = {flex:1, justifyContent:'center', alignItems:'center'};

  if (props.checkedUploadPermission === false) {
    // we're still getting the permission state, waiting....
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <ActivityIndicator size={'large'} color={colors.black.rgba(0.5)} />
        <View style={{flex:0.5}}/>
        <Text style={{fontSize: 20, color: colors.black.hex, fontWeight:'bold'}}>{ 'Checking permission...' }</Text>
        <View style={{flex:3}}/>
      </View>
    )
  }

  if (props.hasUploadPermission === false && Permissions.inSphere(props.sphereId).canProvideEnergyPermission === false) {
    // show the banner that the user has not given permission to upload data.
    // allow the user to minimize the view if he wants to see the uploaded data.
    // if he does that a banner should show to re-enable.
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <Text style={styles.header}>{ 'User permission required.' }</Text>
        <Text style={styles.boldExplanation}>{ "If you'd like us to store your energy usage in the cloud, a sphere admin has to give permission." }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/privacy');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ "You can read about the way we store the data here." }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ "Once enabled, it becomes possible for hubs like Home Assistant to gather Crownstone power measurements and send them to our cloud to show to you here." }</Text>
        <Text style={styles.explanation}>{ "The permission can be revoked in the app settings." }</Text>
        <View style={{flex:2}}/>
      </View>
    );
  }
  
  if (props.hasUploadPermission === false) {
    // show the banner that the user has not given permission to upload data.
    // allow the user to minimize the view if he wants to see the uploaded data.
    // if he does that a banner should show to re-enable.
    return (
      <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
        <View style={{flex:1}}/>
        <Text style={styles.header}>{ 'User permission required.' }</Text>
        <Text style={styles.boldExplanation}>{ "If you'd like us to store your energy usage in the cloud, please provide permission by tapping the button below." }</Text>
        <TouchableOpacity onPress={async () => {
          Linking.openURL('https://crownstone.rocks/privacy');
        }}>
          <Text style={{...styles.boldExplanation, textDecorationLine:'underline'}}>{ "You can read about the way we store the data here." }</Text>
        </TouchableOpacity>
        <Text style={styles.explanation}>{ "Once enabled, it becomes possible for hubs like Home Assistant to gather Crownstone power measurements and send them to our cloud to show to you here." }</Text>
        <Text style={styles.explanation}>{ "You can revoke permission in the app settings." }</Text>
        <View style={{flex:1}}/>
          <Button backgroundColor={colors.green.rgba(0.8)} width={0.8*screenWidth} fontColor={colors.black.hex} hideIcon label={ "Give permission" } callback={() => {
            // DO CLOUD CALL
            let result = true;
            core.store.dispatch({type:"ADD_SPHERE_FEATURE", sphereId: props.sphereId, featureId: "ENERGY_COLLECTION_PERMISSION", data:{enabled: result}} );
          }}/>
        <View style={{flex:1}}/>
      </View>
    );
  }

  let indicator;
  switch(props.mode) {
    case "LIVE":
      break;
    case "DAY":
      indicator = xUtil.getDateFormat(cachedData.startTime)
      break;
    case "WEEK":
      indicator = `${xUtil.getDateFormat(cachedData.startTime)} - ${xUtil.getDateFormat(cachedData.startTime+7*24*3600000)}`;
      break;
    case "MONTH":
      indicator = `${MONTH_LABEL_MAP(MONTH_INDICES[new Date(cachedData.startTime).getMonth()])} ${new Date(cachedData.startTime).getFullYear()}`;
      break;
    case "YEAR":
      indicator = new Date(cachedData.startTime).getFullYear()
      break;
  }


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
      <TouchableOpacity
        style={{backgroundColor: colors.csBlue.hex, height:40, ...styles.centered, width: screenWidth}}
        onPress={showDemoAlert}
      >
        <Text style={{color: colors.white.hex, fontWeight: 'bold'}}>{ lang("DEMO_MODE") }</Text>
      </TouchableOpacity>
      <EnergyGraphAxisSvg data={cachedData} type={props.mode} width={0.9*screenWidth} height={200} />
      <RoomList mode={props.mode} data={cachedData} />
    </React.Fragment>
  );
}

export function showDemoAlert() {
  Alert.alert(
    lang("_Coming_soon___Were_worki_header"),
    lang("_Coming_soon___Were_worki_body"),
[{text:lang("_Coming_soon___Were_worki_left")}]
  );
}


export function ContentNoSphere(props) {
  return (
    <View style={{flex:1, alignItems:'flex-start', justifyContent:'center', paddingTop:topBarHeight}}>
      <View style={{flex:1}} />
      <Text style={{fontSize:22, fontWeight:'bold', padding:30}}>{ lang("No_sphere_selected___") }</Text>
      <Text style={{fontSize:16, fontWeight:'bold', padding:30}}>{ lang("Go_to_the_overview_and_se") }</Text>
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



