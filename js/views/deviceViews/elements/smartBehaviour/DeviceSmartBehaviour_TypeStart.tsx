import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { DeviceSmartBehaviour_TypeExamples } from "./prototyping/DeviceSmartBehaviour_TypeExamples";
import {
  SMART_BEHAVIOUR_TYPES
} from "../../../../Enums";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { DeviceSmartBehaviour_Editor } from "./DeviceSmartBehaviour_Editor";
import { core } from "../../../../core";
import { availableScreenHeight } from "../../../styles";
import { ScaledImage } from "../../../components/ScaledImage";


export class DeviceSmartBehaviour_TypeStart extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };


  _getLocationIds(amount) {
    let state = core.store.getState();
    let sphereIds = Object.keys(state.spheres);
    let activeSphere = sphereIds[0]

    let sphere = state.spheres[activeSphere];
    let locationIds = Object.keys(sphere.locations);
    let usedLocationIds = [];
    for (let i = 0; i < locationIds.length && i < amount; i++) {
      usedLocationIds.push(locationIds[i]);
    }

    return usedLocationIds;
  }

  _getPresenceExamples() {
    let examples : behaviour[] = [];
    examples.push({
      action:   { type: "BE_ON", data: 1, },
      presence: { type: "SOMEBODY", data: { type: "SPHERE" }, delay: 5},
      time: {
        type: "RANGE",
        from: { type: "SUNSET", offsetMinutes: 0 },
        to: { type: "SUNRISE", offsetMinutes: 0 }
      }
    });
    examples.push({
      action:   { type: "BE_ON", data: 1, },
      presence: { type: "SOMEBODY", data: { type: "LOCATION", locationIds: this._getLocationIds(2) }, delay: 5},
      time: {
        type: "ALL_DAY"
      }
    });

    examples.push({
      action:   { type: "BE_ON", data: 1, },
      presence: { type: "IGNORE" },
      time: {
        type: "RANGE",
        from: { type: "CLOCK", data: { minutes: 0, hours: 15, dayOfMonth: "*", month: "*" }},
        to:   { type: "SUNSET", offsetMinutes: 0 }
      },
      options: {
        type: "LOCATION_PRESENCE_AFTER"
      }
    });
    return examples;
  }
  _getSmartTimerExamples() {
    let examples : behaviour[] = [];
    examples.push({
      action:   { type: "BE_ON", data: 1, },
      presence: { type: "SOMEBODY", data: { type: "SPHERE" }, delay: 5},
      time: {
        type: "RANGE",
        from: { type: "SUNSET", offsetMinutes: 30},
        to:   { type: "CLOCK", data: { minutes: 0, hours: 23, dayOfMonth: "*", month: "*" }},
      },
    });
    examples.push({
      action:   { type: "BE_ON", data: 1, },
      presence: { type: "IGNORE" },
      time: {
        type: "RANGE",
        from: { type: "CLOCK", data: { minutes: 0, hours: 15, dayOfMonth: "*", month: "*" }},
        to:   { type: "SUNSET", offsetMinutes: 0 }
      },
      options: {
        type: "LOCATION_PRESENCE_AFTER"
      }
    });
    examples.push({
      action:   { type: "BE_ON", data: 0.5, },
      presence: { type: "IGNORE" },
      time: {
        type: "RANGE",
        from: { type: "SUNSET", offsetMinutes: 0 },
        to:   { type: "CLOCK", data: { minutes: 0, hours: 22, dayOfMonth: "*", month: "*" }},
      },
      options: {
        type: "SPHERE_PRESENCE_AFTER"
      }
    });
    return examples;
  }
  _getTwilightModeExamples() {
    let examples : behaviour[] = [];

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
    switch (this.props.type) {
      case SMART_BEHAVIOUR_TYPES.PRESENCE:
        examples = this._getPresenceExamples();
        image = <ScaledImage source={require('../../../../images/icons/presence.png')} sourceWidth={125} sourceHeight={162} targetWidth={0.15*availableScreenHeight} />
        header = "Presence Aware Behaviour";
        break;
      case SMART_BEHAVIOUR_TYPES.SMART_TIMER:
        examples = this._getSmartTimerExamples();
        image = <ScaledImage source={require('../../../../images/icons/smartTimer.png')} sourceWidth={140} sourceHeight={140} targetWidth={0.15*availableScreenHeight} />
        header = "Smart Timer";
        break;
      case SMART_BEHAVIOUR_TYPES.TWILIGHT_MODE:
        examples = this._getTwilightModeExamples();
        image = <ScaledImage source={require('../../../../images/icons/twilight.png')} sourceWidth={124} sourceHeight={128} targetWidth={0.15*availableScreenHeight} />
        header = "Twilight Mode";
        break;
      case SMART_BEHAVIOUR_TYPES.CHILD_SAFETY:
        examples = this._getChildSafetyExamples();
        image = <ScaledImage source={require('../../../../images/icons/childLock.png')} sourceWidth={149} sourceHeight={112} targetWidth={0.15*availableScreenHeight} />
        header = "Child Safety";
        break;
      default:
        NavigationUtil.back();
    }

    return <DeviceSmartBehaviour_TypeExamples examples={examples} {...this.props} image={image} header={header} />

  }
}
