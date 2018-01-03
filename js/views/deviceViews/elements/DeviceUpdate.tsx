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
import {Permissions} from "../../../backgroundProcesses/PermissionManager";


export class DeviceUpdate extends Component<any, any> {
  _getText(disabled) {
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
    const state = this.props.store.getState();
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
      <IconButton
        name="c1-update-arrow"
        size={0.15*screenHeight}
        color={iconColor}
        buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor: colors.white.hex, borderRadius: 0.03*screenHeight}}
        style={{position:'relative', top: 0.0051*screenHeight}}
      />
    );
  }

  render() {
    const state = this.props.store.getState();
    const disabled = state.spheres[this.props.sphereId].stones[this.props.stoneId].config.disabled;

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
            eventBus.emit('updateCrownstoneFirmware', {stoneId: this.props.stoneId, sphereId: this.props.sphereId, skipIntroduction: true});
          }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.white.hex,
            backgroundColor: colors.csBlue.rgba(0.5)
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{"Let's get started!"}</Text>
        </TouchableOpacity>}
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