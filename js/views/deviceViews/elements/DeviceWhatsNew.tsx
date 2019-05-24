
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceWhatsNew", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import { styles, colors, screenWidth, screenHeight, deviceStyles } from "../../styles";
import {IconButton} from "../../components/IconButton";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";


export class DeviceWhatsNew extends Component<any, any> {
  _getBodyText(firmwareVersion) {
    switch (firmwareVersion) {
      case '1.7.1':
      case '2.0.0':
      case '2.0.1':
        return "Dimming is now available!" +
          "\n\nYou can enable dimming per Crownstone in the Crownstone settings. These can be found in the top right corner of the Crownstone overview.";

      default:

    }

    return 'New stuff!'
  }

  _getButtonText(firmwareVersion) {
    switch (firmwareVersion) {
      case '1.7.1':
      case '2.0.0':
      case '2.0.1':
        return "Take me there now!";

      default:

    }

    return 'New stuff!'
  }

  _getButtonAction(firmwareVersion) {
    switch (firmwareVersion) {
      case '1.7.1':
      case '2.0.0':
      case '2.0.1':
        this._clearFlag(firmwareVersion);
        return NavigationUtil.navigate( "DeviceEdit",{ sphereId: this.props.sphereId, stoneId: this.props.stoneId });

      default:

    }
  }

  _clearFlag(firmwareVersion) {
    core.store.dispatch({
      type:"UPDATE_STONE_LOCAL_CONFIG",
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      data: {firmwareVersionSeenInOverview: firmwareVersion}
    });
  }

  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];
    let firmwareVersion = stone.config.firmwareVersion;

    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{ lang("Update_Complete_") }</Text>
        <Text style={deviceStyles.subHeader}>{ lang("Whats_New") }</Text>
        <View style={{flex:1}} />
        <IconButton
          name="c1-present"
          size={0.15*screenHeight}
          color={colors.csBlueDark.hex}
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
