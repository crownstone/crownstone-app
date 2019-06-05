import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("StatusCommunication", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Text,
  View, TextStyle
} from "react-native";

import { Icon }               from '../components/Icon'
import {
  requireMoreFingerprints,
  enoughCrownstonesInLocationsForIndoorLocalization,
  enoughCrownstonesForIndoorLocalization
} from '../../util/DataUtil'
import { colors, screenWidth, overviewStyles } from "../styles";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import { core } from "../../core";
import { xUtil } from "../../util/StandAloneUtil";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";




export class StatusCommunication extends LiveComponent<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;

  amountOfVisible = 0;
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        (change.changeStoneState && change.changeStoneState.sphereIds[this.props.sphereId])
         ) {
        const store = core.store;
        const state = store.getState();
        if (!(state && state.spheres && state.spheres[this.props.sphereId])) { return }

        let stones = state.spheres[this.props.sphereId].stones;
        let stoneIds = Object.keys(stones);
        let amountOfVisible = 0;
        stoneIds.forEach((stoneId) => {
          if (StoneAvailabilityTracker.getRssi(stoneId) > -100) {
            amountOfVisible += 1;
          }
        });
        if (this.amountOfVisible !== amountOfVisible) {
          this.amountOfVisible = amountOfVisible;
          this.forceUpdate();
        }
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = core.store;
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

    let generalStyle : TextStyle = {
      position:'absolute',
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: this.props.opacity || 1,
      left: addButtonShown ? (0.11 * screenWidth) + 5: 0,   // 0.11*screenwidth is the width of the add icon
      width: addButtonShown ? (1 - (0.11 * 2)) * screenWidth - 10 : screenWidth,
      height: 50,
      overflow: 'hidden',
      flexDirection:'column',
    };

    console.log("generalStyle", generalStyle, screenWidth)


    if (this.props.viewingRemotely === true) {
      return (
        <View style={generalStyle} pointerEvents={'none'}>
          <Text style={[overviewStyles.bottomText, {color:colors.darkGreen.hex} ]}>{ lang("No_Crownstones_in_range_") }</Text>
        </View>
      );
    }
    else if (this.amountOfVisible >= 3 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={generalStyle} pointerEvents={'none'}>
          <View style={inRangeStyle}>
            <Text style={descriptionTextStyle}>{ lang("I_see_",this.amountOfVisible) }</Text>
            <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
          </View>
          <Text style={descriptionTextStyle}>{ xUtil.narrowScreen() ? lang("NARROW_so_the_indoor_localizati") : lang("_so_the_indoor_localizati") }</Text>
        </View>
      )
    }
    else if (this.amountOfVisible > 0 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={generalStyle} pointerEvents={'none'}>
          <View style={inRangeStyle}>
            <Text style={descriptionTextStyle}>{ lang("I_see_only_",this.amountOfVisible) }</Text>
            <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
          </View>
          <Text style={descriptionTextStyle}>{ xUtil.narrowScreen() ? lang("NARROW_so_I_paused_the_indoor_l") : lang("_so_I_paused_the_indoor_l") }</Text>
        </View>
      )
    }
    else if (enoughForLocalizationInLocations && requiresFingerprints && state.app.indoorLocalizationEnabled) {
      return (
        <View style={[generalStyle, inRangeStyle]} pointerEvents={'none'}>
          <Text style={[descriptionTextStyle,{textAlign: 'center'}]}>{ lang("Not_all_rooms_have_been_t") }</Text>
        </View>
      )
    }
    else if (!enoughForLocalizationInLocations && enoughForLocalization) {
      return (
        <View style={[generalStyle, inRangeStyle]} pointerEvents={'none'}>
          <Text style={[descriptionTextStyle,{textAlign: 'center'}]}>{ lang("Not_enough_Crownstones_pl") }</Text>
        </View>
      )
    }
    else if (this.amountOfVisible > 0) {
      return (
        <View style={[generalStyle, {flexDirection:'row'}]} pointerEvents={'none'} >
          <Text style={{backgroundColor:'transparent', color: colors.csBlue.hex, fontSize:12, padding:3}}>{ lang("I_can_see_",this.amountOfVisible) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
        </View>
      )
    }
    else { //if (this.amountOfVisible === 0) {
      return (
        <View style={generalStyle} pointerEvents={'none'}>
          <Text style={overviewStyles.bottomText}>{ lang("Looking_for_Crownstones__") }</Text>
        </View>
      )
    }
  }

}

let inRangeStyle : TextStyle = {
  flexDirection:'row',
  backgroundColor: 'transparent',
  justifyContent: 'center',
  alignItems: 'center',
};

let descriptionTextStyle : TextStyle = {
  backgroundColor:'transparent',
  color: colors.csBlue.hex,
  fontSize:12,
  padding:3
};
