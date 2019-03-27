
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceUpdate", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View
} from 'react-native';


import { styles, colors, screenWidth, screenHeight, deviceStyles } from "../../styles";
import { IconButton }   from "../../components/IconButton";
import { Permissions }  from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";

export class DeviceUpdate extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = { gettingFirmwareVersion: false }
  }

  _getText(disabled) {
    if (this.state.gettingFirmwareVersion) {
      return "Double-checking the firmware version on this Crownstone...";
    }

    if (this.props.mandatory === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone) {
      if (disabled) {
        return 'This update is mandatory before the Crownstone can be used again.\n\n' +
               'The update phase requires you to stay close to the Crownstone and can take up to 2 minutes. You will have to be near the Crownstone to start though..'
      }
      else {
        return 'This update is mandatory before the Crownstone can be used again.\n\n' +
               'The update phase requires you to stay close to the Crownstone and can take up to 2 minutes. Press the button below to get started!'
      }
    }
    else if (this.props.mandatory === true && Permissions.inSphere(this.props.sphereId).canUpdateCrownstone === false) {
      return 'The Admin in your sphere needs to update this Crownstone before it can be used again.'
    }
    else if (disabled) {
      return 'New firmware brings new features and improved stability!\n\nThe update phase requires you to stay close to the Crownstone and can take up to 2 minutes. You will have to be near the Crownstone to start though..'
    }
    return 'New firmware brings new features and improved stability!\n\nThe update phase requires you to stay close to the Crownstone and can take up to 2 minutes. Press the button below to get started!'
  }

  _getTitle() {
    const state = core.store.getState();
    const dfuResetRequired = state.spheres[this.props.sphereId].stones[this.props.stoneId].config.dfuResetRequired;
    if (dfuResetRequired) {
      return 'Finish Update';
    }
    else if (this.props.mandatory === true) {
      return 'Update Required';
    }
    else {
      return 'Update Available!';
    }
  }

  _getIcon() {
    let iconColor = colors.darkBackground.hex;
    if (this.props.mandatory) {
      iconColor = colors.orange.hex;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          core.eventBus.emit('updateCrownstoneFirmware', {
            stoneId: this.props.stoneId,
            sphereId: this.props.sphereId,
            skipIntroduction: true
          });
        }}
      >
        <IconButton
          showLoadingIcon={this.state.gettingFirmwareVersion}
          name="c1-update-arrow"
          size={0.15*screenHeight}
          color={iconColor}
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor: colors.white.hex, borderRadius: 0.03*screenHeight}}
        />
      </TouchableOpacity>
    );
  }

  render() {
    const state    = core.store.getState();
    const sphere   = state.spheres[this.props.sphereId];
    const stone    = sphere.stones[this.props.stoneId];
    const disabled = stone.reachability.disabled;

    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{this._getTitle()}</Text>
        <View style={{flex:1}} />
        { this._getIcon() }
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{this._getText(disabled)}</Text>
        <View style={{flex:1}} />
        {disabled ? undefined : <TouchableOpacity
          onPress={() => {
            core.eventBus.emit('updateCrownstoneFirmware', {stoneId: this.props.stoneId, sphereId: this.props.sphereId, skipIntroduction: true});
          }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.white.hex,
            backgroundColor: colors.csBlue.rgba(0.5)
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{ lang("Lets_get_started_") }</Text>
        </TouchableOpacity>}
        <View style={{flex:1}} />
      </View>
    )
  }
}
