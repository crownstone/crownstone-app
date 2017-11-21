import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import {IconButton} from "../../components/IconButton";
import {eventBus} from "../../../util/EventBus";


export class DeviceWhatsNew extends Component<any, any> {
  _getBodyText(firmwareVersion) {
    switch (firmwareVersion.substr(0,3)) {
      case '1.7':
        return "Dimming is now available!" +
          "\n\nYou can enable dimming per Crownstone in the Crownstone settings. These can be found in the top right corner of the Crownstone overview.";
      case '2.0':

      default:

    }

    return 'New stuff!'
  }

  _getButtonText(firmwareVersion) {
    switch (firmwareVersion.substr(0,3)) {
      case '1.7':
        return "Take me there now!";
      case '2.0':

      default:

    }

    return 'New stuff!'
  }

  _getButtonAction(firmwareVersion) {
    switch (firmwareVersion.substr(0,3)) {
      case '1.7':
        this._clearFlag(firmwareVersion);
        return Actions.deviceEdit({ sphereId: this.props.sphereId, stoneId: this.props.stoneId });
      case '2.0':

      default:

    }
  }

  _clearFlag(firmwareVersion) {
    this.props.store.dispatch({
      type:"UPDATE_STONE_LOCAL_CONFIG",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      data: {firmwareVersionSeenInOverview: firmwareVersion}
    });
  }

  render() {
    let state = this.props.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    let firmwareVersion = stone.config.firmwareVersion;

    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{"Update Complete!"}</Text>
        <Text style={deviceStyles.subHeader}>{"What's New"}</Text>
        <View style={{flex:1}} />
        <IconButton
          name="c1-present"
          size={0.15*screenHeight}
          color={colors.darkBackground.hex}
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.white.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top: 0.0051*screenHeight}}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{ this._getBodyText(firmwareVersion) }</Text>
        <View style={{flex:1}} />
        <TouchableOpacity
          onPress={() => { this._getButtonAction(firmwareVersion) }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.white.hex,
            backgroundColor: colors.csBlue.rgba(0.5)
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ this._getButtonText(firmwareVersion) }</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  subHeader: {
    paddingTop:10,
    color: textColor.hex,
    fontSize: 22,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});