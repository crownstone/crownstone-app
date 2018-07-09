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

import { styles, colors, screenWidth, screenHeight } from '../../styles'
import { IconButton }   from "../../components/IconButton";
import { eventBus }     from "../../../util/EventBus";
import { Permissions }  from "../../../backgroundProcesses/PermissionManager";
import { StoneUtil }    from "../../../util/StoneUtil";
import {deviceStyles} from "../DeviceOverview";

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

  _getIcon(stone) {
    let iconColor = colors.darkBackground.hex;
    if (this.props.mandatory) {
      iconColor = colors.orange.hex;
    }

    return (
      <TouchableOpacity
        onPress={() => {
          if (this.state.gettingFirmwareVersion === false) {
            this.setState({gettingFirmwareVersion: true});
            StoneUtil.checkFirmwareVersion(this.props.sphereId, this.props.stoneId, stone)
              .then((firmwareVersion) => {
                this.setState({gettingFirmwareVersion: false});
                if (stone.config.firmwareVersion !== firmwareVersion) {
                  this.props.store.dispatch({
                    type: "UPDATE_STONE_CONFIG",
                    stoneId: this.props.stoneId,
                    sphereId: this.props.sphereId,
                    data: {
                      firmwareVersion: firmwareVersion, //firmwareVersion,
                    }
                  });

                  Alert.alert("Firmware Version Updated", "It seems this Crownstone has a different firmware version than I expected. I have updated it in my database.",[{text:"OK"}])
                }
                else {
                  Alert.alert("No Change", "This Crownstone has the firmware I expected.",[{text:"OK"}])
                }
              })
              .catch((err) => {
                Alert.alert("Whoops!", "I could not get the firmware version....", [{text:'OK'}]);
                this.setState({gettingFirmwareVersion: false});
              });
          }
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
    const state    = this.props.store.getState();
    const sphere   = state.spheres[this.props.sphereId];
    const stone    = sphere.stones[this.props.stoneId];
    const disabled = stone.config.disabled;

    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{this._getTitle()}</Text>
        <View style={{flex:1}} />
        { this._getIcon(stone) }
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
