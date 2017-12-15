import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
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
import {AnimatedCircle} from "../../components/animated/AnimatedCircle";
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { DimmerButton } from "../../components/DimmerButton";
import { INTENTS } from "../../../native/libInterface/Constants";
import {DIMMING_ENABLED} from "../../../ExternalConfig";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import {BatchCommandHandler} from "../../../logic/BatchCommandHandler";

export class DeviceSummary extends Component<any, any> {
  storedSwitchState = 0;


  constructor(props) {
    super(props);
    this.state = {pendingCommand: false};

    const state = props.store.getState();
    const sphere = state.spheres[props.sphereId];
    const stone = sphere.stones[props.stoneId];
    this.storedSwitchState = stone.state.state;
  }

  componentWillUnmount() {
    this.safeStoreUpdate();
  }

  /**
   * this will store the switchstate if it is not already done. Used for dimmers which use the "TRANSIENT" action.
   */
  safeStoreUpdate() {
    const state = this.props.store.getState();
    const sphere = state.spheres[this.props.sphereId];
    if (!sphere) { return; }

    const stone = sphere.stones[this.props.stoneId];
    if (!stone) { return; }

    if (stone.state.state !== this.storedSwitchState) {
      let data = {state: stone.state.state};
      if (stone.state.state === 0) {
        data['currentUsage'] = 0;
      }
      this.props.store.dispatch({
        type: 'UPDATE_STONE_SWITCH_STATE',
        sphereId: this.props.sphereId,
        stoneId: this.props.stoneId,
        data: data
      });

      this.storedSwitchState = stone.state.state;
    }
  }

  _triggerApplianceSelection(stone) {
    this.safeStoreUpdate();
    Actions.applianceSelection({
      sphereId: this.props.sphereId,
      applianceId: stone.config.applianceId,
      stoneId: this.props.stoneId,
      callback: (applianceId) => {
        this.props.store.dispatch({
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          type: 'UPDATE_STONE_CONFIG',
          data: {applianceId: applianceId}
        });
      }});
  }

  _getIcon(stone, element) {
    let currentState = stone.state.state;
    let stateColor = colors.menuBackground.hex;
    if (currentState > 0) {
      stateColor = colors.green.hex;
    }

    if (stone.config.disabled) {
      stateColor = colors.gray.hex;
    }

    let size = 0.2*screenHeight;
    let innerSize = size - 6;
    return (
      <TouchableOpacity onPress={() => {
        this._triggerApplianceSelection(stone);
      }} >
        <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
          <AnimatedCircle size={size} color={stateColor}>
            <AnimatedCircle size={innerSize} color={stateColor} borderWidth={3} borderColor={colors.white.hex}>
              <Icon name={element.config.icon} size={0.575*innerSize} color={'#fff'} />
            </AnimatedCircle>
          </AnimatedCircle>
        </AnimatedCircle>
      </TouchableOpacity>
    );
  }

  _getButton(stone) {
    let currentState = stone.state.state;
    let label = 'Turn On';
    let stateColor = colors.green.hex;
    if (currentState > 0) {
      label = 'Turn Off';
      stateColor = colors.menuBackground.hex;
    }
    let size = 0.22*screenHeight;
    let innerSize = size - 10;
    let borderWidth = 5;


    if (stone.config.disabled) {
      return (
        <View style={{width:0.75*screenWidth, height:size*1.05, alignItems:'center'}}>
          <View style={{flex:2}} />
          <Text style={deviceStyles.text}>{'Searching...'}</Text>
          <View style={{flex:1}} />
          <Text style={deviceStyles.subText}>{'Once I hear from this Crownstone, the button will reappear.'}</Text>
          <View style={{flex:1}} />
          <ActivityIndicator animating={true} size='small' color={colors.white.hex} />
          <View style={{flex:2}} />
        </View>
      );
    }


    if (stone.config.dimmingEnabled === true && DIMMING_ENABLED) {
      return <DimmerButton size={0.3*screenHeight} state={currentState} stone={stone} sphereId={this.props.sphereId} stoneId={this.props.stoneId} callback={(newState) => {
        let data = {state: newState};
        if (newState === 0) {
          data['currentUsage'] = 0;
        }
        this.props.store.dispatch({
          type: 'UPDATE_STONE_SWITCH_STATE_TRANSIENT',
          sphereId: this.props.sphereId,
          stoneId: this.props.stoneId,
          data: data
        })
      }} />;
    }

    if (this.state.pendingCommand === true) {
      return (
        <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
          <AnimatedCircle size={size} color={colors.white.hex}>
            <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={stateColor}>
              <ActivityIndicator animating={true} size='large' color={colors.menuBackground.hex} />
            </AnimatedCircle>
          </AnimatedCircle>
        </AnimatedCircle>
      );
    }
    else {
      return (
        <TouchableOpacity onPress={() => {
          let newState = (currentState === 1 ? 0 : 1);
          this.setState({pendingCommand:true});

          StoneUtil.switchBHC(
            this.props.sphereId,
            this.props.stoneId,
            stone,
            newState,
            this.props.store,
            {},
            () => { this.setState({pendingCommand:false}); this.storedSwitchState = newState; },
            INTENTS.manual,
            1,
            'from _getButton in DeviceSummary'
          );

        }}>
          <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
            <AnimatedCircle size={size} color={colors.white.hex}>
              <AnimatedCircle size={innerSize} color={colors.white.hex} borderWidth={borderWidth} borderColor={stateColor}>
                <Text style={{color: stateColor, fontSize:23, fontWeight:'600'}}>{label}</Text>
              </AnimatedCircle>
            </AnimatedCircle>
          </AnimatedCircle>
        </TouchableOpacity>
      );
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(sphere, stone);
    const location = Util.data.getLocationFromStone(sphere, stone);

    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    let canChangeSettings = stone.config.applianceId ? spherePermissions.editAppliance : spherePermissions.editCrownstone;
    let canMoveCrownstone = spherePermissions.moveCrownstone;

    let locationLabel = "Currently in Room:";
    let locationName = "No";
    if (location) {
      locationLabel = "Located in:";
      locationName = location.config.name;
    }

    return (
      <View style={{flex:1, paddingBottom:35}}>
        <DeviceInformation left={"Energy Consumption:"}
                           leftValue={stone.state.currentUsage + ' W'}
                           right={locationLabel}
                           rightValue={locationName}
                           rightTapAction={canMoveCrownstone ? () => {
                           Actions.roomSelection({
                             sphereId: this.props.sphereId,
                             stoneId: this.props.stoneId,
                             locationId: this.props.locationId,
                           }); } : null}
        />
        <DeviceInformation left={stone.config.applianceId ? "Crownstone Name:" : "Connected Device:"}
                           leftValue={stone.config.applianceId ? stone.config.name : 'None'}
                           right={"Connected to Mesh:"} rightValue={stone.config.meshNetworkId ? 'Yes' : 'Not Yet'}
                           leftTapAction={canChangeSettings ? () => { this._triggerApplianceSelection(stone); }  : null}
        />
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center' }}>{this._getIcon(stone, element)}</View>
        <View style={{flex:1}} />
        <Text style={deviceStyles.explanation}>{Util.spreadString('tap icon to set device type')}</Text>
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View>
        <View style={{flex:0.5}} />
      </View>
    )
  }
}


export class DeviceInformation extends Component<any, any> {
  render() {
    return (
      <View>
        <View style={{width:screenWidth, flexDirection:'row', padding:10, paddingBottom:0}}>
          {this.props.leftTapAction ?  <TouchableOpacity onPress={this.props.leftTapAction}><Text style={deviceStyles.subText}>{this.props.left}</Text></TouchableOpacity> : <Text style={deviceStyles.subText}>{this.props.left}</Text>}
          <View style={{flex:1}} />
          {this.props.rightTapAction ? <TouchableOpacity onPress={this.props.rightTapAction}><Text style={deviceStyles.subText}>{this.props.right}</Text></TouchableOpacity> : <Text style={deviceStyles.subText}>{this.props.right}</Text>}
        </View>
        <View style={{width:screenWidth, flexDirection:'row', paddingLeft:10, paddingRight:10}}>
          {this.props.leftTapAction ?  <TouchableOpacity onPress={this.props.leftTapAction}><Text style={deviceStyles.text}>{this.props.leftValue}</Text></TouchableOpacity> : <Text style={deviceStyles.text}>{this.props.leftValue}</Text>}
          <View style={{flex:1}} />
          {this.props.rightTapAction ? <TouchableOpacity onPress={this.props.rightTapAction}><Text style={deviceStyles.text}>{this.props.rightValue}</Text></TouchableOpacity> : <Text style={deviceStyles.text}>{this.props.rightValue}</Text>}
        </View>
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  text: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});