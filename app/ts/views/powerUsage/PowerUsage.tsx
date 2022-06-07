import * as React from 'react';
import {Component} from "react";
import { appStyleConstants, colors, screenHeight, screenWidth, topBarHeight } from "../styles";
import { TouchableOpacity, View, Text, } from "react-native";
import { BackgroundCustomTopBarNavbar } from "../components/Background";
import { TopBarBlur } from "../components/NavBarBlur";
import { EditIcon, MenuButton } from "../components/EditIcon";
import { HeaderTitle } from "../components/HeaderTitle";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Get } from "../../util/GetUtil";
import { useDatabaseChange, useForceUpdate } from "../components/hooks/databaseHooks";
import { BlurView } from "@react-native-community/blur";
import { StaticEnergyGraphSphereSvg } from "./graphs/StaticEnergyGraphSphereSvg";

export function PowerUsage(props) {
  return (
    <BackgroundCustomTopBarNavbar>
      <PowerUsageContent />
      <TopBarBlur>
        <PowerUsageHeader />
      </TopBarBlur>
    </BackgroundCustomTopBarNavbar>
  );
}


function PowerUsageContent(props) {
  useDatabaseChange(['updateActiveSphere']);
  let activeSphere = Get.activeSphere();
  if (!activeSphere) {
    return <PowerUsageContentNoSphere />
  }


  let locations = activeSphere.locations;

  return (
    <View style={{paddingTop: topBarHeight, alignItems:'center', justifyContent:"center"}}>
      <StaticEnergyGraphSphereSvg />
    </View>
  );
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

function PowerUsageHeader(props) {
  return (
    <View style={{paddingLeft:15}}>
        <HeaderTitle title={'Power usage'} />
    </View>
  );
}
