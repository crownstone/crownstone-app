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
let Actions = require('react-native-router-flux').Actions;

import { Icon }               from '../components/Icon'
import { getUserLevelInSphere, requireMoreFingerprints, enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/dataUtil'
import { RoomLayer }          from './RoomLayer'
import { LOG, LOGDebug }      from '../../logging/Log'
import { overviewStyles }     from './SphereOverview'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'


export class Sphere extends Component {
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
    let enoughForLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, currentSphere);
    let requiresFingerprints = requireMoreFingerprints(state, currentSphere);

    let stones = state.spheres[this.props.sphereId].stones;
    let stoneIds = Object.keys(stones);
    let amountOfVisible = 0;
    stoneIds.forEach((stoneId) => {
      if (stones[stoneId].config.rssi > -100 && stones[stoneId].config.rssi.disabled === false) {
        amountOfVisible += 1;
      }
    });

    let inRangeStyle = {position: 'absolute',
      bottom: bottomDistance,
      flexDirection:'row',
      width: screenWidth,
      backgroundColor: 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 15,
      paddingBottom: 0
    };

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
    else if (amountOfVisible >= 3 && enoughForLocalization && !requiresFingerprints) {
      newContent = (
        <View style={inRangeStyle}>
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'I see ' + amountOfVisible}</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'In range: indoor localization is running.'}</Text>
        </View>
      )
    }
    else if (amountOfVisible > 0 && enoughForLocalization && !requiresFingerprints) {
      newContent = (
        <View style={inRangeStyle}>
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'I see only ' + amountOfVisible}</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'in range: indoor localization paused.'}</Text>
        </View>
      )
    }
    else if (enoughForLocalization && requiresFingerprints) {
      newContent = (
        <View style={inRangeStyle}>
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'Not all rooms have been trained: indoor localization paused.'}</Text>
        </View>
      )
    }
    else if (amountOfVisible > 0) {
      newContent = (
        <View style={inRangeStyle}>
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'I see ' + amountOfVisible}</Text>
          <Icon name="c2-crownstone" size={20} color={colors.darkGreen.hex} style={{position:'relative', top:3, width:20, height:20}} />
          <Text style={{backgroundColor:'transparent', color: colors.darkGreen.hex, fontSize:12, padding:3}}>{'in range.'}</Text>
        </View>
      )
    }
    else {
      newContent = (
        <View style={{flex:1}}>
          <Text style={[overviewStyles.bottomText, {color:colors.darkGreen.hex, bottom: bottomDistance} ]}>{'No Crownstones in range.' }</Text>
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
