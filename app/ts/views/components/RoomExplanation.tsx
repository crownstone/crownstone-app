
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomExplanation", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
} from "react-native";

import {
  getAmountOfStonesInLocation
} from "../../util/DataUtil";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import {BlurMessageBar, TouchableBlurMessageBar} from "./BlurEntries";
import {core} from "../../Core";
import {colors, viewPaddingTop} from "../styles";
import {LocalizationUtil} from "../../util/LocalizationUtil";

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
    // if the button callback is not undefined at draw time, we draw a button, not a view
    let buttonCallback = undefined;

    if (LocalizationUtil.shouldTrainLocationNow(this.props.sphereId, this.props.locationId)) {
      buttonCallback = () => { NavigationUtil.launchModal( "SetupLocalization", { sphereId: this.props.sphereId, isModal: true }); }
    }

    if (!this.props.explanation === undefined) {
      return <React.Fragment />
    }

    let label = <Text style={{fontSize: 17, color: colors.white.hex, fontWeight: 'bold', textAlign:'center'}}>{this.props.explanation}</Text>;

    if (buttonCallback !== undefined) {
      return (
        <TouchableBlurMessageBar onPress={buttonCallback} marginTop={viewPaddingTop + 10} backgroundColor={colors.blue.rgba(0.6)}>
          {label}
        </TouchableBlurMessageBar>
      );
    }
    else {
      return (
        <BlurMessageBar marginTop={viewPaddingTop + 10} backgroundColor={colors.blue.rgba(0.6)}>
          {label}
        </BlurMessageBar>
      );
    }
  }
}

export function getRoomExplanationLabel(sphereId: sphereId, locationId: locationId) : string | null {
  let state = core.store.getState();
  let explanation = null;

  // check if we have special cases
  let amountOfStonesInRoom = getAmountOfStonesInLocation(state, sphereId, locationId);

  if (amountOfStonesInRoom === 0) {
    // in floating Crownstones
    explanation =  lang("No_Crownstones_in_this_ro");
  }

  if (LocalizationUtil.shouldTrainLocationNow(sphereId, locationId)) {
    explanation = lang("Train_Room");
  }

  return explanation;
}