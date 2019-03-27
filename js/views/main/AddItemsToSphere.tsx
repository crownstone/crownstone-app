
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("AddItemsToSphere", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import { screenWidth, colors, OrangeLine, deviceStyles } from "../styles";
import {Background} from "../components/Background";
import {textStyle} from "../deviceViews/elements/DeviceBehaviour";
import {IconButton} from "../components/IconButton";
import { core } from "../../core";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { NavigationUtil } from "../../util/NavigationUtil";


let iconSize = 100;

export const addCrownstoneExplanationAlert = (actionOnOK = () => {}) => {
  Alert.alert(
    lang("_Adding_a_Crownstone__Plu_header"),
    lang("_Adding_a_Crownstone__Plu_body"),
    [{text: lang("_Adding_a_Crownstone__Plu_left"), style:'cancel',onPress: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }},
          {
    text: lang("_Adding_a_Crownstone__Plu_right"), onPress: () => { actionOnOK() }}]
  );
};

export class AddItemsToSphere extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    if (params === undefined) { return }

    return {
      title: lang("Add_to_Sphere"),
      headerLeft: <TopbarBackButton text={lang("Back")} onPress={() => { NavigationUtil.back(); }} />
    }
  };

  render() {
    return (
      <Background image={core.background.detailsDark} hasNavBar={false}>
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
              <AddItem icon={'md-cube'} label={ lang("Room")} callback={() => {
                NavigationUtil.navigateAndReplace("RoomAdd", { sphereId: this.props.sphereId });
              }} />
              <AddItem icon={'c2-crownstone'} label={ lang("Crownstone")} callback={() => { addCrownstoneExplanationAlert(() => { NavigationUtil.back(); }); }} />
            </View>
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'ios-body'} label={ lang("Person")} callback={() => {
                NavigationUtil.navigateAndReplace("SphereUserInvite",{sphereId: this.props.sphereId});
              }} />
              <AddItem icon={'ios-link'} label={ lang("Something_else_")} callback={() => {
                NavigationUtil.navigateAndReplaceVia("SphereEdit","SphereIntegrations",{sphereId: this.props.sphereId})
              }} />
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