
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
} from "react-native";

import {
  enoughCrownstonesInLocationsForIndoorLocalization, getAmountOfStonesInLocation
} from "../../util/DataUtil";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import {BlurMessageBar, TouchableBlurMessageBar} from "./BlurEntries";
import {core} from "../../Core";
import {colors} from "../styles";

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
    let state = core.store.getState();
    let sphereId = this.props.sphereId;
    let locationId = this.props.locationId;
    let explanation = this.props.explanation;

    // check if we have special cases
    let amountOfStonesInRoom = getAmountOfStonesInLocation(state, sphereId, locationId);

    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    if (amountOfStonesInRoom === 0) {
      // in floating Crownstones
      explanation =  lang("No_Crownstones_in_this_ro");
    }

    if (shouldShowTrainingButton(state, this.props.sphereId, this.props.locationId)) {
      explanation = lang("Train_Room");
      buttonCallback = () => { NavigationUtil.launchModal( "RoomTraining_roomSize", { sphereId: this.props.sphereId, locationId: this.props.locationId }); }
    }

    if (explanation === undefined) {
      return <React.Fragment />
    }

    let label = <Text style={{fontSize: 15, fontWeight: 'bold', textAlign:'center'}}>{explanation}</Text>;

    if (buttonCallback !== undefined) {
      return (
        <TouchableBlurMessageBar onPress={buttonCallback} marginTop={10} backgroundColor={colors.blue.rgba(0.2)}>
          {label}
        </TouchableBlurMessageBar>
      );
    }
    else {
      return (
        <BlurMessageBar marginTop={10} backgroundColor={colors.blue.rgba(0.2)}>
          {label}
        </BlurMessageBar>
      );
    }
  }
}

/**
 * The right item is the flickering icon for localization.
 * @param state
 * @param sphereId
 * @param locationId
 */
function shouldShowTrainingButton(state, sphereId, locationId) {
  let enoughCrownstonesInLocations = enoughCrownstonesInLocationsForIndoorLocalization(sphereId);
  let sphere = state.spheres[sphereId];
  if (!sphere) { return false; }

  let location = sphere.locations[locationId];
  if (!location) { return false; }

  if (!state.app.indoorLocalizationEnabled) { return false; } // do not show localization if it is disabled
  if (sphere.state.present === false)       { return false; } // cant train a room when not in the sphere
  if (sphere.state.reachable === false)     { return false; } // cant train a room when not in the sphere
  if (!enoughCrownstonesInLocations)        { return false; } // not enough crownstones to train this room

  if (location.config.fingerprintRaw !== null) { return false; } // there already is a fingerprint, dont show animated training icon.

  return true;
}
