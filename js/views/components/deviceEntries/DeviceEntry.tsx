
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  Text,
  View, ViewStyle, PanResponder
} from "react-native";

import { Icon } from '../Icon';
import { Util } from '../../../util/Util'
import { styles, colors, screenWidth } from "../../styles";
import { AlternatingContent }                 from '../animated/AlternatingContent';
import { MINIMUM_REQUIRED_FIRMWARE_VERSION }  from '../../../ExternalConfig';
import { INTENTS }                            from '../../../native/libInterface/Constants';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { DeviceEntrySubText }                 from "./DeviceEntrySubText";
import {AnimatedCircle} from "../animated/AnimatedCircle";
import {SlideFadeInView} from "../animated/SlideFadeInView";
import { xUtil } from "../../../util/StandAloneUtil";
import { STONE_TYPES } from "../../../Enums";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";
import { DataUtil } from "../../../util/DataUtil";
import Slider from "@react-native-community/slider";
import LinearGradient from 'react-native-linear-gradient';
import { DeviceEntryIcon } from "./submodules/DeviceEntryIcon";
import { DeviceEntryFullSwitch } from "./submodules/DeviceEntryFullSwitch";

const PADDING_LEFT = 15;
const PADDING_RIGHT = 15;

export class DeviceEntry extends Component<any, any> {

  _panResponder;
  baseHeight : number;
  unsubscribe = [];
  animating = false;
  id = xUtil.getUUID();

  showMeshMessageTimeout;

  constructor(props) {
    super(props);

    this.state = {
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
      showViaMesh:     false,
      percentage:      0
    };
  }

  componentDidMount() {
    // this event makes the background of the device entry blink to incidate the error.
    this.unsubscribe.push(core.eventBus.on('showErrorInOverview', (stoneId) => {
      if (stoneId === this.props.stoneId) {
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 90 }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, duration: 2500 }).start();
        }, 5000);
      }
    }));

    this.unsubscribe.push(core.eventBus.on('databaseChange', (data) => {
      let change = data.change;
      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        this.forceUpdate();
        return
      }
    }));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    clearTimeout(this.showMeshMessageTimeout);
  }


  _pressedDevice(stone) {
    let newState = (stone.state.state > 0 ? 0 : 100);

    this.setState({pendingCommand:true});

    if (newState > 0) {
      StoneUtil.turnOnBCH(
        this.props.sphereId,
        this.props.stoneId,
        stone,
        {keepConnectionOpen: true, keepConnectionOpenTimeout: 2},
        (err, result) => {
          let newState = {pendingCommand:false};
          if (!err && result && result.viaMesh === true) {
            newState['showViaMesh'] = true;
            this.showMeshMessageTimeout = setTimeout(() => { this.setState({showViaMesh: false})}, 1000);
          }
          this.setState(newState);
        },
        1,
        'from _pressedDevice in DeviceEntry'
      );
    }
    else {
      StoneUtil.switchBCH(
        this.props.sphereId,
        this.props.stoneId,
        stone, newState,
        {keepConnectionOpen: true, keepConnectionOpenTimeout: 2},
        (err, result) => {
          let newState = {pendingCommand:false};
          if (!err && result && result.viaMesh === true) {
            newState['showViaMesh'] = true;
            this.showMeshMessageTimeout = setTimeout(() => { this.setState({showViaMesh: false})}, 1000);
          }
          this.setState(newState);
        },
        1,
        'from _pressedDevice in DeviceEntry'
      );
    }


  }

  _getControl(stone) {
    let content;
    let action = null;
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false) {
      if (stone.errors.hasError) {
        content = <Switch value={stone.state.state === 1} disabled={true} />;
        action = () => { this._basePressed(); }
      }
      else if (stone.config.locked) {
        content = <Icon name={'md-lock'} color={colors.black.rgba(0.2)} size={32} />;
        action = () => { this._basePressed(); }
      }
      else if (this.state.pendingCommand === true) {
        content = <ActivityIndicator animating={true} size='large' color={colors.black.rgba(0.5)} />;
      }
      else {
        content = <Switch value={stone.state.state > 0} onValueChange={() => { this._pressedDevice(stone); }}/>;
        action = () => { this._pressedDevice(stone);  }
      }
    }


    let wrapperStyle : ViewStyle = {height: this.baseHeight, width: 60, alignItems:'flex-end', justifyContent:'center'};
    if (action) {
      return (
        <TouchableOpacity onPress={() => { action() }} style={wrapperStyle}>
          {content}
        </TouchableOpacity>
      );
    }
    else {
      return <View style={wrapperStyle}>{content}</View>;
    }
  }

  _basePressed() {
    NavigationUtil.navigate( "DeviceOverview",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.props.viewingRemotely})
  }

  _getExplanationText(state) {
    let explanationStyle = { color: colors.iosBlue.hex, fontSize: 12};

    if (this.props.hideExplanation !== true) {
      if (state.app.hasSeenDeviceSettings === false) {
        return (
          <SlideFadeInView height={15} visible={!this.state.showViaMesh}>
            <Text style={explanationStyle}>{ lang("Tap_me_for_more_") }</Text>
          </SlideFadeInView>
        );
      }
      else if (state.app.hasSeenSwitchOverview !== true && this.props.amountOfDimmableCrownstonesInLocation > 1) {
        return (
          <SlideFadeInView height={15} visible={!this.state.showViaMesh}>
            <Text style={explanationStyle}>{ 'Press and hold the icon!' }</Text>
          </SlideFadeInView>
        );
      }
    }
  }


  render() {
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let useControl = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: ['rgba(255, 255, 255, 0.8)',  colors.csOrange.rgba(0.5)]
    });

    let WrapperElement : any = TouchableOpacity;
    if (this.props.touchable === false) {
      WrapperElement = View
    }

    let height = this.props.height || 80;

    if (this.props.switchView) {
      return (
        <Animated.View style={[styles.listView,{flexDirection: 'column', height: height, overflow:'hidden', backgroundColor:backgroundColor}]}>
          <DeviceEntryFullSwitch sphereId={this.props.sphereId} stoneId={this.props.stoneId} height={height} toggleScrollView={this.props.toggleScrollView}/>
        </Animated.View>
      )
    }
    return (
      <Animated.View style={[styles.listView,{flexDirection: 'column', height: height, overflow:'hidden', backgroundColor:backgroundColor}]}>
        <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <WrapperElement style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }} onLongPress={() => { this.props.setSwitchView(true) }}>
            <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} state={state} overrideStoneState={undefined} />
          </WrapperElement>
          <WrapperElement style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}} onPress={() => { this._basePressed(); }}>
            <View style={{flexDirection: 'column'}}>
              <Text style={{fontSize: 17}}>{stone.config.name}</Text>
              <DeviceEntrySubText
                statusTextOverride={this.props.statusText}
                statusText={this.state.statusText}
                deviceType={stone.config.type}
                rssi={StoneAvailabilityTracker.getRssi(this.props.stoneId)}
                disabled={StoneAvailabilityTracker.isDisabled(this.props.stoneId)}
                currentUsage={stone.state.currentUsage}
                nearestInSphere={this.props.nearestInSphere}
                nearestInRoom={this.props.nearestInRoom}
              />
              { this._getExplanationText(state) }
              <SlideFadeInView height={15} visible={this.state.showViaMesh}>
                <Text style={{ color: colors.csOrange.hex, fontSize: 12}}>{ lang("Sent_via_mesh_") }</Text>
              </SlideFadeInView>
            </View>
          </WrapperElement>
          {useControl === true && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) ? this._getControl(stone) : undefined}
        </View>
      </Animated.View>
    );
  }
}

// <Animated.View style={{height:dimmerHeight + dimmerPadding, width: screenWidth, alignItems:'center', justifyContent:'center'}}>
//   <Slider
//     style={{ width: screenWidth*0.85, height: dimmerHeight }}
//     minimumValue={0}
//     maximumValue={100}
//     step={1}
//     value={this.state.percentage}
//     minimumTrackTintColor={colors.white.rgba(0)}
//     maximumTrackTintColor={colors.green.rgba(0.5)}
//     onValueChange={(value) => { console.log(value); this.setState({percentage: value})}}
//   />
// </Animated.View>