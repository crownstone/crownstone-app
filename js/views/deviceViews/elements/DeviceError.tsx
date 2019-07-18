
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceError", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, Alert
} from "react-native";


import { styles, colors, screenWidth, screenHeight, deviceStyles } from "../../styles";
import {IconButton} from "../../components/IconButton";
import {ErrorContent} from "../../content/ErrorContent";
import {StoneUtil} from "../../../util/StoneUtil";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";


export class DeviceError extends Component<any, any> {

  _getAction(stone) {
    if (Permissions.inSphere(this.props.sphereId).canClearErrors) {
      return (
        <TouchableOpacity
          onPress={() => {
            if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
              Alert.alert("Stone unavailable.","You have to be in range of the Crownstone to reset the errors.",[{text:"OK"}]);
            }
            else {
              StoneUtil.clearErrors(this.props.sphereId, this.props.stoneId, stone, core.store);
            }
          }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.red.hex,
            backgroundColor: colors.white.hex
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex}}>{ lang("Reset_Error") }</Text>
        </TouchableOpacity>
      )
    }
    else {
      return <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, textAlign:'center'}}>{ lang("Notify_an_admin_of_your_S") }</Text>
    }
  }

  render() {
    const store = core.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>{ lang("Error_Detected") }</Text>
        <View style={{flex:1}} />
        <IconButton
          name="ios-warning"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative'}}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.errorText}>{ErrorContent.getTextDescription(2, stone.errors)}</Text>
        <View style={{flex:1}} />
        { this._getAction(stone) }
        <View style={{flex:1}} />
      </View>
    )
  }
}
