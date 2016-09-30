import React, {Component} from 'react'
import {
  Animated,
  Dimensions,
  Image,
  NativeModules,
  StyleSheet,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { NativeBus, Bluenet } from '../../native/Proxy'
import { AnimatedBackground } from '../components/animated/AnimatedBackground'
import { Icon } from '../components/Icon'
import { RoomLayer } from '../components/RoomLayer'
import { LOG } from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight } from '../styles'


export class SphereOverview extends Component {
  constructor() {
    super();
    this.state = {presentUsers: {}, seeStoneInSetupMode: false, opacity: new Animated.Value(0)};
    this.setupData = {};
    this.setupModeTimeout = undefined;
    this.animating = false;
    this.scanningTimeout = false;
    this.highFrequencyScanningMode = false;
  }

  componentDidMount() {
    const {store} = this.props;
    let setRestoreScanningTimeout = () => {
      clearTimeout(this.scanningTimeout);
      this.scanningTimeout = setTimeout(() => {
        Bluenet.startScanningForCrownstonesUniqueOnly();
        this.highFrequencyScanningMode = false;
      }, 15000);
    };

    this.unsubscribeNative = NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
      // we scan high frequency when we see a setup node
      if (this.highFrequencyScanningMode === false) {
        Bluenet.startScanningForCrownstones();
        this.highFrequencyScanningMode = true;
      }
      setRestoreScanningTimeout();

      // store the data of this setup Crownstone
      this.setupData[setupAdvertisement.handle] = setupAdvertisement;
      if (this.state.seeStoneInSetupMode === false) {
        this.setState({seeStoneInSetupMode: true});
      }
      else {
        if (this.setupModeTimeout !== undefined) {
          clearTimeout(this.setupModeTimeout);
          this.setupModeTimeout = undefined;
        }
      }

      // handle case for timeout (user moves away from crownstone
      this.setupModeTimeout = setTimeout(() => {
        this.setupModeTimeout = undefined;
        delete this.setupData[setupAdvertisement.handle];
        // redraw
        this.setState({seeStoneInSetupMode: false});
      }, 5000);

    });
    this.unsubscribeStore = store.subscribe(() => {
      // only rerender if we go to a different sphere
      if (this.renderState === undefined)
        return;

      const state = store.getState();

      if (this.renderState.app.activeSphere !== state.app.activeSphere) {
        LOG("triggering rerender of sphere overview");

        // Actions.refresh should update the navbar (showing add..)
        //TODO: use custom Topbar
        Actions.refresh();

        // TODO: currently the refresh happens with the action. when new topbar, use the forceUpdate
        // this.forceUpdate();
      }
    });

    // this._trig()
  }

  _trig() {
    setTimeout(() => {
      let state = this.props.store.getState();

      // if (state.app.activeSphere) {
      if (this.state.seeStoneInSetupMode) {
        this.setState({seeStoneInSetupMode: false});
        // this.props.store.dispatch({type: "CLEAR_ACTIVE_SPHERE"});
      }
      else {
        this.setState({seeStoneInSetupMode: true});
        // this.props.store.dispatch({type: "SET_ACTIVE_SPHERE", data: {activeSphere: state.app.remoteSphere}});
      }

      this._trig();
    }, 5000)
  }

  componentWillUnmount() {
    if (this.highFrequencyScanningMode === false) {
      Bluenet.startScanningForCrownstonesUniqueOnly();
    }

    clearTimeout(this.scanningTimeout);
    this.unsubscribeStore();
    this.unsubscribeNative();
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

    let sphereIds = Object.keys(state.spheres);
    let noSpheres = sphereIds.length == 0;
    let remoteMode = true;
    let activeSphere = state.app.activeSphere;
    let remoteSphere = state.app.remoteSphere;
    if (activeSphere || this.state.seeStoneInSetupMode)
      remoteMode = false;

    let currentSphere = activeSphere || remoteSphere || null;
    let noRoomsCurrentSphere = (currentSphere ? Object.keys(state.spheres[currentSphere].locations).length : 0) == 0;
    let noStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length : 0) == 0;

    let newContent = undefined;
    let background = this.props.backgrounds.main;

    if (noSpheres) {
      newContent = (
        <View style={{alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="c1-house" size={150} color={colors.blue.hex}/>
          <Text style={overviewStyles.mainText}>No Spheres available.</Text>
          <Text style={overviewStyles.subText}>Go into the settings to create your own Sphere or wait to be added to those of others.</Text>
        </View>
      );
    }
    else if (this.state.seeStoneInSetupMode === true) {
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={overviewStyles.bottomTextNotConnected}>{'New Crownstone Detected!'}</Text>
        </View>
      );
    }
    else if (noStones && noRoomsCurrentSphere) {
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="c2-pluginFront" size={150} color={colors.blue.hex}/>
          <Text style={overviewStyles.mainText}>No Crownstones Added.</Text>
          <Text style={overviewStyles.subText}>Get close to a Crownstone and wait for it to appear! If it does not appear, try the recovery procedure in the settings.</Text>
        </View>
      );
    }
    else if (remoteMode === false) {
      newContent = (
        <View style={{flex: 1}}>
          <Text style={overviewStyles.bottomText}>{'Currently in ' + state.spheres[currentSphere].config.name + '\'s Sphere.' }</Text>
        </View>
      );
    }
    else {
      background = this.props.backgrounds.mainRemoteNotConnected;
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={overviewStyles.bottomTextNotConnected}>{'Currently viewing ' + state.spheres[currentSphere].config.name + '\'s Sphere\s data.' }</Text>
        </View>
      );
    }

    return (
      <AnimatedBackground image={background}>
        {newContent}
        <RoomLayer store={store} sphereId={currentSphere} seeStoneInSetupMode={this.state.seeStoneInSetupMode} remote={remoteMode} setupData={this.setupData}/>

      </AnimatedBackground>
    );
  }

}

const overviewStyles = StyleSheet.create({
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
    bottom: 10,
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
    bottom: 10,
    width: screenWidth,
    backgroundColor: 'transparent',
    textAlign: 'center',
    color: colors.darkGray.hex,
    fontSize: 12,
    padding: 15,
    paddingBottom: 0
  }
});


