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
import { LOG } from '../../../logging/Log'
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";
import {StoneUtil} from "../../../util/StoneUtil";
import {enoughCrownstonesInLocationsForIndoorLocalization} from "../../../util/DataUtil";


let DISABLED_COLOR = colors.csOrange.hex;

export class DeviceBehaviour extends Component<any, any> {
  constructor() {
    super();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(sphere, stone);

    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId) && stone.config.locationId !== null;
    let nearFarDisabled = canDoIndoorLocalization === false && stone.config.nearThreshold === null && element.behaviour.onAway.active === true && element.behaviour.onNear.active === true;

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center'}}>
        <View style={{flex: 1.5}} />
        <Text style={textStyle.title}>Behaviour</Text>
        <Text style={textStyle.explanation}>This is how I respond to your location:</Text>
        <View style={{flex: 1.5}} />
        <BehaviourResponse data={element.behaviour} type="onHomeEnter" stone={stone} />
        <View style={{flex:0.8}} />
        <BehaviourResponse data={element.behaviour} type="onHomeExit" stone={stone} sphere={sphere} />
        <View style={{flex:0.8}} />
        {canDoIndoorLocalization ? <BehaviourResponse data={element.behaviour} stone={stone} type="onRoomEnter" /> : <BehaviourResponse data={element.behaviour} stone={stone}  type="onNear" />}
        <View style={{flex:0.8}} />
        {canDoIndoorLocalization ? <BehaviourResponse data={element.behaviour} stone={stone} type="onRoomExit" /> : <BehaviourResponse data={element.behaviour}  stone={stone}  type="onAway" />}
        <View style={{flex: 2}} />
        {nearFarDisabled ? <Text style={textStyle.warning}>Near/away is disabled until you define where near is. Press change at the top to do this now.</Text> : undefined}
        <View style={{flex: 2}} />
        { stone.config.onlyOnWhenDark ?
        <View style={{flexDirection: 'row',}} >
          <Text style={textStyle.value}>I will </Text>
          <Text style={[textStyle.value,{fontStyle: 'italic'}]}>only </Text>
          <Text style={[textStyle.value,{color: colors.green.hex}]}> TURN ON</Text>
          <Text style={textStyle.value}> if it is dark outside.</Text>
        </View> : undefined }
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

  _getValue(enabled) {
    if (this.props.data[this.props.type].state > 0) {
      return <Text style={[textStyle.value,{color: enabled ? colors.green.hex : DISABLED_COLOR}]}>TURN ON</Text>
    }
    else {
      return <Text style={[textStyle.value,{color: enabled ? colors.menuBackgroundDarker.hex : DISABLED_COLOR}]}>TURN OFF</Text>
    }
  }

  _getTitle(enabled) {
    switch (this.props.type) {
      case 'onHomeEnter':
        return 'When you enter the Sphere';
      case 'onHomeExit':
        return 'When you leave the Sphere';
      case 'onRoomEnter':
        return 'When you enter the Room';
      case 'onRoomExit':
        return 'When you leave the Room';
      case 'onNear':
        return 'When you get near to Me';
      case 'onAway':
        return 'When you move away from Me';
      default:
        return "UNKNOWN TYPE:" + this.props.type
    }
  }

  render() {
    let type = this.props.type;
    let active = this.props.data[type].active;
    let enabled = true;

    if ((type === 'onNear' || type === 'onAway') && this.props.stone.config.nearThreshold === null) {
      enabled = false;
    }

    if (active) {
      return (
        <View style={{alignItems:'center'}}>
          <Text style={[textStyle.case,{color: enabled ? colors.white.hex : DISABLED_COLOR}]}>{this._getTitle(enabled)}</Text>
          <View style={{flexDirection: 'row', alignItems:'center'}} >
            {this.props.prefixItem ? this.props.prefixItem : <Text style={[textStyle.value, {color: enabled ? colors.white.hex : DISABLED_COLOR}]}>{this.props.prefix || 'I will '}</Text>}
            {this._getValue(enabled)}
            {this.props.postfixItem ? this.props.postfixItem : <Text style={[textStyle.value, {color: enabled ? colors.white.hex : DISABLED_COLOR}]}>{this._getDelay()}</Text>}
          </View>
        </View>
      );
    }
    else {
      return (
        <View style={{alignItems:'center'}}>
          <Text style={textStyle.case}>{this._getTitle(enabled)}</Text>
          <Text style={[textStyle.value, {color: colors.white.rgba(0.4), fontWeight:'400', fontStyle:'italic'}]}>{"I won't do anything..."}</Text>
        </View>
      );
    }


  }
}

let textStyle = StyleSheet.create({
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
    fontWeight:'400'
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
    color: DISABLED_COLOR,
    width:screenWidth,
    textAlign:'center',
    fontStyle:'italic',
    fontSize:13,
    padding:15,
    fontWeight:'400'
  }

});