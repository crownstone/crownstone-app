import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight, OrangeLine} from '../../styles'
import {Util} from "../../../util/Util";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "../../../util/DataUtil";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {Background} from "../../components/Background";
import {Icon} from "../../components/Icon";
import {IconButton} from "../../components/IconButton";
import {ScaledImage} from "../../components/ScaledImage";


export class SwitchCraftInformation extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "SwitchCraft",
    }
  };
  // "SwitchCraft is a new, experimental feature of the Crownstone that allows you to switch your lights with both Crownstone and an existing wall switch." +
  render() {
    let legendTextStyles = {fontSize:12, textAlign:'center', paddingTop:10};
    let legendViewStyle = {alignItems:"center", justifyContent:'center'};
    let explanationStyle = {fontSize:15, padding: 20, paddingTop:30, textAlign:'center'};
    let headerStyle = {...explanationStyle, fontSize:18, fontWeight:'bold'};
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.menu}>
        <OrangeLine/>
        <ScrollView >
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <View style={{height:40}} />
            <ScaledImage source={require('../../../images/switchCraft/switchCraftText.png')} sourceWidth={1000} sourceHeight={161} targetWidth={0.75*screenWidth} />
            <View style={{height:40}} />
            <IconButton name="md-power" buttonSize={80} size={60} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green.hex}} />
            <View style={{height:10}} />
            <Text style={explanationStyle}>{
              "Switchcraft is a new, experimental feature of the Crownstone that allows you to switch your lights with both Crownstone and an existing wall switch." +
              "\n\nIt is designed for Built-in Crownstones that are mounted in a ceiling light fixture." +
              "\n\nUsually, if you have a Crownstone in your ceiling light and the wall switch is off, there is no power to the Crownstone so it cannot switch the light." +
              "\n\nLet's take a look a the situation before Crownstone:"}
            </Text>
            <ScaledImage source={require('../../../images/switchCraft/switchCraft_normal_before.png')} sourceWidth={752} sourceHeight={563} targetWidth={0.75*screenWidth} />
            <Text style={explanationStyle}>{"The symbols shown have the following meaning:"}</Text>
            <View style={{flexDirection:'row', paddingTop:20}}>
              <View style={{flex:1}} />
              <View style={legendViewStyle}><ScaledImage source={require('../../../images/switchCraft/legend/lamp.png')} sourceWidth={97} sourceHeight={97} targetWidth={0.1*screenWidth} /><Text style={legendTextStyles}>Lamp</Text></View>
              <View style={{flex:1}} />
              <View style={legendViewStyle}><ScaledImage source={require('../../../images/switchCraft/legend/powerSupply.png')} sourceWidth={81} sourceHeight={81} targetWidth={0.1*screenWidth} /><Text style={legendTextStyles}>Mains</Text></View>
              <View style={{flex:1}} />
              <View style={legendViewStyle}><ScaledImage source={require('../../../images/switchCraft/legend/switch.png')} sourceWidth={110} sourceHeight={110} targetWidth={0.1*screenWidth} /><Text style={legendTextStyles}>Switch</Text></View>
              <View style={{flex:1}} />
              <View style={legendViewStyle}><ScaledImage source={require('../../../images/switchCraft/legend/builtinCrownstone.png')} sourceWidth={119} sourceHeight={73} targetWidth={0.1*screenWidth} /><Text style={legendTextStyles}>{"Built-in\nCrownstone"}</Text></View>
              <View style={{flex:1}} />
            </View>
            <Text style={explanationStyle}>{
              "After installing the built-in Crownstone it should look like this:"}
            </Text>
            <ScaledImage source={require('../../../images/switchCraft/switchCraft_normal_after.png')} sourceWidth={1001} sourceHeight={590} targetWidth={0.85*screenWidth} />
            <Text style={explanationStyle}>{
              "The adaptation in the image above shows the required change to enable Switchcraft. Most switches have 3 ports, where each port can have 2 slots. Let's take a look a the switch below:"}
            </Text>
            <ScaledImage source={require('../../../images/switchCraft/pre_sluusje_edit_small.png')} sourceWidth={1031} sourceHeight={1000} targetWidth={0.8*screenWidth} />
            <Text style={explanationStyle}>{
              "At the top, where the brown wire goes in, that's where the power comes from the mains. In most cases, there will be one wire going out: to the light." +
              "\n\nIn the next picture we see the adaptation " +
              "which will allow this switch to be used with Switchcraft:"}
            </Text>
            <ScaledImage source={require('../../../images/switchCraft/post_sluusje_edit_small.png')} sourceWidth={1262} sourceHeight={1000} targetWidth={0.8*screenWidth} />
            <Text style={explanationStyle}>{
              "That's all! When you're going to upgrade your existing wall switches to work with Switchcraft, make sure that there is NO POWER ON THE MAINS!" +
              "\n\nSince this is an experimental feature, we would like to get your feedback at team@crownstone.rocks."}
            </Text>
            <Text style={headerStyle}>{"Enjoy Switchcraft!"}</Text>
            <View style={{height:100}} />
          </View>
        </ScrollView>
      </Background>
    )
  }
}