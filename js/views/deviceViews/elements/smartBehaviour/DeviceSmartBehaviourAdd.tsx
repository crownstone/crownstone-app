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

import {styles, colors, screenWidth, screenHeight, availableScreenHeight} from '../../../styles'
import {Util} from "../../../../util/Util";


/**
I want this Crownstone to turn on when I enter the room
I want this Crownstone to turn on when I enter the floor
I want this Crownstone to turn on when I enter floor X
I want this Crownstone to turn on when I enter zone X
I want this Crownstone to turn on when I enter room X

I want this Crownstone to turn on when I enter the sphere when it's dark outside

When this Crownstone turns on and its between 22 and 6, only turn it on for 50%

When there is nobody left in the room, turn the Crownstone off

Turn this Crownstone on when its dark outside (-60 minutes +- 15 random), regardless if someone is home. Turn it off at 22:00 unless I'm in the room, in which case, turn off when I leave the room.
Turn this Crownstone on when its dark outside (-60 minutes +- 15 random), regardless if someone is home. Turn it off at 23:30 or when I have been in the bedroom for 30 minutes or more.
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
export class DeviceSmartBehaviourAdd extends Component<any, any> {

  render() {
    const store = this.props.store;
    const state = store.getState();
    const sphere = state.spheres[this.props.sphereId];
    const stone = sphere.stones[this.props.stoneId];
    const element = Util.data.getElement(sphere, stone);


    return (
      <View style={{flex:1, flexDirection: 'column', alignItems:'center'}}>
        <View style={{flex: 1.5}} />
        <View style={{height:30, width: screenWidth, backgroundColor:'transparent'}} />
      </View>
    )
  }
}
