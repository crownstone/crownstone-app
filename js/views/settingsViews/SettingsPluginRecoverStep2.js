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
import { getMapOfAllOwnedCrownstones } from '../../util/dataUtil'
import { BLEutil } from '../../native/BLEutil'
import { BleActions } from '../../native/Proxy'
import { LOG } from '../../logging/Log'

export class SettingsPluginRecoverStep2 extends Component {
  constructor() {
    super();
    this.state = {};
    this.state.action = "Looking for Crownstones nearby...";
  }

  componentDidMount() {
    setTimeout(() => { this.searchForStone(); }, 1000);
  }

  componentWillUnmount() {
    BLEutil.cancelAllSearches();
  }

  _getDescription(stoneInfo) {
    let description = stoneInfo.name;
    if (stoneInfo.applianceName)
      description +=  " with " + stoneInfo.applianceName;
    if (stoneInfo.locationName)
      description +=  " in " + stoneInfo.applianceName;
    return description;
  }

  _removeOwnedCrownstone(handle) {
    // todo: think about what to do here. What if the person is not an admin?
    this.recoverStone(handle);
  }


  searchForStone() {
    BLEutil.cancelAllSearches();

    let state = this.props.store.getState();
    let map = getMapOfAllOwnedCrownstones(state);

    let nearestSetup = undefined;
    let nearestNormal = undefined;
    let promises = [];

    promises.push(BLEutil.getNearestCrownstone(4000).then((result) => { nearestNormal = result; }));
    promises.push(BLEutil.getNearestSetupCrownstoneHandle(4000).then((result) => { nearestSetup = result; }));

    Promise.all(promises)
      .then(() => {
        // we detect one in setup mode and another one that is ours.
        if (map[nearestNormal.handle]) {
          let description = this._getDescription(map[nearestNormal.handle]);
          if (nearestNormal.rssi > -60) {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode which is already in your Group (" + description + "). Do you want to try to recover your own Crownstone?",
              [{text:'Cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => {
                this._removeOwnedCrownstone(nearestNormal.handle);
              }}]
            );
          }
          else {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode which is already in your Group and a bit farther away (" + description + "). If you want to try to recover this one, move closer to it.",
              [{text:'OK', onPress: () => { Actions.pop(); }}]
            );
          }
        }
        else {
          // both setup AND normal in range.
          if (nearestNormal.rssi > -60) {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode that is not in your Groups. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}]
            );
          }
          else {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, and one in normal mode (that is not in your Groups) a bit further away. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}]
            );
          }
        }
      })
      .catch((err) => {
        // either setup or normal or none in range
        if (nearestSetup === undefined && nearestNormal !== undefined) {
          // we detect only our own crownstones.
          if (map[nearestNormal.handle]) {
            let description = this._getDescription(map[nearestNormal.handle]);
            if (nearestNormal.rssi > -60) {
              Alert.alert("No unknown Crownstone nearby.",
                "We detect a Crownstone that is already in your Group (" + description + "). Do you want to try to recover your own Crownstone?",
                [{text:'Cancel', onPress: () => { Actions.pop(); Actions.pop(); }},{text:'Recover', onPress: () => {
                  this._removeOwnedCrownstone(nearestNormal.handle);
                }}]
              );
            }
            else {
              Alert.alert("No unknown Crownstones found.",
                "We detect a Crownstone that is already in your Group (" + description + ") and not very close. If you want to try to recover this one, move closer to it.",
                [{text:'OK', onPress: () => { Actions.pop(); }}]
              );
            }
          }
          else {
            if (nearestNormal.rssi > -70) {
              this.recoverStone(nearestNormal.handle);
            }
            else {
              Alert.alert("No Crownstones near.",
                "We detect a Crownstone but it's not very close by. Please move closer and try again. If you are already holding your phone very close to the Crownstone something may be wrong.",
                [{text:'OK', onPress: () => { Actions.pop(); }}]
              )
            }
          }
        }
        else if (nearestSetup !== undefined && nearestNormal === undefined) {
          Alert.alert("Recovery might not be needed.",
            "We can not find a recoverable Crownstone in range, though there is a Crownstone in setup mode close by. Maybe the Crownstone has already been recovered or set to factory defaults? Try adding it to your Group!",
            [{text:'OK', onPress: () => { Actions.pop(); }}]
          )
        }
        else {
          Alert.alert("No nearby Crownstones.",
            "We can't find any Crownstones nearby, please follow the steps again to retry. Make sure to hold your phone close!",
            [{text:'OK', onPress: () => { Actions.pop(); }}]
          )
        }
      })
  }

  recoverStone(handle) {
    this.setState({action:"Attempting to recover Crownstone..."});
    LOG('attempting to recover handle:', handle);
    BleActions.recover(handle)
      .then(() => {
        Alert.alert("Success!",
          "This Crownstone has been reset to factory defaults. After plugging it in and out once more, you can add it to a new Group.",
          [{text:'OK', onPress: () => { Actions.pop(); }}]
        )
      })
      .catch((err) => {
        LOG("ERROR IN RECOVERY", err);
        if (err === "NOT_IN_RECOVERY_MODE") {
          Alert.alert("Not in recovery mode.",
            "You have 20 seconds after you plug the Crownstone in to recover. Please follow the steps again to retry.",
            [{text:'OK', onPress: () => { Actions.pop(); }}]
          )
        }
        else {
          Alert.alert("Error during recovery.",
            "Please repeat the process to try again.",
            [{text:'OK', onPress: () => { Actions.pop(); }}]
          )
        }
      })
  }

  render() {
    let imageSize = 0.45;
    return (
      <Background hideTabBar={true} image={this.props.backgrounds.main}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.menuBackground.hex}]}>Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.menuBackground.hex}]}>{this.state.action}</Text>
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

