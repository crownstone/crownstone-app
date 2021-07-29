
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LockedStateUI", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  PanResponder,
  Text,
  View, ViewStyle, TextStyle
} from "react-native";


import {colors, screenWidth} from '../styles'
import {AnimatedDial} from "./AnimatedDial";
import {Icon} from "./Icon";
import {LOGe} from "../../logging/Log";
import {Permissions} from "../../backgroundProcesses/PermissionManager";
import { core } from "../../Core";

export class LockedStateUI extends Component<any, any> {
  _panResponder;

  controlling = false;
  _startTime = 0;
  timeout;
  loadingAmountRequired;

  constructor(props) {
    super(props);

    this.state = {level: 0, unlockingInProgress: false, unlocked: false};
    this.loadingAmountRequired = 3000;

    this.init();
  }

  init() {
    // configure the pan responder
    this._panResponder = PanResponder.create({
      // Ask to be the responder:
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderTerminationRequest: (evt, gestureState) => false,
      onPanResponderGrant: (evt, gestureState) => {
        if (Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
          if (this.state.unlockingInProgress === false) {
            this.controlling = true;
            this._startTime = Date.now();
            this._updateLoop();
            core.eventBus.emit("UIGestureControl", false);
          }
        }
      },
      onPanResponderMove: (evt, gestureState) => {},

      onPanResponderRelease: (evt, gestureState) => {
        if (Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
          this._startTime = 0;
          clearTimeout(this.timeout);
          if (this.state.level === 1) {
            this._unlockCrownstone()
          }
          else {
            this.setState({level: 0});
          }
          core.eventBus.emit("UIGestureControl", true)
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Another component has become the responder, so this gesture
        // should be cancelled
      },
      onShouldBlockNativeResponder: (evt, gestureState) => {
        // Returns whether this component should block native components from becoming the JS
        // responder. Returns true by default. Is currently only supported on android.
        return true;
      },
    });
  }

  _unlockCrownstone() {
    this.setState({unlockingInProgress: true});

    this.props.unlockCrownstone()
      .then(() => {
        this.setState({ unlockingInProgress: false, unlocked: true });
        setTimeout(() => { this.props.unlockDataCallback() }, 500);
      })
      .catch((err) => {
        LOGe.info("LockedStateUI: failed to unlock Crownstone", err);
        this.setState({ unlockingInProgress: false, failed: true });
        setTimeout(() => { this.setState({ failed: false }); }, 1500);
      })
  }

  _updateLoop() {
    let level = 0;
    if (this.controlling) {
      level = Math.min(1,(Date.now() - this._startTime)/this.loadingAmountRequired);

      if (level === 1) {
        this.controlling = false;
        this.setState({level:1, failed: false});
        clearTimeout(this.timeout);
      }
      else {
        this.setState({level: level, failed: false});
        this.timeout = setTimeout(() => {
          this._updateLoop();
        }, 100);
      }
    }
  }


  _getContent() {
    let viewStyle : ViewStyle = {width: this.props.size, height: this.props.size, position:'absolute', top:0, left:0, alignItems:'center', justifyContent:'center'};
    let textStyle : TextStyle = {fontSize:12, textAlign:'center', color: colors.csBlue.hex, paddingTop:5, fontWeight: 'bold'};
    if (!Permissions.inSphere(this.props.sphereId).canUnlockCrownstone) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.csBlue.hex}
          />
          <Text style={textStyle}>{ lang("Ask_an_admin_nto_unlock_m") }</Text>
        </View>
      )
    }

    if (this.state.unlockingInProgress) {
      return (
        <View style={viewStyle}>
          <ActivityIndicator animating={true} size='large' color={colors.csBlue.hex} />
          <Text style={textStyle}>{ lang("Unlocking___") }</Text>
        </View>
      )
    }
    else if (this.state.unlocked) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-unlock"
            size={this.props.size*0.3}
            color={colors.csBlue.hex}
          />
          <Text style={textStyle}>{ lang("Done") }</Text>
        </View>
      )
    }
    else if (this.state.failed) {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.red.hex}
          />
          <Text style={textStyle}>{ lang("Couldnt_unlock____nYou_mu") }</Text>
        </View>
      )
    }
    else {
      return (
        <View style={viewStyle}>
          <Icon
            name="md-lock"
            size={this.props.size*0.3}
            color={colors.csBlue.rgba(0.75)}
          />
          <Text style={textStyle}>{ lang("Press_and_hold_nto_unlock") }</Text>
        </View>
      )
    }
  }

  render() {
    return (
      <View  style={{width: screenWidth, height: this.props.size, alignItems:'center', justifyContent:'center'}}>
        <View {...this._panResponder.panHandlers} style={{width: this.props.size, height: this.props.size, alignItems:'center', justifyContent:'center'}}>
          <AnimatedDial width={this.props.size} height={this.props.size} level={this.state.level} blink={this.state.blink} />
          {this._getContent()}
        </View>
      </View>
  );
  }
}