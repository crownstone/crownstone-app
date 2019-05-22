
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntrySubText", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

import { colors}             from '../../styles'
import { SetupStateHandler } from "../../../native/setup/SetupStateHandler";
import { STONE_TYPES } from "../../../Enums";

export class DeviceEntrySubText extends Component<any, any> {
  render() {
    let currentUsage = this.props.currentUsage;
    let rssi = this.props.rssi;
    let disabled = this.props.disabled;
    let measuresPower = this.props.deviceType === STONE_TYPES.plug || this.props.deviceType === STONE_TYPES.builtin;

    if (this.props.statusTextOverride) {
      return (
        <View style={{flexDirection:'row'}}>
          <Text style={{fontSize: 12}}>{this.props.statusTextOverride}</Text>
        </View>
      )
    }

    if (disabled === false && currentUsage !== undefined && measuresPower) {
      // show it in orange if it's in tap to toggle range
      let color = colors.iosBlue.hex;
      if (this.props.tap2toggleThreshold && rssi >= this.props.tap2toggleThreshold && this.props.tap2toggleEnabled) {
        color = colors.orange.hex;
      }

      if (this.props.statusText) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{this.props.statusText}</Text>
          </View>
        )
      }

      if (this.props.nearestInSphere === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{ lang("_W",currentUsage) }</Text>
            <Text style={{fontSize: 12, color: color}}>{ lang("__Nearest_") }</Text>
          </View>
        )
      }
      else if (this.props.nearestInRoom === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{ lang("_W",currentUsage) }</Text>
            <Text style={{fontSize: 12, color: color}}>{ lang("__Nearest_in_room_") }</Text>
          </View>
        )
      }
      else if (rssi > -60) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{ lang("_W",currentUsage) }</Text>
            <Text style={{fontSize: 12, color: color}}>{ lang("__Very_near_") }</Text>
          </View>
        )
      }
      else if (rssi > -70) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{ lang("_W",currentUsage) }</Text>
            <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{ lang("__Near_") }</Text>
          </View>
        )
      }
      else {
        return <Text style={{fontSize: 12}}>{ lang("_W",currentUsage) }</Text>
      }
    }
    else if (disabled === false) {
      if (this.props.nearest === true) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{ lang("_Nearest_") }</Text>
      }
      else if (rssi > -60) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{ lang("_Very_near_") }</Text>
      }
      else if (rssi > -70) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{ lang("_Near_") }</Text>
      }
      else {
        return <View />
      }
    }
    else if (disabled === true) {
      return (
        <Text style={{fontSize: 12}}>{ lang("Please_wait_until_the_set",SetupStateHandler.isSetupInProgress()) }</Text>
      );
    }
    else {
      return <View />
    }
  }
}