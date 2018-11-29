import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceBehaviour", key)(a,b,c,d,e);
}
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

import { colors, screenWidth }              from '../../styles'
import { Util }                             from "../../../util/Util";
import { canUseIndoorLocalizationInSphere } from "../../../util/DataUtil";
import { BEHAVIOUR_TYPES }                  from "../../../router/store/reducers/stones";
import { Permissions }                      from "../../../backgroundProcesses/PermissionManager";


let DISABLED_COLOR = colors.gray.hex;
let WARNING_COLOR = colors.csOrange.hex;

export class DeviceBehaviour extends LiveComponent<any, any> {

  unsubscribeStoreEvents
  componentDidMount() {
    const { store } = this.props;
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      let state = store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (!stone || !stone.config) { return; }

      let applianceId = stone.config.applianceId;
      if (
        change.changeAppSettings ||
        change.stoneLocationUpdated && change.stoneLocationUpdated.stoneIds[this.props.stoneId] ||
        change.updateStoneConfig    && change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        change.updateStoneBehaviour && change.updateStoneBehaviour.stoneIds[this.props.stoneId] ||
        applianceId && change.updateApplianceBehaviour && change.updateApplianceBehaviour.applianceIds[applianceId]
        ) {
          this.forceUpdate();
        }
    });
  }
  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  getWarning(state, stone, nearFarDisabled) {
    let warnings = [];
    if (stone.config.locked) {
      return (
        <View
          style={{flexDirection: 'row'}}
          onPress={() => { Actions.settingsApp(); }}
        >
          <Text style={textStyle.softWarning}>{ lang("This_Crownstone_is_locked") }</Text>
        </View>
      );
    }

    if (state.app.indoorLocalizationEnabled === false) {
      return (
        <TouchableOpacity
          key="heartbeatWarning"
          style={{flexDirection: 'row'}}
          onPress={() => { Actions.settingsApp(); }}
        >
          <Text style={textStyle.warning}>{ lang("Behaviour_is_disabled_in_") }</Text>
        </TouchableOpacity>
      );
    }

    if (state.app.keepAlivesEnabled === false) {
      warnings.push(
        <TouchableOpacity
          key="heartbeatWarning"
          style={{flexDirection: 'row'}}
          onPress={() => { Actions.settingsApp(); }}
        >
          <Text style={textStyle.warning}>{ lang("Heartbeat_is_disabled_in_") }</Text>
        </TouchableOpacity>
      );
    }


    if (nearFarDisabled) {
      warnings.push(
        <TouchableOpacity
          key="nearFarWarning"
          style={{flexDirection: 'row'}}
          onPress={() => {Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});}}
        >
          <Text style={textStyle.warning}>{ lang("Near_away_is_disabled_unt") }</Text>
        </TouchableOpacity>
      );
    }

    return warnings;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(this.props.store, this.props.sphereId, this.props.stoneId, stone);

    let canChangeBehaviour = Permissions.inSphere(this.props.sphereId).changeBehaviour && state.app.indoorLocalizationEnabled;

    let canDoIndoorLocalization = canUseIndoorLocalizationInSphere(state, this.props.sphereId) && stone.config.locationId !== null;

    let nearFarDisabled = canDoIndoorLocalization === false && stone.config.nearThreshold === null && element.behaviour.onAway.active === true && element.behaviour.onNear.active === true;

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center'}}>
        <View style={{flex: 1.5}} />
        <Text style={textStyle.title}>{ lang("Behaviour") }</Text>
        <Text style={textStyle.explanation}>{ lang("This_is_how_I_respond_to_") }</Text>
        <View style={{flex: 1.5}} />
        <BehaviourResponse data={element.behaviour} type={BEHAVIOUR_TYPES.HOME_ENTER} stone={stone} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId} />
        <View style={{flex:0.8}} />
        <BehaviourResponse data={element.behaviour} type={BEHAVIOUR_TYPES.HOME_EXIT}  stone={stone} sphere={sphere} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        <View style={{flex:0.8}} />
        {
          canDoIndoorLocalization ?
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.ROOM_ENTER} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  /> :
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.NEAR}       appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        }
        <View style={{flex:0.8}} />
        {
          canDoIndoorLocalization ?
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.ROOM_EXIT} appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  /> :
          <BehaviourResponse data={element.behaviour} stone={stone} type={BEHAVIOUR_TYPES.AWAY}      appSettings={state.app} canChangeBehaviour={canChangeBehaviour} sphereId={this.props.sphereId} stoneId={this.props.stoneId}  />
        }
        <View style={{flex: 2}} />
        { this.getWarning(state, stone, nearFarDisabled) }
        <View style={{flex: 2}} />
        { element.config.onlyOnWhenDark === true && state.app.indoorLocalizationEnabled ?
        <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => {
          Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }}>
          <Text style={textStyle.value}>{ lang("I_will_") }</Text>
          <Text style={[textStyle.value,{fontStyle: 'italic'}]}>{ lang("only_") }</Text>
          <Text style={[textStyle.value,{color: colors.green.hex}]}>{ lang("_TURN_ON") }</Text>
          <Text style={textStyle.value}>{ lang("_if_it_is_dark_outside_") }</Text>
        </TouchableOpacity> : undefined }
        <View style={{flex:2}} />
        <View style={{height:30, width: screenWidth, backgroundColor:'transparent'}} />
      </View>
    )
  }
}

class BehaviourResponse extends Component<any, any> {
  _getDelay() {
    let delay = this.props.data[this.props.type].delay;
    if (this.props.type === 'onHomeExit' && this.props.sphere) {
      delay = this.props.sphere.config.exitDelay;
    }
    if (delay === 0) { return; }
    return ' after ' + Util.getDelayLabel(delay, true);
  }

  _getValue(responseStyle) {
    if (this.props.data[this.props.type].state > 0) {
      return <Text style={[textStyle.value,responseStyle]}>{ lang("TURN_ON") }</Text>
    }
    else {
      return <Text style={[textStyle.value,responseStyle]}>{ lang("TURN_OFF") }</Text>
    }
  }

  _getTitle() {
    switch (this.props.type) {
      case 'onHomeEnter':
        return lang("When_you_enter_the_Sphere");
      case 'onHomeExit':
        return lang("When_you_leave_the_Sphere");
      case 'onRoomEnter':
        return lang("When_you_enter_the_Room");
      case 'onRoomExit':
        return lang("When_you_leave_the_Room");
      case 'onNear':
        return lang("When_you_get_near_to_Me");
      case 'onAway':
        return lang("When_you_move_away_from_M");
      default:
        return "UNKNOWN TYPE:" + this.props.type
    }
  }


  _getResponseStyle(isDisabled: boolean, active : boolean) {
    if (isDisabled) {
      return {color: DISABLED_COLOR, textDecorationLine:'line-through'};
    }

    if ((this.props.type === 'onNear' || this.props.type === 'onAway') && this.props.stone.config.nearThreshold === null && active) {
      return {color: WARNING_COLOR};
    }

    return {color: colors.white.hex};
  }

  _getValueStyle(isDisabled: boolean, active : boolean, deviceIsOn : boolean) {
    if (isDisabled) {
      return {color: DISABLED_COLOR, textDecorationLine:'line-through'};
    }

    if ((this.props.type === 'onNear' || this.props.type === 'onAway') && this.props.stone.config.nearThreshold === null && active) {
      return {color: WARNING_COLOR};
    }

    if (deviceIsOn) {
      return {color: colors.green.hex};
    }
    else {
      return {color: colors.menuBackground.hex};
    }
  }

  _isDisabled() {
    if (this.props.stone.config.locked === true) {
      return true;
    }

    if (this.props.appSettings.indoorLocalizationEnabled === false) {
      return true;
    }

    if (this.props.appSettings.keepAlivesEnabled === false && (this.props.type === BEHAVIOUR_TYPES.HOME_EXIT || this.props.type === BEHAVIOUR_TYPES.ROOM_EXIT)) {
      return true;
    }

    return false;
  }

  render() {
    let type = this.props.type;
    let active = this.props.data[type].active;
    let isDisabled = this._isDisabled();
    let responseStyle = this._getResponseStyle(isDisabled, active);

    let content;
    if (active) {
      content = (
        <View>
          <Text style={[textStyle.case, responseStyle]}>{this._getTitle()}</Text>
          <View style={{flexDirection: 'row', alignItems:'center', justifyContent:'center'}}>
            {this.props.prefixItem ? this.props.prefixItem :   <Text style={[textStyle.value, responseStyle]}>{ lang("I_will_",this.props.prefix) }</Text>}
            {this._getValue(this._getValueStyle(isDisabled, active, this.props.data[this.props.type].state > 0))}
            {this.props.postfixItem ? this.props.postfixItem : <Text style={[textStyle.value, responseStyle]}>{this._getDelay()}</Text>}
          </View>
        </View>
      );
    }
    else {
      content = (
        <View>
          <Text style={[textStyle.case, responseStyle]}>{this._getTitle()}</Text>
          <Text style={[textStyle.value, {color: colors.white.rgba(0.4), fontWeight:'400', fontStyle:'italic'}, responseStyle]}>{ lang("I_wont_do_anything___") }</Text>
        </View>
      );
    }

    if (isDisabled || !this.props.canChangeBehaviour) {
      return (
        <View style={{alignItems:'center'}}>
          {content}
        </View>
      );
    }
    else {
      return (
        <TouchableOpacity style={{alignItems:'center'}} onPress={() => {
          Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId});
        }}>
          {content}
        </TouchableOpacity>
      );
    }
  }
}

export const textStyle = StyleSheet.create({
  title: {
    color:colors.white.hex,
    fontSize:30,
    paddingBottom:10,
    fontWeight:'bold'
  },
  explanation: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    paddingLeft:15,
    paddingRight:15,
    fontWeight:'400'
  },
  case: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:13,
    padding:5,
    fontWeight:'400',
  },
  value: {
    color:colors.white.hex,
    textAlign:'center',
    fontSize:15,
    fontWeight:'600'
  },
  specification: {
    color:colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontSize:15,
    padding:15,
    fontWeight:'600'
  },
  warning: {
    color: WARNING_COLOR,
    width:screenWidth,
    textAlign:'center',
    fontStyle:'italic',
    fontSize:13,
    padding:15,
    fontWeight:'600'
  },
  softWarning: {
    color: colors.white.hex,
    width:screenWidth,
    textAlign:'center',
    fontStyle:'italic',
    fontSize:13,
    padding:15,
    fontWeight:'600'
  }
});