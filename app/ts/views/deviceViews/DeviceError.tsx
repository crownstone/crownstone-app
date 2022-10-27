import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceError", key)(a,b,c,d,e);
}

import { Background } from '../components/Background'
import { availableScreenHeight, colors, screenWidth, styles } from "../styles";
import { Alert, Text, View } from "react-native";
import { BehaviourSubmitButton } from "./smartBehaviour/supportComponents/BehaviourSubmitButton";
import React, { Component } from "react";
import { ErrorContent } from "../content/ErrorContent";
import { Permissions } from "../../backgroundProcesses/PermissionManager";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";
import { StoneUtil } from "../../util/StoneUtil";
import { core } from "../../Core";
import {Get} from "../../util/GetUtil";
import {TopBarUtil} from "../../util/TopBarUtil";
import {LiveComponent} from "../LiveComponent";
import {Icon} from "../components/Icon";


export class DeviceError extends LiveComponent<any, any> {
  static options(props) {
    getTopBarProps(props);
    return TopBarUtil.getOptions(NAVBAR_PARAMS_CACHE);
  }


  _getButton(stone) {
    if (Permissions.inSphere(this.props.sphereId).canClearErrors) {
      return (
        <BehaviourSubmitButton
          width={ 0.8*screenWidth }
          color={ colors.blue.rgba(0.5) }
          label={ ErrorContent.getButtonLabel(stone.errors, stone?.abilities?.dimming?.enabledTarget) }
          callback={() => {
            if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
              Alert.alert(
                lang("_Stone_unavailable___You__header"),
                lang("_Stone_unavailable___You__body"),
        [{text:lang("_Stone_unavailable___You__left")}]);
            }
            else {
              StoneUtil.clearErrors(this.props.sphereId, this.props.stoneId, stone, core.store);
            }
          }}
        />
      );
    }
    else {
      return <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex, textAlign:'center', padding:30}}>{ lang("Notify_an_admin_of_your_S") }</Text>
    }
  }


  _getHardwareErrorInformation(stone) {
    return (
      <View style={{flex:5, width:screenWidth, padding:30, ...styles.centered}}>
        <View style={{flex:1}} />
        <Text style={{color: colors.white.hex, fontSize: 18, fontWeight:'bold', textAlign:'center'}}>{ErrorContent.getHeader(stone.errors, stone?.abilities?.dimming?.enabledTarget)}</Text>
        <View style={{flex:1}} />
        <Text style={{color: colors.white.hex, fontSize: 15, fontWeight:'bold', textAlign:'center'}}>{ErrorContent.getSubheader(stone.errors, stone?.abilities?.dimming?.enabledTarget)}</Text>
        <View style={{flex:1}} />
      </View>
    )
  }


  _getStoneIcon(stone) {
    let iconColor = colors.white.rgba(1);
    let size = 0.15*availableScreenHeight;

    return (
      <View style={{width: screenWidth, height:size, alignItems:'center', justifyContent:'center'}}>
        <Icon size={size} color={iconColor} name={stone.config.icon} />
      </View>
    )
  }


  render() {
    let stone = Get.stone(this.props.sphereId, this.props.stoneId);

    return (
      <Background image={require("../../../assets/images/backgrounds/hwError.jpg")}>
        <View style={{flex:2}} />

        { this._getStoneIcon(stone) }

        { this._getHardwareErrorInformation(stone) }

        <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View>

        <View style={{ height: 40}} />
      </Background>
    )
  }
}


function getTopBarProps(props) {
  const state = core.store.getState();
  const stone = state.spheres[props.sphereId].stones[props.stoneId];

  NAVBAR_PARAMS_CACHE = {
    title: stone.config.name,
    closeModal: true,
    darkBackground: true
  }

  return NAVBAR_PARAMS_CACHE;
}

let NAVBAR_PARAMS_CACHE : topbarOptions = null;


