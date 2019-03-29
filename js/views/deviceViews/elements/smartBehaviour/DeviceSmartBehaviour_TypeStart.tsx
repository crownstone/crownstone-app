import { Languages } from "../../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { DeviceSmartBehaviour_TypeExamples } from "./DeviceSmartBehaviour_TypeExamples";
import {
  ACTIONS,
  LOCATION_TYPES,
  PRESENCE_TYPES,
  SMART_BEHAVIOUR_TYPES,
  TIME_DATA_TYPE,
  TIME_TYPES
} from "../../../../Enums";
import { NavigationUtil } from "../../../../util/NavigationUtil";
import { DeviceSmartBehaviour_Editor } from "./DeviceSmartBehaviour_Editor";


export class DeviceSmartBehaviour_TypeStart extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "A Crownstone",
    }
  };

  _getPresenceExamples() {
    let examples = [];
    examples.push({
      action:   { type: ACTIONS.TURN_ON, data: 1, },
      presence: { type: PRESENCE_TYPES.SOMEBODY, data: { type: LOCATION_TYPES.SPHERE, locationIds: []}},
      time: {
        type: TIME_TYPES.FROM_TO, data: {
          from: { type: TIME_DATA_TYPE.SPECIFIC, data: "15:00"},
          to:   { type: TIME_DATA_TYPE.SPECIFIC, data: "23:00"}
        }}
    });
    examples.push({
      action:   { type: ACTIONS.TURN_ON, data: 1, },
      presence: { type: PRESENCE_TYPES.SOMEBODY, data: { type: LOCATION_TYPES.SPECIFIC_LOCATIONS, locationIds: ["Living room", "Kitchen"]}},
      time: { type: TIME_TYPES.ALWAYS }});

    examples.push({
      action:   { type: ACTIONS.TURN_ON, data: 0.3, },
      presence: { type: PRESENCE_TYPES.NOBODY, data: { type: LOCATION_TYPES.SPHERE, locationIds: []}},
      time: {
        type: TIME_TYPES.FROM_TO, data: {
          from: { type: TIME_DATA_TYPE.SUNSET},
          to:   { type: TIME_DATA_TYPE.SUNRISE}
        }}
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


function ruleConstructor() {
  return {
    action:   { type: ACTIONS.TURN_ON, data: 1, },
    presence: { type: PRESENCE_TYPES.SOMEBODY, data: { type: LOCATION_TYPES.SPHERE, locationIds: []}},
    time: {
      type: TIME_TYPES.FROM_TO, data: {
        from: { type: TIME_DATA_TYPE.SUNSET,  offset: { minutes: -60, variation: 15 }},
        to:   { type: TIME_DATA_TYPE.SUNRISE, offset: { minutes: +60, variation: 15 }}
    }}};
}