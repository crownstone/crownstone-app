
import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour_TypeStart", key)(a, b, c, d, e);
}

import * as React from "react"; import { Component } from "react";
import { DeviceSmartBehaviour_TypeExamples } from "./prototyping/DeviceSmartBehaviour_TypeExamples";
import {
  SMART_BEHAVIOUR_TYPES
} from "../../../../Enums";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { core } from "../../../../core";
import { availableScreenHeight } from "../../../styles";
import { ScaledImage } from "../../../components/ScaledImage";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { AicoreTwilight } from "./supportCode/AicoreTwilight";


export class DeviceSmartBehaviour_TypeStart extends Component<{stoneId: string, sphereId: string, type: string}, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: lang("A_Crownstone")
    };
  };


  _getLocationIds(amount) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let activeSphere = sphereIds[0];

    let sphere = state.spheres[activeSphere];
    let locationIds = Object.keys(sphere.locations);
    let usedLocationIds = [];
    for (let i = 0; i < locationIds.length && i < amount; i++) {
      usedLocationIds.push(locationIds[i]);
    }

    return usedLocationIds;
  }

  _getPresenceExamples() {
    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeWhenDark());
    examples.push(new AicoreBehaviour().setPresenceInLocations(this._getLocationIds(2)).setTimeAllday());
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setOptionStayOnWhilePeopleInSphere());
    return examples;
  }
  _getSmartTimerExamples() {
    let examples : AicoreBehaviour[] = [];
    examples.push(new AicoreBehaviour().setPresenceInSphere().setTimeFromSunset(30).setTimeTo(23,0));
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFrom(15,0).setTimeToSunset().setOptionStayOnWhilePeopleInLocation());
    examples.push(new AicoreBehaviour().ignorePresence().setTimeFromSunset(0).setTimeTo(22,0).setOptionStayOnWhilePeopleInSphere());
    return examples;
  }
  _getTwilightModeExamples() {
    let examples : AicoreTwilight[] = [];
    examples.push(new AicoreTwilight().setDimAmount(0.5).setTimeWhenDark());
    examples.push(new AicoreTwilight().setDimAmount(0.35).setTimeFrom(23,30).setTimeToSunrise());
    return examples;
  }
  _getChildSafetyExamples() {
    let examples : behaviour[] = [];

    return examples;
  }

  render() {
    let examples = [];
    let header = "";
    let image = null;
    let twilightRules = false;
    switch (this.props.type) {
      case SMART_BEHAVIOUR_TYPES.PRESENCE:
        examples = this._getPresenceExamples();
        image = <ScaledImage source={require("../../../../images/icons/presence.png")} sourceWidth={125} sourceHeight={162} targetWidth={0.15*availableScreenHeight} />;
        header = "Presence Aware Behaviour";
        break;
      case SMART_BEHAVIOUR_TYPES.SMART_TIMER:
        examples = this._getSmartTimerExamples();
        image = <ScaledImage source={require("../../../../images/icons/smartTimer.png")} sourceWidth={140} sourceHeight={140} targetWidth={0.15*availableScreenHeight} />;
        header = "Smart Timer";
        break;
      case SMART_BEHAVIOUR_TYPES.TWILIGHT_MODE:
        examples = this._getTwilightModeExamples();
        image = <ScaledImage source={require("../../../../images/icons/twilight.png")} sourceWidth={149} sourceHeight={112} targetWidth={0.15*availableScreenHeight} />;
        header = "Twilight Mode";
        twilightRules = true;
        break;
      case SMART_BEHAVIOUR_TYPES.CHILD_SAFETY:
        examples = this._getChildSafetyExamples();
        image = <ScaledImage source={require("../../../../images/icons/childLock.png")} sourceWidth={124} sourceHeight={128} targetWidth={0.15*availableScreenHeight} />;
        header = "Child Safety";
        break;
      default:
        NavigationUtil.back();
    }

    return <DeviceSmartBehaviour_TypeExamples examples={examples} {...this.props} image={image} header={header} twilightRules={twilightRules} />;

  }
}
