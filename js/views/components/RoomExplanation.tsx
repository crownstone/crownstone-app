
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  TouchableHighlight,
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  View
} from 'react-native';

import { SetupStateHandler }    from '../../native/setup/SetupStateHandler'
const Actions = require('react-native-router-flux').Actions;
import {
  getStonesAndAppliancesInLocation,
  getFloatingStones
} from '../../util/DataUtil'
import { colors } from '../styles'
import {BackAction} from "../../util/Back";
import {Permissions} from "../../backgroundProcesses/PermissionManager";

/**
 * This element contains all logic to show the explanation bar in the room overview.
 * It requires:
 *  - {object} state
 *  - {string | undefined} explanation
 *  - {string} sphereId
 *  - {string} locationId
 */
export class RoomExplanation extends Component<any, any> {
  render() {
    let state = this.props.state;
    let sphereId = this.props.sphereId;
    let locationId = this.props.locationId;
    let explanation = this.props.explanation;

    // check if we have special cases
    let amountOfStonesInRoom = Object.keys(getStonesAndAppliancesInLocation(state, sphereId, locationId)).length;
    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable() && Permissions.inSphere(sphereId).seeSetupCrownstone;
    let canSeeSetupCrownstones = Permissions.inSphere(this.props.sphereId).seeSetupCrownstone;

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    // In case we see a crownstone in setup mode:
    if (canSeeSetupCrownstones && explanation === undefined && seeStoneInSetupMode === true && locationId === null) {
      explanation =  lang("Crownstones_in_setup_mode")}

    // in case there are no crownstones in the room.
    else if (explanation === undefined && amountOfStonesInRoom === 0) {
      // in floating Crownstones
      if (locationId === null) {
        explanation =  lang("No_Crownstones_found_")}
      // there are no crownstones in the sphere
      else if (Object.keys(state.spheres[sphereId].stones).length === 0 && canSeeSetupCrownstones) {
        explanation =  lang("To_add_a_Crownstones_to_y")}
      // there are floating crownstones
      else if (getFloatingStones(state, sphereId).length > 0) {
        explanation =  lang("Tap_here_to_see_all_Crown");
        buttonCallback = () => { BackAction(); setTimeout(() => { Actions.roomOverview({sphereId: sphereId, locationId: null}) }, 150)};
      }
      else {
        explanation =  lang("No_Crownstones_in_this_ro");
      }
    }


    if (explanation === undefined) {
      return <View />
    }
    else if (buttonCallback !== undefined) {
      return (
        <TouchableOpacity style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}} onPress={buttonCallback}>
          <View style={{flexDirection: 'column', padding:10, justifyContent: 'center', alignItems:'center', height: 60}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    else {
      return (
        <View style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}}>
          <View style={{flexDirection: 'column', padding:10, justifyContent: 'center', alignItems:'center', height: 60}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
          </View>
        </View>
      );
    }
  }
}