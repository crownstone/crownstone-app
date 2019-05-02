
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import {
  getStonesAndAppliancesInLocation,
} from '../../util/DataUtil'
import { colors } from '../styles'

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

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    if (amountOfStonesInRoom === 0) {
      // in floating Crownstones
      explanation =  lang("No_Crownstones_in_this_ro");
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