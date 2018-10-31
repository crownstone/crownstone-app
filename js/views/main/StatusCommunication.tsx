import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StatusCommunication", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon }               from '../components/Icon'
import {
  requireMoreFingerprints,
  enoughCrownstonesInLocationsForIndoorLocalization,
  enoughCrownstonesForIndoorLocalization
} from '../../util/DataUtil'
import { overviewStyles }     from './SphereOverview'
import { colors, screenWidth, availableScreenHeight} from '../styles'
import { SetupStateHandler} from "../../native/setup/SetupStateHandler";
import {Permissions} from "../../backgroundProcesses/PermissionManager";


export class StatusCommunication extends LiveComponent<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        (change.changeStoneState && change.changeStoneState.sphereIds[this.props.sphereId]) ||
        (change.stoneRssiUpdated && change.stoneRssiUpdated.sphereIds[this.props.sphereId])
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();

    let currentSphereId = this.props.sphereId;

    // it can happen on deletion of spheres that the app will crash here.
    if (!(state && state.spheres && state.spheres[currentSphereId])) {
      return <View />;
    }

    let enoughForLocalization = enoughCrownstonesForIndoorLocalization(state, currentSphereId);
    let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(state, currentSphereId);
    let requiresFingerprints = requireMoreFingerprints(state, currentSphereId);
    let addButtonShown = Permissions.inSphere(currentSphereId).addRoom === true;

    let stones = state.spheres[this.props.sphereId].stones;
    let stoneIds = Object.keys(stones);
    let amountOfVisible = 0;
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].reachability.rssi > -100 && stones[stoneId].reachability.disabled === false) {
        amountOfVisible += 1;
      }
    });


    let generalStyle = {
      position:'absolute',
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: this.props.opacity || 1,
      left: addButtonShown ? (0.11 * screenWidth) + 5: 0,   // 0.11*screenwidth is the width of the add icon
      width: addButtonShown ? (1 - (0.11 * 2)) * screenWidth - 10 : screenWidth,
      height: 25,
      overflow: 'hidden'
    };

    if (SetupStateHandler.areSetupStonesAvailable() === true && Permissions.inSphere(this.props.sphereId).seeSetupCrownstone) {
      return (
        <View style={[generalStyle, {alignItems: 'center', justifyContent: 'center'}]}>
          <Text style={overviewStyles.bottomText}>{ lang("New_Crownstone_Detected__") }</Text>
        </View>
      );
    }
    else if (this.props.viewingRemotely === true) {
      return (
        <View style={generalStyle}>
          <Text style={[overviewStyles.bottomText, {color:colors.darkGreen.hex} ]}>{ lang("No_Crownstones_in_range_") }</Text>
        </View>
      );
    }
    else if (amountOfVisible >= 3 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={[inRangeStyle, generalStyle]}>
          <Text style={descriptionTextStyle}>{ lang("I_see_",amountOfVisible) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
          <Text style={descriptionTextStyle}>{ lang("_so_the_indoor_localizati") }</Text>
        </View>
      )
    }
    else if (amountOfVisible > 0 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={[inRangeStyle, generalStyle]}>
          <Text style={descriptionTextStyle}>{ lang("I_see_only_",amountOfVisible) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
          <Text style={descriptionTextStyle}>{ lang("_so_I_paused_the_indoor_l") }</Text>
        </View>
      )
    }
    else if (enoughForLocalizationInLocations && requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={[inRangeStyle, generalStyle, {height: 45, paddingRight: 15, paddingLeft: 15}]}>
          <Text style={[descriptionTextStyle,{textAlign: 'center'}]}>{ lang("Not_all_rooms_have_been_t") }</Text>
        </View>
      )
    }
    else if (!enoughForLocalizationInLocations && enoughForLocalization) {
      return (
        <View style={[inRangeStyle, generalStyle, {height: 45, paddingRight: 15, paddingLeft: 15}]}>
          <Text style={[descriptionTextStyle,{textAlign: 'center'}]}>{ lang("Not_enough_Crownstones_pl") }</Text>
        </View>
      )
    }
    else if (amountOfVisible > 0) {
      return (
        <View style={[inRangeStyle, generalStyle]}>
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{ lang("I_can_see_",amountOfVisible) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
        </View>
      )
    }
    else { //if (amountOfVisible === 0) {
      return (
        <View style={[inRangeStyle, generalStyle]}>
          <Text style={overviewStyles.bottomText}>{ lang("Looking_for_Crownstones__") }</Text>
        </View>
      )
    }
  }

}

let inRangeStyle = {position: 'absolute',
  flexDirection:'row',
  width: screenWidth,
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
};

let descriptionTextStyle = {
  backgroundColor:'transparent',
  color: colors.darkGreen.hex,
  fontSize:12,
  padding:3
};
