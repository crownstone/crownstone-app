import React, {Component} from 'react'
import {
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

import { NativeBus } from '../../native/Proxy'
import { BLEutil } from '../../native/BLEutil'
import { getUUID } from '../../util/util'
import { Orbs } from '../components/Orbs'
import { TopBar } from '../components/Topbar'
import { AnimatedBackground } from '../components/animated/AnimatedBackground'
import { Icon } from '../components/Icon'
import { RoomLayer } from './RoomLayer'
import { LOG, LOGDebug } from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'
import { overviewStyles } from './SphereOverview'


export class Sphere extends Component {
  constructor() {
    super();
    this.setupData = {};
    this.setupModeTimeout = undefined;
    this.animating = false;
    this.scanningTimeout = false;
  }

  componentWillMount() { }

  componentDidMount() { }

  componentWillUnmount() { }


  // experiment
  // shouldComponentUpdate(nextProps, nextState) {
  //   // LOG("Should component update?",nextProps, nextState)
  //   return false
  // }

  render() {
    LOG("RENDERING SPHERE");
    const store = this.props.store;
    const state = store.getState();

    let viewingRemotely = true;
    let currentSphere = this.props.id;

    let sphereIsPresent = state.spheres[currentSphere].config.present;
    if (sphereIsPresent || this.props.seeStoneInSetupMode)
      viewingRemotely = false;

    let noRoomsCurrentSphere = (currentSphere ? Object.keys(state.spheres[currentSphere].locations).length : 0) == 0;
    let noStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length : 0) == 0;
    let isAdminInCurrentSphere = state.spheres[currentSphere].users[state.user.userId].accessLevel === 'admin';

    let newContent = undefined;

    if (this.props.seeStoneInSetupMode === true && isAdminInCurrentSphere === true) {
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={overviewStyles.bottomTextNotConnected}>{'New Crownstone Detected!'}</Text>
        </View>
      );
    }
    else if (noStones === true && noRoomsCurrentSphere == true) {
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Icon name="c2-pluginFront" size={150} color={colors.blue.hex}/>
          <Text style={overviewStyles.mainText}>No Crownstones Added.</Text>
          <Text style={overviewStyles.subText}>Get close to a Crownstone and wait for it to appear! If it does not appear, try the recovery procedure in the settings.</Text>
        </View>
      );
    }
    else if (viewingRemotely === false) {
      newContent = (
        <View style={{flex:1}}>
          <Text style={overviewStyles.bottomText}>{'Currently in ' + state.spheres[currentSphere].config.name + '\'s Sphere.' }</Text>
        </View>
      );
    }
    else {
      newContent = (
        <View style={{flex:1}}>
          <Text style={overviewStyles.bottomTextNotConnected}>{'Currently viewing ' + state.spheres[currentSphere].config.name + '\'s Sphere\s data.' }</Text>
        </View>
      );
    }

    return (
      <View style={{width:screenWidth, height: screenHeight - topBarHeight - tabBarHeight, position:'absolute', left: this.props.leftPosition}}>
        {newContent}
        <RoomLayer store={store} sphereId={currentSphere} seeStoneInSetupMode={this.props.seeStoneInSetupMode} viewingRemotely={viewingRemotely} setupData={this.props.setupData}/>
      </View>
    );
  }

}
