import React, { Component } from 'react'
import {
  Image,
  Text,
  View,
} from 'react-native';

import { NativeBus }          from '../../native/Proxy'
import { IconButton }         from './IconButton'
import { FadeInView }         from './animated/FadeInView'
import { styles, colors , screenHeight, screenWidth } from './../styles'

export class BleStateOverlay extends Component {
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

  _getBLEOverlay() {
    return (
      <View style={[styles.centered, {backgroundColor:'#fff', width:0.8*screenWidth, height:0.6*screenHeight, borderRadius: 25, padding: 0.02*screenWidth}]}>
        <View style={{flex:1}} />
        <IconButton
          name="ios-bluetooth"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.blue.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top:0.008*screenHeight}} />
        <View style={{flex:1}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue.hex, padding:15}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.blue.hex, padding:15, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <View style={{flex:1}} />
      </View>
    )
  }


  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.state.visible}>
        {this._getBLEOverlay()}
      </FadeInView>
    );
  }
}