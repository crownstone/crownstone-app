
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemsToSphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import { screenWidth, colors, deviceStyles } from "../styles";
import {Background} from "../components/Background";
import {textStyle} from "../deviceViews/elements/DeviceBehaviour";
import {IconButton} from "../components/IconButton";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";


let iconSize = 100;

export class AddItemsToSphere extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Add_to_Sphere"), closeModal:true});
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
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, alignItems:'center' }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>{ lang("Add_to_your_Sphere") }</Text>
            <View style={{height: 0.2*iconSize}} />
            <IconButton
              name="c1-sphere"
              size={0.75*iconSize}
              color="#fff"
              buttonSize={iconSize}
              buttonStyle={{backgroundColor:colors.csBlueDark.hex, borderRadius: 0.2*iconSize}}
            />
            <View style={{height: 0.2*iconSize}} />
            <Text style={deviceStyles.specification}>{ lang("You_can_add_Rooms__People") }</Text>
            <View style={{height: 0.2*iconSize}} />
            <View  style={{flexDirection:'row', alignItems:'center'}}>
              <AddItem icon={'md-cube'} label={ lang("Room")} callback={() => {
                NavigationUtil.launchModal("RoomAdd", { sphereId: this.props.sphereId, isModal: true });
              }} />
              <AddItem icon={'c2-crownstone'} highlight={hightlightAddCrownstoneButton} label={ lang("Crownstone")} callback={() => {
                NavigationUtil.launchModal("AddCrownstone", {sphereId: this.props.sphereId});
              }} />
            </View>
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'ios-body'} label={ lang("Person")} callback={() => {
                NavigationUtil.launchModal("SphereUserInvite",{sphereId: this.props.sphereId});
              }} />
              <AddItem icon={'ios-link'} label={ lang("Something_else_")} callback={() => {
                NavigationUtil.launchModal("SphereIntegrations",{sphereId: this.props.sphereId, isModal: true})
              }} />
            </View>
          </View>
          <View style={{height: 30}} />
        </ScrollView>
      </Background>
    );
  }
}

function AddItem(props) {
  let usedIconSize = iconSize;
  if (props.highlight) { usedIconSize = 1.3*iconSize}

  return (
    <TouchableOpacity style={{alignItems:'center', padding:10}} onPress={() => { props.callback(); }}>
      <IconButton
        name={props.icon}
        size={0.75*usedIconSize}
        color={colors.white.hex}
        addColor={props.highlight ? colors.green.hex : colors.menuBackground.hex}
        addIcon={true}
        buttonSize={usedIconSize + 6}
        buttonStyle={{
          backgroundColor: props.highlight ? colors.menuTextSelected.hex : colors.green.hex,
          borderRadius: 0.2*usedIconSize,
          borderColor: colors.white.rgba(0.8),
          borderWidth: 4
        }}
      />
      <Text style={{paddingTop:10, color: colors.csBlueDark.hex, fontWeight:'bold'}}>{props.label}</Text>
    </TouchableOpacity>
  );
}