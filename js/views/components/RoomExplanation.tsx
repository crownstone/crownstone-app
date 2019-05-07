
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import {
  DataUtil, enoughCrownstonesInLocationsForIndoorLocalization,
  getStonesAndAppliancesInLocation
} from "../../util/DataUtil";
import { colors } from '../styles'
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

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
    let boldExplanation = false;

    // check if we have special cases
    let amountOfStonesInRoom = Object.keys(getStonesAndAppliancesInLocation(state, sphereId, locationId)).length;

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    if (amountOfStonesInRoom === 0) {
      // in floating Crownstones
      explanation =  lang("No_Crownstones_in_this_ro");
    }

    if (shouldShowTrainingButton(state, this.props.sphereId, this.props.locationId) || true) {
      explanation = lang("Train_Room");
      boldExplanation = true;
      buttonCallback = () => { NavigationUtil.navigate("RoomTraining_roomSize", { sphereId: this.props.sphereId, locationId: this.props.locationId }); }
    }

    if (explanation === undefined) {
      return <View />
    }
    else if (buttonCallback !== undefined) {
      return (
        <TouchableOpacity style={{backgroundColor: colors.white.rgba(0.6), justifyContent: 'center', alignItems:'center', borderBottomWidth :1, borderColor: colors.menuBackground.rgba(0.3)}} onPress={buttonCallback}>
          <View style={{flexDirection: 'column', padding:10, justifyContent: 'center', alignItems:'center', height: 60}}>
            <Text style={{fontSize: 15, fontWeight: boldExplanation ? 'bold' : '100', color: colors.csBlueDark.hex, textAlign:'center'}}>{explanation}</Text>
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

/**
 * The right item is the flickering icon for localization.
 * @param state
 * @param enoughCrownstonesInLocations
 * @param label
 */
function shouldShowTrainingButton(state, sphereId, locationId) {
  let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(state, sphereId);
  let sphere = state.spheres[sphereId];
  if (!sphere) { return false; }

  let location = sphere.locations[locationId];
  if (!location) { return false; }

  if (!state.app.indoorLocalizationEnabled) { return false; } // do not show localization if it is disabled
  if (sphere.state.present === true)             { return false; } // cant train a room when not in the sphere
  if (!enoughCrownstonesInLocations)        { return false; } // not enough crownstones to train this room

  if (location.config.fingerprintRaw !== null) { return false; } // there already is a fingerprint, dont show animated training icon.

  // this will show a one-time popup for localization
  if (state.user.seenRoomFingerprintAlert !== true) {
    let aiData = DataUtil.getAiData(state, sphereId);
    core.store.dispatch({type: 'USER_SEEN_ROOM_FINGERPRINT_ALERT', data: {seenRoomFingerprintAlert: true}});
    Alert.alert(
      lang("_Lets_teach_____arguments_header",aiData.name),
      lang("_Lets_teach_____arguments_body",aiData.name),
      [{text: lang("_Lets_teach_____arguments_left")}]
    );
  }
  return true;
}