import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;
import { SetupStateHandler }                              from '../../native/setup/SetupStateHandler'
import { TopBar }                                         from '../components/Topbar'
import { FinalizeLocalizationIcon }                       from '../components/FinalizeLocalizationIcon'
import { AnimatedBackground }                             from '../components/animated/AnimatedBackground'
import { Icon }                                           from '../components/Icon'
import { Sphere }                                         from './Sphere'
import { requireMoreFingerprints, enoughCrownstonesForIndoorLocalization, enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'
import { LOG }                        from '../../logging/Log'
import {styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight, availableScreenHeight} from '../styles'
import { DfuStateHandler } from "../../native/firmware/DfuStateHandler";
import {Util} from "../../util/Util";
import {eventBus} from "../../util/EventBus";
import {Permissions} from "../../backgroundProcesses/PermissionManager";


export class SphereOverview extends Component<any, any> {
  unsubscribeSetupEvents : any;
  unsubscribeStoreEvents : any;

  constructor() {
    super();
  }

  componentDidMount() {
    // watch for setup stones
    this.unsubscribeSetupEvents = [];
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("setupStonesDetected",  () => { this.forceUpdate(); }));
    this.unsubscribeSetupEvents.push(this.props.eventBus.on("noSetupStonesVisible", () => { this.forceUpdate(); }));

    // tell the component exactly when it should redraw
    this.unsubscribeStoreEvents = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSpheres || change.updateActiveSphere) {
        this._setActiveSphere();
      }

      if (
        change.changeMessageState   ||
        change.changeAppSettings    ||
        change.changeSphereState    ||
        change.changeSphereConfig   ||
        change.stoneLocationUpdated ||
        change.updateSphereUser     ||
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

    let sphereIds = Object.keys(state.spheres).sort((a,b) => {return state.spheres[b].config.name - state.spheres[a].config.name});

    // handle the case where we deleted a sphere that was active.
    if (state.spheres[activeSphere] === undefined) {
      activeSphere = null;
    }
    if (activeSphere === null && sphereIds.length > 0) {
      this.props.store.dispatch({type:"SET_ACTIVE_SPHERE", data: {activeSphere: sphereIds[0]}});
    }
  }

  componentWillMount() {
    this._setActiveSphere();
  }

  render() {
    LOG.info("RENDERING_OVERVIEW");

    const store = this.props.store;
    const state = store.getState();

    let amountOfSpheres = Object.keys(state.spheres).length;
    let noSpheres = amountOfSpheres === 0;
    let seeStonesInSetupMode = SetupStateHandler.areSetupStonesAvailable();
    let seeStonesInDFUMode = DfuStateHandler.areDfuStonesAvailable();
    let viewingRemotely = true;
    let blockAddButton = false;
    let noStones = true;
    let noRooms = true;
    let activeSphereId = state.app.activeSphere;
    let background = this.props.backgrounds.main;


    if (noSpheres === false) {
      // fallback: should not be required
      if (!activeSphereId) {
        activeSphereId = Object.keys(state.spheres)[0];
      }

      let activeSphere = state.spheres[activeSphereId];

      // todo: only do this on change
      let sphereIsPresent = activeSphere.config.present;

      // are there enough in total?
      let enoughCrownstonesForLocalization = enoughCrownstonesForIndoorLocalization(state,activeSphereId);

      // do we need more fingerprints?
      let requiresFingerprints = requireMoreFingerprints(state, activeSphereId);

      noStones = (activeSphereId ? Object.keys(activeSphere.stones).length    : 0) == 0;
      noRooms  = (activeSphereId ? Object.keys(activeSphere.locations).length : 0) == 0;

      if (sphereIsPresent || seeStonesInSetupMode || seeStonesInDFUMode || (noStones === true && noRooms === true)) {
        viewingRemotely = false;
      }

      if (viewingRemotely === true) {
        background = this.props.backgrounds.mainRemoteNotConnected;
      }

      let spherePermissions = Permissions.inSphere(activeSphereId);

      let showFinalizeIndoorNavigationButton = (
        state.app.indoorLocalizationEnabled        &&
        spherePermissions.doLocalizationTutorial   &&
        viewingRemotely                  === false && // only show this if you're there.
        enoughCrownstonesForLocalization === true  && // Have 4 or more crownstones
        (noRooms === true || requiresFingerprints === true)     // Need more fingerprints.
      );

      let showFinalizeIndoorNavigationCallback = () => { this._finalizeIndoorLocalization(state, activeSphereId, viewingRemotely, noRooms); };
      let showMailIcon = activeSphere.config.newMessageFound;

      return (
        <View>
          <AnimatedBackground hideTopBar={true} image={background}>
            <TopBar
              title={activeSphere.config.name}
              notBack={!showFinalizeIndoorNavigationButton}
              leftItem={showFinalizeIndoorNavigationButton ? <FinalizeLocalizationIcon topBar={true} /> : undefined}
              alternateLeftItem={true}
              leftAction={showFinalizeIndoorNavigationCallback}
              rightItem={!noStones && spherePermissions.addRoom && !blockAddButton ? this._getAddRoomIcon() : null}
              rightAction={() => {Actions.roomAdd({sphereId: activeSphereId})}}
              showHamburgerMenu={true}
              hamburgerIconAlternationItems={showMailIcon ? [this._getMailIcon()] : []}
              actions={{finalizeLocalization: showFinalizeIndoorNavigationCallback}}
            />
              <Sphere sphereId={activeSphereId} store={this.props.store} eventBus={this.props.eventBus} multipleSpheres={amountOfSpheres > 1} />
            { amountOfSpheres > 1 ? <SphereChangeButton viewingRemotely={viewingRemotely} sphereId={activeSphereId} /> : undefined }
          </AnimatedBackground>
        </View>
      );
    }
    else {
      return (
        <AnimatedBackground hideTopBar={true} image={background}>
          <TopBar
            title={"Hello There!"}
            showHamburgerMenu={true}
          />
          <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Icon name="c1-house" size={150} color={colors.blue.hex}/>
            <Text style={overviewStyles.mainText}>No Spheres available.</Text>
            <Text style={overviewStyles.subText}>Go into the settings to create your own Sphere or wait to be added to those of others.</Text>
          </View>
        </AnimatedBackground>
      );
    }
  }

  _getMailIcon() {
    return (
      <View style={{flex: 1, alignItems: 'flex-start', justifyContent: 'center'}}>
        <Icon name={'md-mail'} size={25} style={{color:colors.white.hex}} />
      </View>
    );
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

class SphereChangeButton extends Component<any, any> {
  render() {
    let outerRadius = 0.11*screenWidth;
    let size = 0.084*screenWidth;
    let color = this.props.viewingRemotely === false ? colors.menuBackground.rgba(0.75) : colors.notConnected.hex;
    return (
      <TouchableOpacity style={{
        position:'absolute',
        top: topBarHeight,
        left: 0,
        padding: 6,
        paddingRight:10,
        paddingBottom:10,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'center',
      }}
      onPress={() => { eventBus.emit('showSphereSelectionOverlay'); }}>
        <View style={{
          width: outerRadius,
          height:outerRadius,
          borderRadius:0.5*outerRadius,
          backgroundColor: colors.white.rgba(0.5),
          alignItems:'center',
          justifyContent:'center',
        }}>
          <Icon name="c1-sphere" size={size} color={ color } />
        </View>
      </TouchableOpacity>
    );
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
    backgroundColor:'transparent',
    color: colors.darkGreen.hex,
    fontSize:12,
    padding:3
  },
  swipeButtonText: {
    backgroundColor: 'transparent',
    fontSize: 40,
    paddingHorizontal: 10,
    paddingVertical: 10,
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});


