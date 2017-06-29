import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
const Actions = require('react-native-router-flux').Actions;

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../styles'
import { LOG } from '../../../logging/Log'
import {deviceStyles} from "../DeviceOverview";
import {Graph} from "../../components/Graph";

export class DevicePowerCurve extends Component<any, any> {
  constructor() {
    super();
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];

    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center', paddingTop:30}}>
        <Text style={deviceStyles.header}>Dynamic Power Usage</Text>
        <View style={{flex:1}} />
        <Graph width={screenWidth} height={availableScreenHeight/2} />
        <View style={{flex:2}} />
      </View>
    )
  }
}