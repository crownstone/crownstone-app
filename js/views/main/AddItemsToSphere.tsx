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

export class AddItemsToSphere extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    if (params === undefined) { return }

    return {
      title: "Add to Sphere",
    }
  };



  render() {
    /**
     * eventBus.emit("showBlurredMenu", {
            fields:[
              {label:'Add Room',       onPress: () => { Actions.roomAdd({sphereId: params.activeSphereId}); }},
              {label:'Add Crownstone', onPress: () => {
                  Alert.alert(
                    "Adding a Crownstone",
                    "Plug the new Crownstone in and hold your phone close to it (touching it). " +
                    "It will automatically show up in this overview." +
                    "\n\nYou don't have to press this button for each Crownstone you add :).",
                    [{text: 'Buy', onPress: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }},{text: 'OK'}]
                  );
                }},
            ], position:{top: topBarHeight - 10, right:5}
     */
    return (
      <Background image={this.props.backgrounds.detailsDark} hasNavBar={false}>
        <OrangeLine/>
        <ScrollView>
          <View style={{ width: screenWidth, alignItems:'center' }}>
            <View style={{height: 30}} />
            <Text style={[deviceStyles.header]}>Adding Items to your Sphere</Text>
            <View style={{height: 0.2*iconSize}} />
            <IconButton
              name="c1-sphere"
              size={0.75*iconSize}
              color="#fff"
              buttonSize={iconSize}
              buttonStyle={{backgroundColor:colors.csBlue.hex, borderRadius: 0.2*iconSize}}
            />
            <View style={{height: 0.2*iconSize}} />
            <Text style={textStyle.specification}>{'You can add Rooms, People or Crownstones to your Sphere. As more devices will be integrated with the Crownstone, they will appear here as well!\n\nWhat do you want to add?'}</Text>
            <View style={{height: 0.2*iconSize}} />
            <View  style={{flexDirection:'row'}}>
              <AddItem icon={'md-cube'} label={'a Room.'} callback={() => { Actions.roomAdd({sphereId: this.props.sphereId }); }} />
              <AddItem icon={'c2-crownstone'} label={'a Crownstone.'} callback={() => {
                Alert.alert(
                  "Adding a Crownstone",
                  "Plug the new Crownstone in and hold your phone close to it (touching it). " +
                  "It will automatically show up in this overview." +
                  "\n\nYou don't have to press this button for each Crownstone you add :).",
                  [{text: 'Buy', onPress: () => { Linking.openURL('https://shop.crownstone.rocks/?launch=en&ref=http://crownstone.rocks/en/').catch(err => {}) }},{text: 'OK', onPress: () => { BackAction(); }}]
                );
              }} />
            </View>
            <AddItem icon={'ios-body'} label={'a Person.'} callback={() => {
              let label = "These are found by tapping at the cogwheel icon at the right of the navigation bar and tapping on 'Spheres'."
              if (Platform.OS === 'android') {
                label = "These are found in the Side menu under 'Spheres'";
              }

              Alert.alert(
                "Adding a Person",
                "This is done through the Sphere settings. " + label + "\n\nYou will be taken there now.",
                [{text: 'OK', onPress: () => { Actions.settingsSphere({sphereId: this.props.sphereId }); }}]
              );
            }} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}

class AddItem extends Component<any, any> {
  render() {
    return (
      <TouchableOpacity style={{alignItems:'center', padding:10}} onPress={() => { this.props.callback() }}>
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