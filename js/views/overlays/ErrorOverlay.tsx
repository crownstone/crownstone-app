import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import { styles, colors , screenHeight, screenWidth } from '../styles'
import {eventBus} from "../../util/EventBus";
const Actions = require('react-native-router-flux').Actions;

export class ErrorOverlay extends Component<any, any> {
  unsubscribe : any;

  constructor() {
    super();

    this.state = {
      visible: false,
      maxOpacity: 1,
      stonesContainingError: [] // { stoneId : stoneId, stone: stoneObject }
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe = eventBus.on("showErrorOverlay", (stonesContainingError) => {
      if (stonesContainingError.length > 0) {
        this.setState({visible: true, maxOpacity:1, stonesContainingError: stonesContainingError});
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  _getTitle() {
    if (this.state.stonesContainingError.length > 1)
      return ("Errors detected in " + this.state.stonesContainingError.length + " Crownstones");
    else
      return ("Error detected in " + this.state.stonesContainingError.length + " Crownstone");
  }

  _getText() {
    if (this.state.stonesContainingError.length === 0) {
      return;
    }

    if (this.state.stonesContainingError[0].stone.errors.temperatureDimmer) {
      return 'This Crownstone became too hot during dimming. It has switched off automatically to protect your devices. When you reset the error, it will resume operations. If this happens more than once, the device you\'re trying to dim may be using too much power for this Crownstone.'
    }
    else if (this.state.stonesContainingError[0].stone.errors.temperatureChip) {
      return 'The Crownstone became too hot. It has switched off automatically to protect your devices. When you reset the error, it will resume operations. If this happens more than once, this device may be using too much power for this Crownstone.'
    }
    else if (this.state.stonesContainingError[0].stone.errors.overCurrentDimmer) {
      return 'The device you\'re trying to dim uses too much power. Dimming has been disabled until the error has been reset.'
    }
    else if (this.state.stonesContainingError[0].stone.errors.overCurrent) {
      return 'I measured more than 16 A of current through this Crownstone. It has been disabled until the error has been reset.'
    }
  }

  _getButton() {
    return (
      <TouchableOpacity
        onPress={() => {
          let currentCrownstone = this.state.stonesContainingError[0];
          let locationId = currentCrownstone.stone.config.locationId;
          (Actions as any).roomOverview({sphereId: currentCrownstone.sphereId, locationId: locationId, errorCrownstone: currentCrownstone.stoneId });
          this.setState({maxOpacity: 0.5})
        }}
        style={[styles.centered, {
          width: 0.4 * screenWidth,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.red.hex,
        }]}>
        <Text style={{fontSize: 12, fontWeight: 'bold', color: colors.red.hex}}>{"Find Crownstone"}</Text>
      </TouchableOpacity>
    );
  }


  render() {
    return (
      <OverlayBox visible={this.state.visible} height={0.7*screenHeight} maxOpacity={this.state.maxOpacity}>
        <View style={{flex:1}} />
        <IconButton
          name="ios-warning"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative',}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, padding:15, textAlign:'center'}}>{this._getTitle()}</Text>
        <Text style={{fontSize: 12, fontWeight: '500',  color: colors.red.hex, padding:15, textAlign:'center'}}>
          {this._getText()}
        </Text>
        <View style={{flex:1}} />
        {this._getButton()}
        <View style={{flex:1}} />
      </OverlayBox>
    );
  }
}