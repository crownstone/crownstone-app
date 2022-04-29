import * as React from 'react';
import {Image, TextStyle, TouchableOpacity, View, Text, Share} from "react-native";
import { colors } from "../styles";
import { Icon } from "../components/Icon";
import DeviceInfo from "react-native-device-info";
import { NavigationUtil } from "../../util/NavigationUtil";
import { SPHERE_ID_STORE } from "../main/SphereOverview";
import { core } from "../../Core";
import {Navigation} from "../RootNavigation";
import { useDrawerStatus } from '@react-navigation/drawer';
import {useBottomTabBarHeight} from "@react-navigation/bottom-tabs";

export function SphereOverviewSideBar(props) {
  let [lastStatus, setLastStatus] = React.useState(null);
  let status = useDrawerStatus()
  if (status === 'closed' && lastStatus !== 'closed') {
    Navigation.closeDrawer(true);
  }
  if (lastStatus !== status) { setLastStatus(status); }
  let tabBarHeight = useBottomTabBarHeight();

  let factor = 0.25;

  const state = core.store.getState();
  let amountOfSpheres = Object.keys(state.spheres).length;

  return (
    <View style={{flex:1, backgroundColor: colors.csBlue.hex, paddingLeft:25}}>
      <View style={{height:50}}/>
      <Image source={require('../../../assets/images/crownstoneLogo.png')} style={{width:factor * 300, height: factor*300, tintColor: colors.white.hex}}/>
      <View style={{height:50}}/>
      {amountOfSpheres > 1 && <SideMenuLink label={"Change sphere"} callback={() => { core.eventBus.emit("VIEW_SPHERES"); }} size={22} icon={'c1-house'}        />}
      <SideMenuLink label={"Add items"}     callback={() => { NavigationUtil.launchModal( "AddItemsToSphere",{sphereId: SPHERE_ID_STORE.activeSphereId}); }} size={23} icon={'md-add-circle'}   />
      <SideMenuLink label={"Localization"}  callback={() => { NavigationUtil.launchModal( "LocalizationMenu",{sphereId: SPHERE_ID_STORE.activeSphereId}); }} size={22} icon={'c1-locationPin1'} />
      <View style={{height:50}}/>
      <SideMenuLink label={"Settings"}      callback={() => { NavigationUtil.launchModal( "SphereEdit", { sphereId: SPHERE_ID_STORE.activeSphereId }) }} size={25} icon={'ios-cog'}         />
      <SideMenuLink label={"Developer"}     callback={() => { }} size={22} icon={'ios-bug'}         />

      <View style={{flex:1}}/>
      <Text style={{color: colors.white.rgba(0.5)}}>{"App v"+DeviceInfo.getReadableVersion()}</Text>
      <View style={{height:tabBarHeight}}/>
    </View>
  );
}


function SideMenuLink({ label, callback, icon, size }) {
  let linkStyle : TextStyle = {
    color: colors.white.hex,
    fontSize: 20,
    fontWeight: '400',
    paddingLeft:10,
  }
  return (
    <TouchableOpacity style={{flexDirection:'row', height:50, alignItems:'center'}} onPress={() => {
      Navigation.closeDrawer();
      setTimeout(() => {callback();}, 200);
    }}>
      <View style={{width: 25, height:50, justifyContent:'center', alignItems:'center'}}>
        <Icon name={icon} color={colors.white.hex} size={size} />
      </View>
      <Text style={linkStyle}>{label}</Text>
    </TouchableOpacity>
  );
}
