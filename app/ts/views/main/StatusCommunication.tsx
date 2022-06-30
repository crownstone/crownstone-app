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
  enoughCrownstonesInLocationsForIndoorLocalization,
  enoughCrownstonesForIndoorLocalization
} from '../../util/DataUtil'
import { colors, screenWidth, overviewStyles, tabBarHeight } from "../styles";
import { core } from "../../Core";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { Util } from "../../util/Util";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {FingerprintUtil} from "../../util/FingerprintUtil";
import { Get } from "../../util/GetUtil";



export class StatusCommunication extends LiveComponent<any, any> {
  unsubscribeStoreEvents : any;
  unsubscribeSetupEvents : any;

  constructor(props) {
    super(props);
    this.state = {amountOfVisibleCrownstones: this._getAmountOfCrownstones()};
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if ((change.changeStoneAvailability && change.changeStoneAvailability.sphereIds[this.props.sphereId])) {
        this._checkIfRedrawIsRequired();
      }
    });

    // verify that something has not happened between rendering and starting the listener.
    this._checkIfRedrawIsRequired();
  }

  _checkIfRedrawIsRequired() {
    let amountOfVisibleCrownstones = this._getAmountOfCrownstones();
    if (this.state.amountOfVisibleCrownstones !== amountOfVisibleCrownstones) {
      this.setState({amountOfVisibleCrownstones: amountOfVisibleCrownstones})
    }
  }

  _getAmountOfCrownstones() {
    let sphere = Get.sphere(this.props.sphereId);
    if (!sphere) { return; }

    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);
    let amountOfVisible = 0;
    stoneIds.forEach((stoneId) => {
      let rssi = StoneAvailabilityTracker.getRssi(stoneId);
      if (rssi > -100) {
        amountOfVisible += 1;
      }
    });
    return amountOfVisible;
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
  }

  render() {
    return <StatusCommunicationRender {...this.props} amountOfVisibleCrownstones={this.state.amountOfVisibleCrownstones} />
  }
}

function StatusCommunicationRender(props) {
  const store = core.store;
  const state = store.getState();

  let currentSphereId = props.sphereId;

  // it can happen on deletion of spheres that the app will crash here.
  if (!(state && state.spheres && state.spheres[currentSphereId])) {
    return <View />;
  }

  let enoughForLocalization = enoughCrownstonesForIndoorLocalization(currentSphereId);
  let enoughForLocalizationInLocations = enoughCrownstonesInLocationsForIndoorLocalization(currentSphereId);
  let requiresFingerprints = FingerprintUtil.requireMoreFingerprintsBeforeLocalizationCanStart(currentSphereId);

  let insets = useSafeAreaInsets()

  let generalStyle : TextStyle = {
    position:'absolute',
    bottom: tabBarHeight - insets.bottom,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: props.opacity || 1,
    left: 0,   // 0.11*screenwidth is the width of the add icon
    width: screenWidth-20,
    height: 50,
    overflow: 'hidden',
    flexDirection:'column',
  };

  if (props.viewingRemotely === true) {
    return (
      <View style={generalStyle} pointerEvents={'none'}>
        <Text style={[overviewStyles.bottomText, {color:colors.darkGreen.hex} ]}>{ lang("No_Crownstones_in_range_") }</Text>
      </View>
    );
  }
  else if (props.amountOfVisibleCrownstones >= 3 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
    return (
      <View style={generalStyle} pointerEvents={'none'}>
        <View style={inRangeStyle}>
          <Text style={descriptionTextStyle}>{ lang("I_see_",props.amountOfVisibleCrownstones) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
        </View>
        <Text style={descriptionTextStyle}>{ Util.narrowScreen() ? lang("NARROW_so_the_indoor_localizati") : lang("_so_the_indoor_localizati") }</Text>
      </View>
    )
  }
  else if (props.amountOfVisibleCrownstones > 0 && enoughForLocalizationInLocations && !requiresFingerprints && state.app.indoorLocalizationEnabled) {
    return (
      <View style={generalStyle} pointerEvents={'none'}>
        <View style={inRangeStyle}>
          <Text style={descriptionTextStyle}>{ lang("I_see_only_",props.amountOfVisibleCrownstones) }</Text>
          <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
        </View>
        <Text style={descriptionTextStyle}>{ Util.narrowScreen() ? lang("NARROW_so_I_paused_the_indoor_l") : lang("_so_I_paused_the_indoor_l") }</Text>
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
  else if (props.amountOfVisibleCrownstones > 0) {
    return (
      <View style={[generalStyle, {flexDirection:'row'}]} pointerEvents={'none'} >
        <Text style={{backgroundColor:'transparent', color: colors.csBlue.hex, fontSize:12, padding:3}}>{ lang("I_can_see_",props.amountOfVisibleCrownstones) }</Text>
        <Icon name="c2-crownstone" size={20} color={colors.csBlue.hex} style={{position:'relative', top:3, width:20, height:20}} />
      </View>
    )
  }
  else { //if (props.amountOfVisibleCrownstones === 0) {
    return (
      <View style={generalStyle} pointerEvents={'none'}>
        <Text style={overviewStyles.bottomText}>{ lang("Looking_for_Crownstones__") }</Text>
      </View>
    )
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
