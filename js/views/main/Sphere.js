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

import { Icon }               from '../components/Icon'
import { getUserLevelInSphere } from '../../util/dataUtil'
import { RoomLayer }          from './RoomLayer'
import { LOG, LOGDebug }      from '../../logging/Log'
import { overviewStyles }     from './SphereOverview'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'


export class Sphere extends Component {
  constructor() {
    super();
    this.animating = false;
  }

  render() {
    LOG("RENDERING SPHERE");
    const store = this.props.store;
    const state = store.getState();

    let viewingRemotely = true;
    let currentSphere = this.props.sphereId;

    let sphereIsPresent = state.spheres[currentSphere].config.present;
    if (sphereIsPresent || this.props.seeStonesInSetupMode)
      viewingRemotely = false;

    // the bottom distance pops the bottom text up if the orbs are shown. Orbs are shown when there are multiple spheres.
    let bottomDistance = Object.keys(state.spheres).length > 1 ? 20 : 5;
    let noRoomsCurrentSphere = (currentSphere ? Object.keys(state.spheres[currentSphere].locations).length : 0) == 0;
    let noStones = (currentSphere ? Object.keys(state.spheres[currentSphere].stones).length : 0) == 0;
    let isAdminInCurrentSphere = getUserLevelInSphere(state, currentSphere) === 'admin';

    let newContent = undefined;

    if (this.props.seeStonesInSetupMode === true && isAdminInCurrentSphere === true) {
      newContent = (
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Text style={[overviewStyles.bottomText, {bottom: bottomDistance} ]}>{'New Crownstone Detected!'}</Text>
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
          <Text style={[overviewStyles.bottomText, {bottom: bottomDistance} ]}>{'Currently in ' + state.spheres[currentSphere].config.name + '\'s Sphere.' }</Text>
        </View>
      );
    }
    else {
      newContent = (
        <View style={{flex:1}}>
          <Text style={[overviewStyles.bottomText, {color:colors.darkGreen.hex, bottom: bottomDistance} ]}>{'Currently viewing ' + state.spheres[currentSphere].config.name + '\'s Sphere\s data.' }</Text>
        </View>
      );
    }

    return (
      <View style={{width:screenWidth, height: screenHeight - topBarHeight - tabBarHeight, position:'absolute', left: this.props.leftPosition}}>
        {newContent}
        <RoomLayer store={store} sphereId={currentSphere} seeStonesInSetupMode={this.props.seeStonesInSetupMode} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} />
      </View>
    );
  }

}
