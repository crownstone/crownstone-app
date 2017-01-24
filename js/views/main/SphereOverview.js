import React, {Component} from 'react'
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  PanResponder,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler }                              from '../../native/SetupStateHandler'
import { Orbs }                                           from '../components/Orbs'
import { TopBar }                                         from '../components/Topbar'
import { FinalizeLocalizationIcon }                       from '../components/FinalizeLocalizationIcon'
import { AnimatedBackground }                             from '../components/animated/AnimatedBackground'
import { Icon }                                           from '../components/Icon'
import { Sphere }                                         from './Sphere'
import { getUserLevelInSphere, requireMoreFingerprints, enoughCrownstonesForIndoorLocalization, enoughCrownstonesInLocationsForIndoorLocalization} from '../../util/dataUtil'
import { LOG, LOGError, LOGDebug }                        from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'


export class SphereOverview extends Component {
  constructor() {
    super();
    this.state = { presentUsers: {}, opacity: new Animated.Value(0), left: new Animated.Value(0) };
    this.leftValue = 0;
    this.animating = false;

    this.sphereIds = [];
    this._activeSphereIndex = 0;
    this._panResponder = {};
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStonesDetected",  () => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      let spheres = this.props.store.getState().spheres;
      let sphereIds = Object.keys(spheres);
      sphereIds.forEach((sphereId) => {
        LOG("SPHERE_STATE_PRESENT", spheres[sphereId].config.present);
      });

      if (change.changeSpheres || change.updateActiveSphere) {
        this._setActiveSphere();
      }

      if (
        change.changeSphereState    ||
        change.stoneLocationUpdated ||
        change.updateStoneConfig    ||
        change.updateActiveSphere   ||
        change.updateLocationConfig ||
        change.changeFingerprint    ||
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


  _setActiveSphere() {
    // set the active sphere if needed and setup the object variables.
    let state = this.props.store.getState();
    let activeSphere = state.app.activeSphere;
    this._activeSphereIndex = 0;

    this.sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});

    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && this.sphereIds.length > 0) {
      this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: this.sphereIds[0]}});
      this._activeSphereIndex = this.sphereIds.indexOf(this.sphereIds[0]);
    }
    else if (activeSphere) {
      this._activeSphereIndex = this.sphereIds.indexOf(activeSphere);
    }

    // set the view position to match the active sphere.
    if (this.leftValue !== -screenWidth*this._activeSphereIndex) {
      this.setState({left: new Animated.Value(-screenWidth * this._activeSphereIndex)});
      this.leftValue = -screenWidth * this._activeSphereIndex;
    }
  }

  componentWillMount() {
    this._setActiveSphere();

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
      onPanResponderMove:                   (evt, gestureState) => {
        if (this.sphereIds.length > 0) {
          this.leftValue = -screenWidth * this._activeSphereIndex + gestureState.dx;
          Animated.timing(this.state.left, {
            toValue: this.leftValue,
            duration: 0
          }).start();
      }},
      onPanResponderRelease:                (evt, gestureState) => { this._snapToSphere(gestureState.dx); },
    });
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
    this.leftValue = -screenWidth*this._activeSphereIndex;
    Animated.timing(this.state.left, {toValue: this.leftValue, duration: 200}).start();

    // only change the database if we change the active sphere
    if (initialIndex != this._activeSphereIndex) {
      this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: this.sphereIds[this._activeSphereIndex]}});
    }
  }


  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // LOG("Should component update?",nextProps, nextState)
  //   return false
  // }


  render() {
    LOG("RENDERING_OVERVIEW");
    const store = this.props.store;
    const state = store.getState();

    // sphere view dimensions
    let viewWidth = screenWidth*this.sphereIds.length;
    let viewHeight = screenHeight - topBarHeight - tabBarHeight;

    let noSpheres = this.sphereIds.length == 0;
    let seeStonesInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    let viewingRemotely = true;
    let blockAddButton = false;
    let noStones = true;
    let noRooms = true;
    let isAdminInCurrentSphere = false;
    let activeSphere = state.app.activeSphere;
    let background = this.props.backgrounds.main;

    if (noSpheres === false) {
      // fallback: should not be required
      if (!activeSphere) {
        activeSphere = Object.keys(state.spheres)[0];
      }

      // todo: only do this on change
      let sphereIsPresent = state.spheres[activeSphere].config.present;

      // are there enough in total?
      let enoughCrownstonesForLocalization = enoughCrownstonesForIndoorLocalization(state,activeSphere);

      // do we need more fingerprints?
      let requiresFingerprints = requireMoreFingerprints(state, activeSphere);

      noStones = (activeSphere ? Object.keys(state.spheres[activeSphere].stones).length : 0) == 0;
      noRooms = (activeSphere ? Object.keys(state.spheres[activeSphere].locations).length : 0) == 0;
      isAdminInCurrentSphere = getUserLevelInSphere(state, activeSphere) === 'admin';

      if (sphereIsPresent || seeStonesInSetupMode || (noStones === true && noRooms === true && isAdminInCurrentSphere == true)) {
        viewingRemotely = false;
      }

      if (viewingRemotely === true) {
        background = this.props.backgrounds.mainRemoteNotConnected;
      }

      let showFinalizeIndoorNavigationButton = (
        isAdminInCurrentSphere                     && // only admins can set this up so only show it if you're an admin.
        viewingRemotely                  === false && // only show this if you're there.
        enoughCrownstonesForLocalization === true  && // Have 4 or more crownstones
        (noRooms === true || requiresFingerprints === true)     // Need more fingerprints.
      );

      let showFinalizeIndoorNavigationCallback = () => {this._finalizeIndoorLocalization(state, activeSphere, viewingRemotely, noRooms);};

      return (
        <View {...this._panResponder.panHandlers}>
          <AnimatedBackground hideTopBar={true} image={background}>
            <TopBar
              title={state.spheres[activeSphere].config.name + '\'s Sphere'}
              notBack={!showFinalizeIndoorNavigationButton}
              leftItem={showFinalizeIndoorNavigationButton ? <FinalizeLocalizationIcon topBar={true} /> : undefined}
              altenateLeftItem={true}
              leftAction={showFinalizeIndoorNavigationCallback}
              rightItem={!noStones && isAdminInCurrentSphere && !blockAddButton ? this._getAddRoomIcon() : null}
              rightAction={() => {Actions.roomAdd({sphereId: activeSphere})}}
              showHamburgerMenu={true}
              actions={{finalizeLocalization: showFinalizeIndoorNavigationCallback}}
            />
            <Animated.View style={{width: viewWidth, height: viewHeight, position:'absolute',  left: this.state.left}}>
              {this._getSpheres(seeStonesInSetupMode)}
            </Animated.View>
            <Orbs amount={this.sphereIds.length} active={this._activeSphereIndex} />
          </AnimatedBackground>
        </View>
      );
    }
    else {
      return (
        <View {...this._panResponder.panHandlers}>
          <AnimatedBackground hideTopBar={true} image={background}>
            <TopBar
              title={"Hello There!"}
              showHamburgerMenu={true}
            />
            {this._getSpheres(false)}
          </AnimatedBackground>
        </View>
      );
    }
  }

  _getAddRoomIcon() {
    // ios props
    let props = {top:-1, right:20, size: 25, paddingTop:0 };
    if (Platform.OS === 'android') {
      props = {top:7, right:20, size: 25, paddingTop:3 };
    }
    return (
      <View style={{ flex:1, alignItems:'flex-end', justifyContent:'center', paddingTop: props.paddingTop }}>
        <Icon name="md-cube" size={props.size} color="#fff" />
        <Icon name="md-add" size={18} color={colors.green.hex} style={{position:'absolute', top: props.top, right:props.right}} />
      </View>
    )
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

  _finalizeIndoorLocalization(state, activeSphere, viewingRemotely, noRooms) {
    if (viewingRemotely) {
      Alert.alert(
        "You'll have to be in the Sphere to continue.",
        "If you're in range of any of the Crownstones in the sphere, the background will turn blue and you can start teaching your house to find you!",
        [{text: 'OK'}]
      );
    }
    else if (noRooms) {
      Alert.alert(
        "Let's create some rooms!",
        "Tap the icon on the right to add a room!",
        [{text: 'OK'}]
      );
    }
    else if (enoughCrownstonesInLocationsForIndoorLocalization(state, activeSphere)) {
      this.props.eventBus.emit("showLocalizationSetupStep2", activeSphere);
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
});


