import * as React from 'react'; import { Component } from 'react';
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

import { RoomLayer }           from './RoomLayer'
import { StatusCommunication } from './StatusCommunication'
import { LOG }       from '../../logging/Log'
import { styles, colors, screenWidth, screenHeight, topBarHeight, tabBarHeight } from '../styles'


export class Sphere extends Component<any, any> {
  render() {
    LOG.info("RENDERING SPHERE");
    const store = this.props.store;
    const state = store.getState();
    let viewingRemotely = true;
    let currentSphere = this.props.sphereId;

    let sphereIsPresent = state.spheres[currentSphere].config.present;
    if (sphereIsPresent || this.props.seeStonesInSetupMode) {
      viewingRemotely = false;
    }

    return (
      <View style={{width:screenWidth, height: screenHeight - topBarHeight - tabBarHeight, position:'absolute', top: 0, left: this.props.leftPosition}}>
        <StatusCommunication store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} />
        <RoomLayer store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} />
      </View>
    );
  }

}
