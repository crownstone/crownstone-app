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

import { colors, screenWidth, screenHeight } from '../../styles'
import { Util }                from "../../../util/Util";
import { Icon }                from "../../components/Icon";
import { StoneUtil }           from "../../../util/StoneUtil";
import { AnimatedCircle }      from "../../components/animated/AnimatedCircle";
import { DimmerButton }        from "../../components/DimmerButton";
import { INTENTS }             from "../../../native/libInterface/Constants";
import { Permissions}          from "../../../backgroundProcesses/PermissionManager";
import { EventBusClass}        from "../../../util/EventBus";
import { LockedStateUI}        from "../../components/LockedStateUI";
import { BatchCommandHandler } from "../../../logic/BatchCommandHandler";

export class DeviceSummary extends Component<any, any> {
  storedSwitchState = 0;
  unsubscribeStoreEvents;

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

    if (stone.config.locked) {
      return (
        <LockedStateUI
          size={0.3*screenHeight}
          state={currentState}
          stone={stone}
          sphereId={this.props.sphereId}
          stoneId={this.props.stoneId}
          unlockCrownstone={ () => {
            let promise = BatchCommandHandler.loadPriority(stone, this.props.stoneId, this.props.sphereId, { commandName : 'lockSwitch', value: false });
            BatchCommandHandler.executePriority();
            return promise;
          }}
          unlockDataCallback={() => { this.props.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: {locked: false}})}}
        />
      );
    }

    if (stone.config.dimmingEnabled === true) {
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

  _getLockIcon(stone) {
    let wrapperStyle = {
      width: 35,
      height: 35,
      position: 'absolute',
      bottom: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: "center"
    };
    if (stone.config.disabled === false && stone.config.locked === false) {
      return (
        <TouchableOpacity
          onPress={() => {this.props.eventBus.emit('showLockOverlay', { sphereId: this.props.sphereId, stoneId: this.props.stoneId })}}
          style={wrapperStyle}>
          <Icon name={"md-unlock"} color={colors.white.rgba(0.5)} size={30}/>
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle} />;
    }
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const location = Util.data.getLocationFromStone(sphere, stone);

    // stone.config.disabled = false
    let spherePermissions = Permissions.inSphere(this.props.sphereId);

    let locationLabel = "Location:";
    let locationName = "Not in room";
    if (location) {
      locationLabel = "Located in:";
      locationName = location.config.name;
    }

    if (spherePermissions.moveCrownstone) {
      locationLabel = "Tap here to move me!";
    }

    let showDimmingText = stone.config.dimmingAvailable === false && stone.config.dimmingEnabled === true && stone.config.disabled === false;

    return (
      <View style={{flex:1, paddingBottom: 35}}>
        <DeviceInformation
          left={"Energy Usage:"}
          leftValue={stone.state.currentUsage + ' W'}
          right={locationLabel}
          rightValue={locationName}
          rightTapAction={spherePermissions.moveCrownstone ? () => { Actions.roomSelection({sphereId: this.props.sphereId,stoneId: this.props.stoneId,locationId: this.props.locationId, returnToCrownstone: true}); } : null}
        />
        <View style={{flex:2}} />
        <View style={{width:screenWidth, alignItems: 'center' }}>
          <DeviceButton
            store={this.props.store}
            eventBus={this.props.eventBus}
            stoneId={this.props.stoneId}
            sphereId={this.props.sphereId}
            callback={(stone) => { spherePermissions.canChangeAppliance ? this._triggerApplianceSelection(stone) : null }}
          />
        </View>
        <View style={{flex:1}} />
        <Text style={deviceStyles.explanation}>{Util.spreadString(showDimmingText ? "The dimmer is starting up!\nI'll dim as soon as I can!" : 'tap icon to set device type')}</Text>
        <View style={{flex:1}} />
        <View style={{width:screenWidth, alignItems: 'center'}}>{this._getButton(stone)}</View>
        <View style={{flex:0.5}} />
        { this._getLockIcon(stone) }
      </View>
    )
  }
}

export class DeviceButton extends Component<{store: any, sphereId: string, stoneId: string, eventBus: EventBusClass, callback?(any): void}, any> {
  unsubscribeStoreEvents;

  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.stoneUsageUpdatedTransient && change.stoneUsageUpdatedTransient.stoneIds[this.props.stoneId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeStoreEvents();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(this.props.store, this.props.sphereId, this.props.stoneId, stone);

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

    let content = (
      <AnimatedCircle size={size*1.05} color={colors.black.rgba(0.08)}>
        <AnimatedCircle size={size} color={stateColor}>
          <AnimatedCircle size={innerSize} color={stateColor} borderWidth={3} borderColor={colors.white.hex}>
            <Icon name={element.config.icon} size={0.575*innerSize} color={'#fff'} />
          </AnimatedCircle>
        </AnimatedCircle>
      </AnimatedCircle>
    );

    if (this.props.callback) {
      return (
        <TouchableOpacity onPress={() => {
          const store = this.props.store;
          const state = store.getState();
          const sphere = state.spheres[this.props.sphereId];
          const stone = sphere.stones[this.props.stoneId];
          this.props.callback(stone);
        }}>
          {content}
        </TouchableOpacity>
      );
    }
    else {
      return<View>{content}</View>
    }
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
          {this.props.rightTapAction ? <TouchableOpacity onPress={this.props.rightTapAction} style={{flexDirection:'row'}}><Text style={deviceStyles.clickableTexct}>{this.props.rightValue}</Text><Icon name={"md-log-in"} size={20} color={colors.white.hex} style={{paddingLeft:5}} /></TouchableOpacity> : <Text style={deviceStyles.text}>{this.props.rightValue}</Text>}
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
  clickableTexct: {
    color: textColor.hex,
    fontSize: 18,
    fontWeight:'600',
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