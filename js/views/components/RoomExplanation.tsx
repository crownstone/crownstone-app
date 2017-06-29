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
import { styles, colors } from '../styles'

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
    let seeStoneInSetupMode = SetupStateHandler.areSetupStonesAvailable();

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    // callback to go to the floating crownstones. Is used twice
    let goToFloatingCrownstonesCallback = () => { Actions.pop(); setTimeout(() => { Actions.roomOverview({sphereId: sphereId, locationId: null}) }, 150)};

    // In case we see a crownstone in setup mode:
    if (explanation === undefined && seeStoneInSetupMode === true && locationId === null) {
      explanation = "Crownstones in setup mode have a blue icon."
    }

    // in case there are no crownstones in the room.
    else if (explanation === undefined && amountOfStonesInRoom === 0) {
      // in floating Crownstones
      if (locationId === null) {
        explanation = "No Crownstones found."
      }
      // there are no crownstones in the sphere
      else if (Object.keys(state.spheres[sphereId].stones).length === 0) {
        explanation = "To add a Crownstones to your sphere, hold your phone really close to a new one!"
      }
      // there are floating crownstones
      else if (getFloatingStones(state, sphereId).length > 0) {
        explanation = "Tap here to see all Crownstones without rooms!";
        buttonCallback = goToFloatingCrownstonesCallback;
      }
      else {
        explanation = "No Crownstones in this room.";
      }
    }


    if (explanation === undefined) {
      return <View />
    }
    else if (buttonCallback !== undefined) {
      return (
        <TouchableOpacity style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}} onPress={buttonCallback}>
        <View style={{flexDirection: 'column', padding:10}}>
          <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
        </View>
      </TouchableOpacity>
    )
    }
    else {
      return (
        <View style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}}>
          <View style={{flexDirection: 'column', padding:10}}>
            <Text style={{fontSize: 15, fontWeight: '100', textAlign:'center'}}>{explanation}</Text>
          </View>
        </View>
      )
    }
  }
}