import * as React from 'react'; import { Component } from 'react';
import { Platform } from 'react-native';
import {SettingsBleTroubleshootingAndroid} from "./troubleshooting/SettingsBleTroubleshootingAndroid";
import {SettingsBleTroubleshootingIOS} from "./troubleshooting/SettingsBleTroubleshootingIOS";



export class SettingsBleTroubleshooting extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "BLE Troubleshooting" }
  };

  render() {
    if (Platform.OS === 'android') {
      return <SettingsBleTroubleshootingAndroid {...this.props} />;
    }
    else {
      return <SettingsBleTroubleshootingIOS {...this.props} />;
    }
  }
}