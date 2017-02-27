import { Component } from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native';

import { NativeBus }          from '../../../native/Proxy'
import { IconButton }         from '../IconButton'
import { OverlayBox }         from './OverlayBox'
import { styles, colors , screenHeight, screenWidth } from '../../styles'

export class BleStateOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();

    this.state = {
      visible: false,
      notificationType: 'unknown' //"unauthorized", "poweredOff", "poweredOn", "unknown"
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    NativeBus.on(NativeBus.topics.bleStatus, (status) => {
      switch (status) {
        case "poweredOff":
          this.setState({visible: true, notificationType: status});
          break;
        case "poweredOn":
          this.setState({visible: false, notificationType: status});
          break;
        case "unauthorized":
          this.setState({visible: true, notificationType: status});
          break;
        default: // "unknown":
          this.setState({visible: true, notificationType: status});
          break;
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getTitle() {
    switch (this.state.notificationType) {
      case "poweredOff":
        return "Bluetooth is turned off.";
      case "poweredOn":
        return "Bluetooth is turned on!";
      case "unauthorized":
        return "We can't use Bluetooth...";
      default: // "unknown":
        return "Starting Bluetooth...";
    }
  }

  _getText() {
    switch (this.state.notificationType) {
      case "poweredOff":
        return "Crownstones use Bluetooth to talk to your phone so it needs to be turned on to use the app.";
      case "poweredOn":
        return "Bluetooth is turned on, resuming Crownstone services.";
      case "unauthorized":
        return "Crownstone is not authorized to use Bluetooth. This should be resolved soon.";
      default: // "unknown":
        return "We are turning on Bluetooth. This should not take long :).";
    }
  }

  render() {
    return (
      <OverlayBox visible={this.state.visible} height={0.7*screenHeight}>
        <View style={{flex:1}} />
        <IconButton
          name="ios-bluetooth"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.blue.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top:0.008*screenHeight}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue.hex, padding:15}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.blue.hex, padding:15, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}