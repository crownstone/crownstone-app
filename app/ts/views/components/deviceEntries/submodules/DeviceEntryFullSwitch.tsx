//
// import { Languages } from "../../../../Languages"
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("DeviceEntry", key)(a,b,c,d,e);
// }
// import * as React from 'react'; import { Component } from 'react';
// import {
//   Animated,
//   ActivityIndicator,
//   Switch,
//   TouchableOpacity,
//   Text,
//   View, ViewStyle, PanResponder
// } from "react-native";
// import Slider from "@react-native-community/slider";
// import LinearGradient from 'react-native-linear-gradient';
// import { NavigationUtil } from "../../../../util/NavigationUtil";
// import { StoneAvailabilityTracker } from "../../../../native/advertisements/StoneAvailabilityTracker";
// import { colors, screenHeight, screenWidth, styles } from "../../../styles";
// import { AlternatingContent } from "../../animated/AlternatingContent";
// import { Icon } from "../../Icon";
// import { Util } from "../../../../util/Util";
// import { xUtil } from "../../../../util/StandAloneUtil";
// import { MINIMUM_REQUIRED_FIRMWARE_VERSION } from "../../../../ExternalConfig";
// import { AnimatedCircle } from "../../animated/AnimatedCircle";
// import { STONE_TYPES } from "../../../../Enums";
// import { core } from "../../../../core";
// import { DeviceEntryIcon } from "./DeviceEntryIcon";
// import { StoneUtil } from "../../../../util/StoneUtil";
// import { safeStoreUpdate } from "../../../deviceViews/DeviceOverview";
//
// const PADDING_LEFT = 15;
// const PADDING_RIGHT = 15;
// const BUBBLE_RADIUS = 30;
// const RANGE = screenWidth-2*BUBBLE_RADIUS-PADDING_RIGHT-PADDING_LEFT;
//
// export class DeviceEntryFullSwitch extends Component<any, any> {
//
//   _panResponder;
//   baseHeight : number;
//   unsubscribe = [];
//   animating = false;
//
//   showMeshMessageTimeout;
//
//   // these are used to determine persisting the switchstate.
//   actualState = 0;
//   storedSwitchState = 0;
//   storeSwitchState = false;
//   storeSwitchStateTimeout = null;
//
//   constructor(props) {
//     super(props);
//
//     let state = core.store.getState();
//     let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//     let switchState = stone.state.state;
//     this.actualState = switchState;
//     this.storedSwitchState = switchState;
//     this.state = {
//
//       percentage: switchState,
//       offsetLeft: new Animated.Value(PADDING_LEFT),
//       whiteMaskWidth: new Animated.Value(screenWidth),
//     };
//
//     this.init();
//   }
//
//   componentDidMount() {
//     let state = core.store.getState();
//     let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//     let switchState = stone.state.state;
//
//     let animations = [];
//     animations.push(Animated.timing(this.state.offsetLeft,  {toValue: 0.01*switchState*RANGE+PADDING_LEFT, duration:150}));
//     animations.push(Animated.timing(this.state.whiteMaskWidth,  {toValue: (1-0.01*switchState)*screenWidth, duration:150}));
//     Animated.parallel(animations).start();
//
//     if (state.app.hasSeenSwitchOverview === false) {
//       core.store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { hasSeenSwitchOverview: true } })
//     }
//   }
//
//
//   init() {
//     const updateState = (gestureState) => {
//       let newState = Math.max(PADDING_LEFT+BUBBLE_RADIUS, Math.min(screenWidth-BUBBLE_RADIUS-PADDING_RIGHT, gestureState.x0 + gestureState.dx));
//
//       let percentage = Math.max(0,Math.min(1,((newState-PADDING_LEFT-BUBBLE_RADIUS) / RANGE)));
//       let switchState =  Math.round(percentage*100);
//       this.state.offsetLeft.setValue(newState-BUBBLE_RADIUS);
//       this.state.whiteMaskWidth.setValue((1-percentage)*screenWidth);
//       this.setState({percentage: switchState});
//
//       let state = core.store.getState();
//       let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//       if (stone.abilities.dimming.enabledTarget) {
//         this._switch(stone, switchState);
//       }
//     }
//
//     // configure the pan responder
//     this._panResponder = PanResponder.create({
//       onStartShouldSetPanResponder:        (evt, gestureState) => true,
//       onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
//       onMoveShouldSetPanResponder:         (evt, gestureState) => true,
//       onMoveShouldSetPanResponderCapture:  (evt, gestureState) => true,
//       onPanResponderTerminationRequest:    (evt, gestureState) => false,
//       onShouldBlockNativeResponder:        (evt, gestureState) => true,
//       onPanResponderTerminate:             (evt, gestureState) => { },
//       onPanResponderGrant: (evt, gestureState) => {
//         if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
//           return false;
//         }
//         NavigationUtil.setViewBackSwipeEnabled(false);
//         this.props.toggleScrollView(false);
//         updateState(gestureState);
//       },
//       onPanResponderMove: (evt, gestureState) => {
//         if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
//           return false;
//         }
//         updateState(gestureState);
//       },
//
//       onPanResponderRelease: (evt, gestureState) => {
//         this.props.toggleScrollView(true);
//         NavigationUtil.setViewBackSwipeEnabled(true);
//         let state = core.store.getState();
//         let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//
//         if (stone.abilities.dimming.enabledTarget === false) {
//           // snap to nearest
//           let switchState = 0;
//           if (this.actualState === 0 && this.state.percentage >= 30) {
//             switchState = 100;
//           }
//           else if (this.actualState === 0 && this.state.percentage < 30) {
//             switchState = 0;
//           }
//           else if (this.actualState === 100 && this.state.percentage < 70) {
//             switchState = 0;
//           }
//           else if (this.actualState === 100 && this.state.percentage >= 70) {
//             switchState = 100;
//           }
//           if (this.actualState !== switchState) {
//             this._switch(stone, switchState);
//           }
//
//           let animations = [];
//           animations.push(Animated.timing(this.state.offsetLeft,  {toValue: 0.01*switchState*RANGE+PADDING_LEFT, duration:150}));
//           animations.push(Animated.timing(this.state.whiteMaskWidth,  {toValue: (1-0.01*switchState)*screenWidth, duration:150}));
//           Animated.parallel(animations).start(() => { this.setState({ percentage: switchState }) });
//         }
//       },
//     });
//   }
//
//   _switch(stone, state) {
//     StoneUtil.switchBCH(
//       this.props.sphereId,
//       this.props.stoneId,
//       stone,
//       state,
//       {},
//       () => { this._planStoreAction(state); },
//       1,
//       'from _getButton in DeviceSummary',
//       true
//     );
//   }
//
//   _planStoreAction(state) {
//     this.actualState = state;
//     this.storeSwitchState = true;
//     clearTimeout(this.storeSwitchStateTimeout);
//     this.storeSwitchStateTimeout = setTimeout(() => {
//       this.storeSwitchState = false;
//       this.storedSwitchState = safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
//     }, 3000);
//   }
//
//
//   componentWillUnmount() { // cleanup
//     this.unsubscribe.forEach((unsubscribe) => { unsubscribe();});
//     if (this.storeSwitchState) {
//       clearTimeout(this.storeSwitchStateTimeout);
//       this.storedSwitchState = safeStoreUpdate(this.props.sphereId, this.props.stoneId, this.storedSwitchState);
//     }
//   }
//
//
//   render() {
//     let state = core.store.getState();
//     let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
//
//     let fontSize = 110;
//     let rightOffset = -40;
//     let leftOffset = null;
//     let label = this.state.percentage + ' %';
//     let color1 = colors.white.hex;
//     let color2 = colors.green.rgba(0.75);
//     let overlayColor = colors.white.hex;
//     let borderColor = colors.green.hex;
//     if (StoneAvailabilityTracker.isDisabled(this.props.stoneId)) {
//       label = 'N/A';
//       overlayColor = colors.lightGray.hex;
//       rightOffset = 0;
//       borderColor = overlayColor;
//     }
//     else if (this.state.percentage === 0) {
//       borderColor = colors.white.hex;
//       color1 = colors.white.hex;
//       color2 = colors.white.hex;
//       label = "OFF"
//       rightOffset = 0;
//     }
//     else if (stone.abilities.dimming.enabledTarget === false && this.state.percentage === 100) {
//       color1 = colors.green.rgba(0.75);
//       color2 = colors.green.rgba(0.75);
//       label = "ON";
//       rightOffset = null;
//       leftOffset = 0;
//     }
//
//
//     return (
//       <LinearGradient
//         start={{x: 0, y: 0}} end={{x: 1, y: 0}}
//         colors={[color1, color2]}
//         style={{height:this.props.height, width: screenWidth, alignItems:'center', justifyContent:'center'}}
//       >
//         <Text style={{position:'absolute', right: rightOffset, left: leftOffset, fontSize:fontSize, color: colors.white.rgba(0.35)}}>{label}</Text>
//         <Animated.View style={{
//           position:'absolute',
//           right:0,
//           height: this.props.height,
//           width: this.state.whiteMaskWidth,
//           backgroundColor: overlayColor,
//           borderLeftColor: borderColor, borderLeftWidth:1
//         }}>
//         </Animated.View>
//         <Animated.View style={{position:'absolute', top:0, right:0,  alignItems:'center', justifyContent:'center', width: this.state.whiteMaskWidth, height: this.props.height, overflow:"hidden",}} pointerEvents="none">
//           <Text style={{position:'absolute', right: rightOffset, fontSize:fontSize, width:screenWidth, textAlign:'right', color: colors.csBlue.rgba(0.04)}} numberOfLines={1}>{label}</Text>
//         </Animated.View>
//         <Animated.View  {...this._panResponder.panHandlers}  style={{
//           position:'absolute',
//           left: this.state.offsetLeft
//         }}>
//           <DeviceEntryIcon stone={stone} stoneId={this.props.stoneId} state={state} overrideStoneState={this.state.percentage} />
//         </Animated.View>
//       </LinearGradient>
//     )
//   }
// }
