
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemsToSphere", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import { colors, deviceStyles, background } from "../styles";
import {Background} from "../components/Background";
import {IconButton} from "../components/IconButton";
import { core } from "../../Core";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { SettingsBackground } from "../components/SettingsBackground";


let iconSize = 100;

export class AddItemsToSphere extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Add_to_your_Sphere"), closeModal:true});
  }



  render() {
    let hightlightAddCrownstoneButton = false;
    if (Permissions.inSphere(this.props.sphereId).seeSetupCrownstone) {
      let state = core.store.getState();
      let sphere = state.spheres[this.props.sphereId];
      if (sphere) {
        if (Object.keys(sphere.stones).length === 0) {
          hightlightAddCrownstoneButton = true;
        }
      }
    }

    return (
      <SettingsBackground testID={"SphereAdd"}>
        <ScrollView contentContainerStyle={{flexGrow:1}}>
          <View style={{flexGrow: 1, alignItems:'center', paddingTop:30}}>
            {/*<IconButton*/}
            {/*  name="c1-sphere"*/}
            {/*  size={0.75*iconSize}*/}
            {/*  color="#fff"*/}
            {/*  buttonSize={iconSize}*/}
            {/*  buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}*/}
            {/*/>*/}
            <Text style={deviceStyles.specification}>{ lang("You_can_add_Rooms__People") }</Text>
            <View style={{height: 0.2*iconSize}} />
            <View  style={{flexDirection:'row', alignItems:'center'}}>
              <AddItem icon={'md-cube'} label={ lang("Room")} testID={"AddRoom"} callback={() => {
                NavigationUtil.launchModal("RoomAdd", { sphereId: this.props.sphereId, isModal: true });
              }} />
              <AddItem icon={'c2-crownstone'} highlight={hightlightAddCrownstoneButton} label={ lang("Crownstone")} testID={"AddCrownstone_button"} callback={() => {
                NavigationUtil.launchModal("AddCrownstone", {sphereId: this.props.sphereId});
              }}
              />
            </View>
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'ios-body'} label={ lang("Person")} testID={"AddPerson"} callback={() => {
                NavigationUtil.launchModal("SphereUserInvite",{sphereId: this.props.sphereId});
              }} />
              <AddItem icon={'ios-link'} label={ lang("Something_else_")} testID={"AddSomethingElse"} callback={() => {
                NavigationUtil.launchModal("SphereIntegrations",{sphereId: this.props.sphereId, isModal: true})
              }} />
            </View>
            <View style={{height: 30}} />
          </View>
        </ScrollView>
      </SettingsBackground>
    );
  }
}

function AddItem(props) {
  let usedIconSize = iconSize;

  return (
    <TouchableOpacity style={{alignItems:'center', padding:10}} onPress={() => { props.callback(); }} testID={props.testID}>
      <IconButton
        name={props.icon}
        size={0.75*usedIconSize}
        color={colors.green.hex}
        addColor={colors.menuBackground.hex}
        addIcon={true}
        buttonSize={usedIconSize + 6}
        buttonStyle={{
          borderRadius: 0.15*usedIconSize,
          borderColor:  colors.white.hex,
          borderWidth:  2
        }}
      />
      <Text style={{paddingTop:10, color: colors.csBlueDark.hex, fontWeight:'bold'}}>{props.label}</Text>
    </TouchableOpacity>
  );
}
