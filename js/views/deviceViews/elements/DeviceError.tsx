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

import {styles, colors, screenWidth, screenHeight} from '../../styles'
import {IconButton} from "../../components/IconButton";
import {ErrorContent} from "../../content/ErrorContent";
import {deviceStyles} from "../DeviceOverview";
import {StoneUtil} from "../../../util/StoneUtil";


export class DeviceError extends Component<any, any> {
  render() {
    const store = this.props.store;
    const state = store.getState();
    const stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>Error Detected</Text>
        <View style={{flex:1}} />
        <IconButton
          name="ios-warning"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.red.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative',}}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.errorText}>{ErrorContent.getTextDescription(2, stone.errors)}</Text>
        <View style={{flex:1}} />
        <TouchableOpacity
          onPress={() => {
            StoneUtil.clearErrors(this.props.sphereId, this.props.stoneId, stone, store);
          }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.red.hex,
            backgroundColor: colors.white.hex
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.red.hex}}>{"Reset Error"}</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
      </View>
    )
  }
}
