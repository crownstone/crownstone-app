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
import {IconButton} from "../../components/IconButton";
import {eventBus} from "../../../util/EventBus";


export class DeviceUpdate extends Component<any, any> {
  render() {
    return (
      <View style={{flex:1, alignItems:'center', padding: 30}}>
        <Text style={deviceStyles.header}>Update Available!</Text>
        <View style={{flex:1}} />
        <IconButton
          name="c1-update-arrow"
          size={0.15*screenHeight}
          color={colors.darkBackground.hex}
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.white.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top: 0.0051*screenHeight}}
        />
        <View style={{flex:1}} />
        <Text style={deviceStyles.text}>{'New firmware brings new features and improved stability!' +
        '\n\nThe update phase requires you to stay close to the Crownstone and can take up to 2 minutes. Press the button below to get started!'}</Text>
        <View style={{flex:1}} />
        <TouchableOpacity
          onPress={() => {
            eventBus.emit('updateCrownstoneFirmware', {stoneId: this.props.stoneId, sphereId: this.props.sphereId, skipIntroduction: true});
          }}
          style={[styles.centered, {
            width: 0.6 * screenWidth,
            height: 50,
            borderRadius: 25,
            borderWidth: 3,
            borderColor: colors.white.hex,
            backgroundColor: colors.csBlue.rgba(0.5)
          }]}>
          <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.white.hex}}>{"Let's get started!"}</Text>
        </TouchableOpacity>
        <View style={{flex:1}} />
      </View>
    )
  }
}


let textColor = colors.white;
let deviceStyles = StyleSheet.create({
  header: {
    color: textColor.hex,
    fontSize: 25,
    fontWeight:'800'
  },
  text: {
    color: textColor.hex,
    fontSize: 16,
    textAlign:'center',
    fontWeight:'500'
  },
  subText: {
    color: textColor.rgba(0.5),
    fontSize: 13,
  },
  explanation: {
    width: screenWidth,
    color: textColor.rgba(0.5),
    fontSize: 13,
    textAlign:'center'
  }
});