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
import { screenWidth, availableScreenHeight } from '../styles'
import {SetupStateHandler} from "../../native/setup/SetupStateHandler";
import {DfuStateHandler} from "../../native/firmware/DfuStateHandler";


export class Sphere extends Component<any, any> {
  render() {
    LOG.info("RENDERING SPHERE");
    const store = this.props.store;
    const state = store.getState();
    let viewingRemotely = true;
    let currentSphere = this.props.sphereId;

    let sphereIsPresent = state.spheres[currentSphere].config.present;
    if (sphereIsPresent || SetupStateHandler.areSetupStonesAvailable() || DfuStateHandler.areDfuStonesAvailable()) {
      viewingRemotely = false;
    }

    return (
      <View style={{width: screenWidth, height: availableScreenHeight}}>
        <StatusCommunication store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} opacity={0.5}  />
        <RoomLayer store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} multipleSpheres={this.props.multipleSpheres} />
        <StatusCommunication store={store} sphereId={currentSphere} viewingRemotely={viewingRemotely} eventBus={this.props.eventBus} opacity={0.5} />
      </View>
    );
  }

}
