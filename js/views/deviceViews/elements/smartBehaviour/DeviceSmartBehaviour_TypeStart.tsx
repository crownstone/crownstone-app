import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { DeviceSmartBehaviour_TypeExamples } from "./DeviceSmartBehaviour_TypeExamples";
import {
  SMART_BEHAVIOUR_TYPES
} from "../../../../Enums";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { DeviceSmartBehaviour_Editor } from "./DeviceSmartBehaviour_Editor";
import { core } from "../../../../core";


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
  _getWakeupLightExamples() {
    let examples = [];

    return examples;
  }
  _getSmartTimerExamples() {
    let examples = [];

    return examples;
  }
  _getTwilightModeExamples() {
    let examples = [];

    return examples;
  }
  _getChildSafetyExamples() {
    let examples = [];

    return examples;
  }

  render() {
    let examples = []
    switch (this.props.type) {
      case SMART_BEHAVIOUR_TYPES.PRESENCE:
        examples = this._getPresenceExamples();
        break;
      case SMART_BEHAVIOUR_TYPES.WAKE_UP_LIGHT:
        examples = this._getWakeupLightExamples();
        break;
      case SMART_BEHAVIOUR_TYPES.SMART_TIMER:
        examples = this._getSmartTimerExamples();
        break;
      case SMART_BEHAVIOUR_TYPES.TWILIGHT_MODE:
        examples = this._getTwilightModeExamples();
        break;
      case SMART_BEHAVIOUR_TYPES.CHILD_SAFETY:
        examples = this._getChildSafetyExamples();
        break;
      case SMART_BEHAVIOUR_TYPES.CUSTOM:
        return <DeviceSmartBehaviour_Editor {...this.props} />
        break;
      default:
        NavigationUtil.back();
    }

    return <DeviceSmartBehaviour_TypeExamples examples={examples} {...this.props} />

  }
}
