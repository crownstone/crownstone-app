import React, {Component} from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { SetupStateHandler }                             from '../../native/SetupStateHandler'
import { AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION } from '../../ExternalConfig'
import { Orbs }                                          from '../components/Orbs'
import { TopBar }                                        from '../components/Topbar'
import { FinalizeLocalizationIcon }                      from '../components/FinalizeLocalizationIcon'
import { AnimatedBackground }                            from '../components/animated/AnimatedBackground'
import { Icon }                                          from '../components/Icon'
import { Sphere }                                        from './Sphere'
import { getMyLevelInSphere }                            from '../../util/dataUtil'
import { LOG, LOGError, LOGDebug }                       from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'


export class SphereOverview extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}, opacity: new Animated.Value(0), left: new Animated.Value(0)};
    this.animating = false;

    this.sphereIds = [];
    this._activeSphereIndex = 0;
    this._panResponder = {};
  }

  componentWillMount() {
    // set the active sphere if needed and setup the object variables.
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;

    this.sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});
    if (activeSphere === null && this.sphereIds.length > 0) {
      this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: this.sphereIds[0]}});
      this._activeSphereIndex = this.sphereIds.indexOf(this.sphereIds[0]);
    }
    else if (activeSphere) {
      this._activeSphereIndex = this.sphereIds.indexOf(activeSphere);
    }

    // set the view position to match the active sphere.
    this.state.left = new Animated.Value(-screenWidth*this._activeSphereIndex);

    // configure the pan responder
    this._panResponder = PanResponder.create({
      onPanResponderTerminate:              (evt, gestureState) => {},
      onShouldBlockNativeResponder:         (evt, gestureState) => false,
      onStartShouldSetPanResponder:         (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture:  (evt, gestureState) => false,
      onMoveShouldSetPanResponder:          (evt, gestureState) => false,
      onMoveShouldSetPanResponderCapture:   (evt, gestureState) => false,
      onPanResponderTerminationRequest:     (evt, gestureState) => true,
      onPanResponderGrant:                  (evt, gestureState) => {},
      onPanResponderMove:                   (evt, gestureState) => { this._moveView(gestureState.dx); },
      onPanResponderRelease:                (evt, gestureState) => { this._snapToSphere(gestureState.dx); },
    });
  }


  _moveView(dx) {
    if (this.sphereIds.length > 0)
      Animated.timing(this.state.left, {toValue: -screenWidth*this._activeSphereIndex + dx, duration: 0}).start();
  }
  /**
   * this piece of code makes sure the movement is finalized neatly.
   * @param dx
   * @private
   */
  _snapToSphere(dx) {
    let initialIndex = this._activeSphereIndex;
    if (Math.abs(dx) > 0.25*screenWidth) {
      if (dx > 0) {
        if (this._activeSphereIndex != 0) {
          this._activeSphereIndex -= 1;
        }
      }
      else {
        if (this._activeSphereIndex != this.sphereIds.length-1) {
          this._activeSphereIndex += 1;
        }
      }
    }

    // move view
    Animated.timing(this.state.left, {toValue: -screenWidth*this._activeSphereIndex, duration: 200}).start();

    // only change the database if we change the active sphere
    if (initialIndex != this._activeSphereIndex) {
      this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: this.sphereIds[this._activeSphereIndex]}});
    }
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStonesDetected",  () => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.changeSphereState    ||
        change.stoneLocationUpdated ||
        change.updateActiveSphere   ||
        change.changeSpheres        ||
        change.changeStones         ||
        change.changeLocations
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribeSetupEvents.forEach((unsubscribe) => {unsubscribe();});
    this.unsubscribeStoreEvents();
  }


  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // LOG("Should component update?",nextProps, nextState)
  //   return false
  // }


  render() {
    LOG("RENDERING OVERVIEW");
    const store = this.props.store;
    const state = store.getState();
    this.renderState = state;

    let noSpheres = this.sphereIds.length == 0;
    let seeStonesInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    let viewingRemotely = true;
    let blockAddButton = false;
    let noStones = true;
    let noRooms = true;
    let isAdminInCurrentSphere = false;
    let activeSphere = state.app.activeSphere;
    let allowIndoorLocalization = false;

    if (noSpheres === false) {
      // todo: only do this on change
      let sphereIsPresent = state.spheres[activeSphere].config.present;
      allowIndoorLocalization = (activeSphere ? Object.keys(state.spheres[activeSphere].stones).length >= AMOUNT_OF_CROWNSTONES_FOR_INDOOR_LOCALIZATION : false);
      noStones = (activeSphere ? Object.keys(state.spheres[activeSphere].stones).length : 0) == 0;
      noRooms = (activeSphere ? Object.keys(state.spheres[activeSphere].locations).length : 0) == 0;
      isAdminInCurrentSphere = getMyLevelInSphere(state, activeSphere) === 'admin';

      if (sphereIsPresent || seeStonesInSetupMode || (noStones === true && noRooms === true && isAdminInCurrentSphere == true))
        viewingRemotely = false;
    }

    let background = this.props.backgrounds.main;
    if (viewingRemotely === true) {
      background = this.props.backgrounds.mainRemoteNotConnected;
    }

    let viewWidth = screenWidth*this.sphereIds.length;
    let viewHeight = screenHeight - topBarHeight - tabBarHeight;
    let showFinalizeIndoorNavigationButton = isAdminInCurrentSphere && allowIndoorLocalization;

    return (
      <View {...this._panResponder.panHandlers}>
        <AnimatedBackground hideTopBar={true} image={background}>
          <TopBar
            title={state.spheres[activeSphere].config.name + '\'s Sphere'}
            notBack={!showFinalizeIndoorNavigationButton}
            leftItem={showFinalizeIndoorNavigationButton ? <FinalizeLocalizationIcon /> : undefined}
            leftAction={() => {this._finalizeIndoorLocalization(activeSphere, viewingRemotely);}}
            right={isAdminInCurrentSphere && !blockAddButton ? '+Room' : null}
            rightAction={() => {Actions.roomAdd({sphereId: activeSphere})}}
          />
          <Animated.View style={{width: viewWidth, height: viewHeight, position:'absolute',  left: this.state.left}}>
            {this._getSpheres(seeStonesInSetupMode)}
          </Animated.View>
          <Orbs amount={this.sphereIds.length} active={this._activeSphereIndex} />
        </AnimatedBackground>
      </View>
    );
  }

  _getSpheres(seeStonesInSetupMode) {
    if (this.sphereIds.length > 0) {
      let spheres = [];
      this.sphereIds.forEach((sphereId) => {
        spheres.push(<Sphere key={sphereId} sphereId={sphereId} store={this.props.store} seeStonesInSetupMode={seeStonesInSetupMode} leftPosition={screenWidth*spheres.length} eventBus={this.props.eventBus} />)
      });
      return spheres;
    }
    else {
      return (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="c1-house" size={150} color={colors.blue.hex}/>
          <Text style={overviewStyles.mainText}>No Spheres available.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to create your own Sphere or wait to be added to those of others.</Text>
        </View>
      )
    }
  }

  _finalizeIndoorLocalization(activeSphere, viewingRemotely) {
    viewingRemotely = false;
    if (viewingRemotely) {
      Alert.alert(
        "You'll have to be in the sphere to continue.",
        "If you're in range of any of the Crownstones in the sphere, the background will turn blue and you can start teaching your house to find you!",
        [{text: 'OK'}]
      );
    }
    else {
      Actions.roomOverview({
        sphereId: activeSphere,
        locationId: null,
        title: 'First things first :)',
        hideRight: true,
        usedForIndoorLocalizationSetup: true,
        overlayText:'Place your Crownstones in rooms!',
        explanation: 'Tap a Crownstone to see the options, then tap the left icon to select a room!'
      });
    }
  }
}

export const overviewStyles = StyleSheet.create({
  mainText: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.blue.hex,
    fontSize: 25,
    padding: 15,
    paddingBottom: 0
  },
  subText: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.blue.hex,
    fontSize: 15,
    padding: 15,
    paddingBottom: 0
  },
  bottomText: {
    position: 'absolute',
    bottom: 20,
    width: screenWidth,
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.blue.hex,
    fontSize: 12,
    padding: 15,
    paddingBottom: 0
  },
  bottomTextNotConnected: {
    position: 'absolute',
    bottom: 20,
    width: screenWidth,
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.darkGray.hex,
    fontSize: 12,
    padding: 15,
    paddingBottom: 0
  }
});


