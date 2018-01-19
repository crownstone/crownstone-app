import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  ActivityIndicator,
  Dimensions,
  Image,
  PixelRatio,
  Platform,
  Switch,
  TouchableOpacity,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { styles, colors, screenWidth } from '../../styles'
import {SetupStateHandler} from "../../../native/setup/SetupStateHandler";

export class DeviceEntrySubText extends Component<any, any> {
  render() {
    let currentUsage = this.props.currentUsage;
    let rssi = this.props.rssi;
    let disabled = this.props.disabled;

    if (disabled === false && currentUsage !== undefined) {
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
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest)'}</Text>
          </View>
        )
      }
      else if (this.props.nearestInRoom === true) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Nearest in room)'}</Text>
          </View>
        )
      }
      else if (rssi > -60) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color: color}}>{' (Very near)'}</Text>
          </View>
        )
      }
      else if (rssi > -70) {
        return (
          <View style={{flexDirection:'row'}}>
            <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
            <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
          </View>
        )
      }
      else {
        return <Text style={{fontSize: 12}}>{currentUsage + ' W'}</Text>
      }
    }
    else if (disabled === false) {
      if (this.props.nearest === true) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Nearest)'}</Text>
      }
      else if (rssi > -60) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Very near)'}</Text>
      }
      else if (rssi > -70) {
        return <Text style={{fontSize: 12, color:colors.iosBlue.hex}}>{' (Near)'}</Text>
      }
    }
    else if (disabled === true) {
      return (
        <Text style={{fontSize: 12}}>
          { SetupStateHandler.isSetupInProgress() ? 'Please wait until the setup process is complete.' : 'Searching...' }
        </Text>
      );
    }
    else {
      return <View />
    }
  }
}