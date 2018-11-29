
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemsToSphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  Linking,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
let Actions = require('react-native-router-flux').Actions;

import { LOG }       from '../../logging/Log'
import {screenWidth, availableScreenHeight, topBarHeight, colors, OrangeLine} from '../styles'
import {Background} from "../components/Background";
import {deviceStyles} from "../deviceViews/DeviceOverview";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import {textStyle} from "../deviceViews/elements/DeviceBehaviour";
import {Util} from "../../util/Util";
import {IconButton} from "../components/IconButton";
import {BackAction} from "../../util/Back";

let iconSize = 100;

export const addCrownstoneExplanationAlert = (actionOnOK = () => {}) => {
  Alert.alert(
lang("_Adding_a_Crownstone__Plu_header"),
lang("_Adding_a_Crownstone__Plu_body"),
[{text: lang("_Adding_a_Crownstone__Plu_left"), style:'cancel',onPress: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }},
      {
text: lang("_Adding_a_Crownstone__Plu_right"), onPress: () => { actionOnOK() }}]
  );
}

export class AddItemsToSphere extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    if (params === undefined) { return }

    return {
      title: lang("Add_to_Sphere"),
    }
  };

  render() {
    return (
      <Background image={this.props.backgrounds.detailsDark} hasNavBar={false}>
        <OrangeLine/>
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
              buttonStyle={{backgroundColor:colors.csBlue.hex, borderRadius: 0.2*iconSize}}
            />
            <View style={{height: 0.2*iconSize}} />
            <Text style={textStyle.specification}>{ lang("You_can_add_Rooms__People") }</Text>
            <View style={{height: 0.2*iconSize}} />
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'md-cube'} label={ lang("Room")} callback={() => { Actions.roomAdd({sphereId: this.props.sphereId }); }} />
              <AddItem icon={'c2-crownstone'} label={ lang("Crownstone")} callback={() => { addCrownstoneExplanationAlert(() => { BackAction(); }); }} />
            </View>
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'ios-body'} label={ lang("Person")} callback={() => { Actions.sphereUserInvite({sphereId: this.props.sphereId}) }} />
              <AddItem icon={'ios-link'} label={ lang("Something_else_")} callback={() => { Actions.sphereIntegrations({sphereId: this.props.sphereId}) }} />
            </View>
          </View>
          <View style={{height: 30}} />
        </ScrollView>
      </Background>
    );
  }
}

class AddItem extends Component<any, any> {
  render() {
    return (
      <TouchableOpacity style={{alignItems:'center', padding:10}} onPress={() => { this.props.callback(); }}>
        <IconButton
          name={this.props.icon}
          size={0.75*iconSize}
          color={colors.white.hex}
          addColor={colors.menuBackground.hex}
          addIcon={true}
          buttonSize={iconSize}
          buttonStyle={{backgroundColor:colors.green.hex, borderRadius: 0.2*iconSize}}
        />
        <Text style={{paddingTop:10, color: colors.white.hex, fontWeight:'bold'}}>{this.props.label}</Text>
      </TouchableOpacity>
    );
  }
}