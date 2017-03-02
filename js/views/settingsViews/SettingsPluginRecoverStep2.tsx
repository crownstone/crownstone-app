import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
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
const Actions = require('react-native-router-flux').Actions;

import { Background } from '../components/Background'
import { setupStyle } from './SetupShared'
import { styles, colors, screenWidth, screenHeight } from './../styles'
import { getUUID } from '../../util/Util'
import { getMapOfCrownstonesInAllSpheresByHandle } from '../../util/DataUtil'
import { BleUtil } from '../../native/BleUtil'
import { BluenetPromiseWrapper, Bluenet } from '../../native/Proxy'
import { LOG } from '../../logging/Log'

export class SettingsPluginRecoverStep2 extends Component<any, any> {
  lookingForCrownstone : boolean = true;
  uuid : string = getUUID();

  constructor() {
    super();
    this.state = {
      text:'Looking for Crownstones nearby...',
      fade2: new Animated.Value(0),
      fade1: new Animated.Value(1),
    };
  }

  componentDidMount() {
    // we scan high frequency when we see a setup node
    BleUtil.startHighFrequencyScanning(this.uuid, true);

    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    this.props.eventBus.emit("ignoreTriggers");
    setTimeout(() => { this.searchForStone(); }, 1000);
  }

  componentWillUnmount() {
    // Restore trigger state
    this.props.eventBus.emit("useTriggers");
    BleUtil.startHighFrequencyScanning(this.uuid);
    BleUtil.cancelAllSearches();
  }

  switchImages() {
    if (this.lookingForCrownstone === true) {
      this.setState({text:'Attempting to recover Crownstone...',});
      Animated.timing(this.state.fade1, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade2, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = false;
    }
    else {
      this.setState({text:'Looking for Crownstones nearby...'});
      Animated.timing(this.state.fade2, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade1, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = true;
    }
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
    BleUtil.cancelAllSearches();

    let state = this.props.store.getState();
    let map = getMapOfCrownstonesInAllSpheresByHandle(state);

    let nearestSetup = undefined;
    let nearestNormal = undefined;
    let promises = [];

    promises.push(BleUtil.getNearestCrownstone(4000).then((result) => { nearestNormal = result; }));
    promises.push(BleUtil.getNearestSetupCrownstone(4000).then((result) => { nearestSetup = result; }));

    Promise.all(promises)
      .then(() => {
        // we detect one in setup mode and another one that is ours.
        if (map[nearestNormal.handle]) {
          let description = this._getDescription(map[nearestNormal.handle]);
          if (nearestNormal.rssi > -60) {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode which is already in your Sphere (" + description + "). Do you want to try to recover your own Crownstone?",
              [{text:'Cancel', style: 'cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => {
                this._removeOwnedCrownstone(nearestNormal.handle);
              }}]
            );
          }
          else {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode which is already in your Sphere and a bit farther away (" + description + "). If you want to try to recover this one, move closer to it.",
              [{text:'OK', onPress: () => { Actions.pop(); }}]
            );
          }
        }
        else {
          // both setup AND normal in range.
          if (nearestNormal.rssi > -60) {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode that is not in your Spheres. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', style: 'cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}]
            );
          }
          else {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, and one in normal mode (that is not in your Spheres) a bit further away. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', style: 'cancel', onPress: () => { Actions.pop(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}]
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
                "We detect a Crownstone that is already in your Sphere (" + description + "). Do you want to try to recover your own Crownstone?",
                [{text:'Cancel', style: 'cancel', onPress: () => { Actions.pop(); Actions.pop(); }},{text:'Recover', onPress: () => {
                  this._removeOwnedCrownstone(nearestNormal.handle);
                }}]
              );
            }
            else {
              Alert.alert("No unknown Crownstones found.",
                "We detect a Crownstone that is already in your Sphere (" + description + ") and not very close. If you want to try to recover this one, move closer to it.",
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
            "We can not find a recoverable Crownstone in range, though there is a Crownstone in setup mode close by. Maybe the Crownstone has already been recovered or set to factory defaults? Try adding it to your Sphere!",
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
    this.switchImages();
    LOG.info('attempting to recover handle:', handle);
    BluenetPromiseWrapper.recover(handle)
      .then(() => {
        Alert.alert("Success!",
          "This Crownstone has been reset to factory defaults. After plugging it in and out once more, you can add it to a new Sphere.",
          [{text:'OK', onPress: () => {
            // pop twice to get back to the settings.
            Actions.pop();
            Actions.pop();
          }}]
        )
      })
      .catch((err) => {
        LOG.error("ERROR IN RECOVERY", err);
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
    let leftPos = 0.5 * (screenWidth - imageSize*screenHeight);
    return (
      <Background hideTabBar={true} image={this.props.backgrounds.main}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.menuBackground.hex}]}>Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.menuBackground.hex}]}>{this.state.text}</Text>
          <View style={{flex:1}} />
          <View style={{width: screenWidth, height:imageSize*screenHeight}}>
            <Animated.View style={{opacity:this.state.fade1, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugDark.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
            <Animated.View style={{opacity:this.state.fade2, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugDarkPairing.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
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

