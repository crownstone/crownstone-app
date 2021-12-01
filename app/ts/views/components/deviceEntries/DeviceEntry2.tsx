
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
  View, ViewStyle
} from "react-native";

import { Icon } from '../Icon';
import { Util } from '../../../util/Util'
import { styles, colors, screenWidth } from "../../styles";
import { MINIMUM_REQUIRED_FIRMWARE_VERSION }  from '../../../ExternalConfig';
import { StoneUtil }                          from "../../../util/StoneUtil";
import { xUtil } from "../../../util/StandAloneUtil";
import { STONE_TYPES } from "../../../Enums";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";
import { DeviceEntryIcon } from "./submodules/DeviceEntryIcon";
import { safeStoreUpdate } from "../../deviceViews/DeviceOverview";
import { LOGe } from "../../../logging/Log";

const PADDING_LEFT = 15;
const PADDING_RIGHT = 15;

export class DeviceEntry2 extends Component<any, any> {

  _panResponder;
  unsubscribe = [];
  animating = false;
  id = xUtil.getUUID();

  showMeshMessageTimeout;

  // these are used to determine persisting the switchstate.
  actualState = 0;
  storedSwitchState = 0;
  storeSwitchState = false;
  storeSwitchStateTimeout = null;

  constructor(props) {
    super(props);
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    let switchState = stone.state.state;
    this.actualState = switchState;
    this.storedSwitchState = switchState;
    this.state = {
      pendingCommand:  false,
      backgroundColor: new Animated.Value(0),
      statusText:      null,
      percentage:      switchState,
    };
  }

  componentDidMount() {
    // this event makes the background of the device entry blink to incidate the error.
    this.unsubscribe.push(core.eventBus.on('showErrorInOverview', (stoneId) => {
      if (stoneId === this.props.stoneId) {
        Animated.spring(this.state.backgroundColor, { toValue: 10, friction: 1.5, tension: 90, useNativeDriver: false }).start();
        setTimeout(() => {
          Animated.timing(this.state.backgroundColor, { toValue: 0, useNativeDriver: false, duration: 2500 }).start();
        }, 5000);
      }
    }));

    this.unsubscribe.push(core.eventBus.on('databaseChange', (data) => {
      let change = data.change;
      if (change.updateStoneState && change.updateStoneState.stoneIds[this.props.stoneId]) {
        let change = data.change;
        let state = core.store.getState();
        let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
        if (!stone || !stone.config) { return; }
        if (stone.state.state !== this.state.percentage) {
          this.setState({percentage: stone.state.state})
          return;
        }
        this.forceUpdate();
        return
      }
    }));
  }

  componentWillUnmount() { // cleanup
    this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
    if (this.storeSwitchState) {
      clearTimeout(this.storeSwitchStateTimeout);
      this.storedSwitchState = safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
    }
    clearTimeout(this.showMeshMessageTimeout);
  }

  async _pressedDevice(stone) {
    this.setState({pendingCommand:true});
    try {
      if (stone.state.state > 0) {
        // turn off
        await StoneUtil.turnOff(stone);
        this.setState({pendingCommand:false, percentage: 0});
      }
      else {
        // turn on
        let newState = await StoneUtil.turnOn(stone)
        this.setState({pendingCommand:false, percentage: newState});
      }
    }
    catch (err) {
      LOGe.info("DeviceEntry: Failed to switch", err);
      this.setState({pendingCommand:false});
    }
  }

  _getControl(stone) {
    let content;
    let action = null;
    if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false) {
      if (stone.errors.hasError) {
        content = <Switch value={stone.state.state > 0} disabled={true} />;
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


    let wrapperStyle : ViewStyle = {width: 75, paddingRight:15, alignItems:'flex-end', justifyContent:'center'};
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

  _getExplanationText(state, stone) {
    let explanationStyle = { color: colors.iosBlue.hex, fontSize: 12};
    let explanation = null;

    let updateAvailable = stone.config.firmwareVersion && (Util.canUpdate(stone, state) === true || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)

    if (this.props.hideExplanation !== true) {
      if (state.app.hasSeenDeviceSettings === false) {
        explanation = <Text style={explanationStyle}>{  lang("Tap_me_for_more_") }</Text>;
      }
      else if (state.app.hasSeenSwitchView !== true && this.props.amountOfDimmableCrownstonesInLocation > 1 && stone.errors.hasError !== true && !updateAvailable) {
        explanation = <Text style={explanationStyle}>{ lang("Tap_icon_to_quickly_dim_y") }</Text>;
      }
    }

    if (explanation) {
      return (
        <View style={{height:15}}>
          {explanation}
        </View>
      )
    }
    return null;
  }

  render() {
    let state = core.store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let useControl = stone.config.type === STONE_TYPES.plug || stone.config.type === STONE_TYPES.builtin || stone.config.type === STONE_TYPES.builtinOne;
    let backgroundColor = this.state.backgroundColor.interpolate({
      inputRange: [0,10],
      outputRange: ['rgba(255, 255, 255, 0.8)',  colors.csOrange.rgba(0.5)]
    });


    let height = this.props.height || 80;
    let sliderWidth = screenWidth - 20 - 60 - 30;
    let explanationText = this._getExplanationText(state, stone);


    return (
      <Animated.View style={[styles.listView,{flexDirection: 'column', paddingRight:0, margin:15, marginBottom:0, borderRadius: 10, height: height, overflow:'hidden', backgroundColor:backgroundColor}]}>
        <View style={{flexDirection: 'row', paddingRight: 0, paddingLeft: 0, flex: 1}}>
          <TouchableOpacity style={{justifyContent: 'center'}} onPress={() => {
            if (StoneAvailabilityTracker.isDisabled(this.props.stoneId) === false &&
              stone.config.firmwareVersion &&
              (Util.canUpdate(stone, state) === true || xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) === false)
            ) {
              NavigationUtil.launchModal( "DfuIntroduction", {sphereId: this.props.sphereId});
              return;
            }

            this._basePressed()
          }}>
            <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} state={state} overrideStoneState={undefined} />
          </TouchableOpacity>
          <View style={{flex: 1, justifyContent: 'center'}}>
            <View style={{justifyContent:'center'}}>
              <View style={{paddingLeft:20}}>
                <Text style={{fontSize: 17}}>{stone.config.name}</Text>
              </View>
            </View>
          </View>
          {useControl === true && xUtil.versions.canIUse(stone.config.firmwareVersion, MINIMUM_REQUIRED_FIRMWARE_VERSION) ?
            <View style={{justifyContent: 'center' }}>
              {this._getControl(stone)}
            </View>
            : <View style={{ width: 15 }}/>
          }
        </View>
      </Animated.View>
    );
  }
}