
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("EnergyUsage", key)(a,b,c,d,e);
}
import * as React from 'react';
import {useEffect, useState} from "react";
import {
  screenWidth,
  statusBarHeight, styles,
  tabBarHeight,
  topBarHeight
} from "../styles";
import { View, Text, ScrollView} from "react-native";
import { BackgroundCustomTopBarNavbar } from "../components/Background";
import { TopBarBlur } from "../components/NavBarBlur";
import { HeaderTitle } from "../components/HeaderTitle";
import { Get } from "../../util/GetUtil";
import { useDatabaseChange } from "../components/hooks/databaseHooks";
import { TimeButton } from "./components/TimeButton";
import { LiveRoomList} from "./components/LiveLists";
import { CLOUD} from "../../cloud/cloudAPI";
import { ContentNoSphere} from "./components/ContentNoSphere";
import { HistoricalEnergyUsageOverview} from "./components/HistoricalEnergyUsageOverview";


export function EnergyUsage(props) {
  useDatabaseChange(['updateActiveSphere']);
  return (
    <BackgroundCustomTopBarNavbar testID={'energyUsageTab'}>
      <EnergyUsageContent sphereId={Get.activeSphereId()}/>
    </BackgroundCustomTopBarNavbar>
  );
}

async function checkUploadPermission(sphereId) {
  try {
    return await CLOUD.forSphere(sphereId).getEnergyUploadPermission();
  }
  catch (err) {}

  // fallback.
  let sphere = Get.sphere(sphereId);
  if (sphere) {
    return sphere.features.ENERGY_COLLECTION_PERMISSION?.enabled ?? false;
  }
  return false;
}

// {
//   "energyUsage": 1250526,
//   "stoneId": "1",
//   "timestamp": "2022-02-04T23:00:00.000Z",
// }

function EnergyUsageContent(props) {
  useDatabaseChange(['changeSphereFeatures']);

  let [checkedUploadPermission, setCheckedUploadPermission] = useState<boolean>(false);
  let [hasUploadPermission,     setHasUploadPermission]     = useState<boolean>(false);
  let [mode, setMode]                                       = useState<GRAPH_TYPE>("LIVE");
  let [startDate, setStartDate]                             = useState<number>(Date.now());

  useEffect(() => {
    setCheckedUploadPermission(false);
  }, [props.sphereId])

  useEffect(() => {
    if (mode !== "LIVE" && checkedUploadPermission === false) {
      checkUploadPermission(props.sphereId)
        .then((result) => {
          setCheckedUploadPermission(true);
          setHasUploadPermission(result);
        })
    }
  }, [mode, props.sphereId, checkedUploadPermission]);


  let activeSphere = Get.sphere(props.sphereId);
  if (!activeSphere) {
    return <ContentNoSphere />;
  }

  let permission = Get.energyCollectionPermission(props.sphereId);
  if (permission !== hasUploadPermission) {
    setHasUploadPermission(permission);
  }

  return (
    <React.Fragment>
      <ScrollView contentContainerStyle={{
        flexGrow:1,
        paddingTop: topBarHeight-statusBarHeight,
        alignItems:'center', justifyContent:"center",
        paddingBottom:2*tabBarHeight
      }}>
        <View style={{flexDirection:'row', justifyContent:'space-evenly', width: screenWidth}}>
          <TimeButton selected={mode == "LIVE"}  label={ lang("LIVE")}   callback={() => { setMode("LIVE");  }} />
          <TimeButton selected={mode == "DAY"}   label={ lang("Day")}    callback={() => { setMode("DAY");   }} />
          <TimeButton selected={mode == "WEEK"}  label={ lang("Week")}   callback={() => { setMode("WEEK");  }} />
          <TimeButton selected={mode == "MONTH"} label={ lang("Months")} callback={() => { setMode("MONTH"); }} />
          <TimeButton selected={mode == "YEAR"}  label={ lang("Years")}  callback={() => { setMode("YEAR");  }} />
        </View>
        {
          mode !== "LIVE" ?
            <HistoricalEnergyUsageOverview
              sphereId={props.sphereId}
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

function EnergyUsageHeader(props: {mode: GRAPH_TYPE}) {
  return (
    <View style={{paddingLeft:15}}>
      <HeaderTitle title={props.mode === "LIVE" ? 'Power usage' : 'Energy usage'} />
    </View>
  );
}


