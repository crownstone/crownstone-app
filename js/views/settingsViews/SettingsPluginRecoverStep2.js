import React, { Component } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { TopBar } from '../components/Topbar';
import { Background } from '../components/Background'
import { setupStyle, CancelButton, NextButton } from '../setupViews/SetupShared'
import { styles, colors, width, screenHeight } from './../styles'
import { BLEutil } from '../../native/BLEutil'
import { BleActions } from '../../native/Proxy'

export class SettingsPluginRecoverStep2 extends Component {
  componentDidMount() {
    this.searchForStone();
  }

  componentWillUnmount() {
    BLEutil.cancelSearch();
  }

  searchForStone() {
    BLEutil.getNearestCrownstone()
      .then((handle) => {
        // console.log("found handle", handle)
        this.recoverStone(handle);
      })
      .catch((err) => {
        // console.log("ERROR IN SEARCH", err)
        Alert.alert("No nearby Crownstones",
          "We can't find Crownstones nearby, please hold your phone close to the Crownstone you want to recover.",
          [{text:'Cancel', onPress: () => { Actions.pop(); }},{text:'OK', onPress: () => { this.searchForStone(); }}]
        )
      })

  }

  recoverStone(handle) {
    // console.log('got handle', handle)
    BleActions.recover(handle)
      .then(() => {
        Alert.alert("Success!",
          "This Crownstone has been reset to factory defaults. You can now add it to a new Group.",
          [{text:'OK', onPress: () => { Actions.pop(); }}]
        )
      })
      .catch((err) => {
        // console.log("ERROR IN RECOVERY", err)
        Alert.alert("Could not Recover",
          "Please repeat the process to try again"
          [{text:'OK', onPress: () => { Actions.pop(); }}]
        )
      })
  }

  render() {
    let imageSize = 0.45;
    return (
      <Background hideTabBar={true} background={require('../../images/mainBackgroundLight.png')}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.menuBackground.hex}]}>Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.menuBackground.hex}]}>Trying to recover the nearest Crownstone...</Text>
          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center'}}>
            <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugDark.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
          </View>
          <View style={{flex:1}} />
          <View style={{marginBottom:20}}>
            <ActivityIndicator animating={true} size="large"/>
          </View>

        </View>
      </Background>
    )
  }
}

