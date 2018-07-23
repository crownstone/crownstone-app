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

import { Background }            from '../components/Background'
import { setupStyle }            from './SetupShared'
import {colors, screenWidth, screenHeight, OrangeLine} from './../styles'
import { Util }                  from '../../util/Util'
import { BleUtil }               from '../../util/BleUtil'
import { BluenetPromiseWrapper } from '../../native/libInterface/BluenetPromise'
import {LOG, LOGe} from '../../logging/Log'
import { BlePromiseManager }     from "../../logic/BlePromiseManager";
import {MapProvider} from "../../backgroundProcesses/MapProvider";
import {BackAction} from "../../util/Back";

export class SettingsPluginRecoverStep2 extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return { title: "Recovering" }
  };

  lookingForCrownstone : boolean = true;
  uuid : string = Util.getUUID();

  constructor(props) {
    super(props);
    this.state = {
      text:'Looking for Crownstones nearby...',
      fade2: new Animated.Value(0),
      fade1: new Animated.Value(1),
    };
  }

  componentDidMount() {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    this.props.eventBus.emit("ignoreTriggers");

    // this is done with an event to avoid double starting due to additional construction by the navigation lib.
    this.props.eventBus.on("StartRecoverProcess", () => {
      // we scan high frequency when we see a setup node
      BleUtil.startHighFrequencyScanning(this.uuid, true);
      this.searchForStone()
    });
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

    let map = MapProvider.stoneHandleMap;

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
              [{text:'Cancel', style: 'cancel', onPress: () => { BackAction(); }},{text:'Recover', onPress: () => {
                this._removeOwnedCrownstone(nearestNormal.handle);
              }}],
              { cancelable: false }
            );
          }
          else {
            let defaultAction = () => { BackAction(); };
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode which is already in your Sphere and a bit farther away (" + description + "). If you want to try to recover this one, move closer to it.",
              [{text:'OK', onPress: defaultAction }],
              { cancelable: false }
            );
          }
        }
        else {
          // both setup AND normal in range.
          if (nearestNormal.rssi > -60) {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, as well as one in normal mode that is not in your Spheres. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', style: 'cancel', onPress: () => { BackAction(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
          else {
            Alert.alert("Crownstone in Setup mode nearby.",
              "We detect a Crownstone in setup mode close by, and one in normal mode (that is not in your Spheres) a bit further away. Do you still want to try to recover the one in normal mode?",
              [{text:'Cancel', style: 'cancel', onPress: () => { BackAction(); }},{text:'Recover', onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
        }
      })
      .catch((err) => {
        let defaultAction = () => { BackAction(); };
        // either setup or normal or none in range
        if (nearestSetup === undefined && nearestNormal !== undefined) {
          // we detect only our own crownstones.
          if (map[nearestNormal.handle]) {
            let description = this._getDescription(map[nearestNormal.handle]);
            if (nearestNormal.rssi > -60) {
              Alert.alert("No unknown Crownstone nearby.",
                "We detect a Crownstone that is already in your Sphere (" + description + "). Do you want to try to recover your own Crownstone?",
                [{text:'Cancel', style: 'cancel', onPress: () => { BackAction(); BackAction(); }},{text:'Recover', onPress: () => {
                  this._removeOwnedCrownstone(nearestNormal.handle);
                }}],
                { cancelable: false }
              );
            }
            else {
              Alert.alert("No unknown Crownstones found.",
                "We detect a Crownstone that is already in your Sphere (" + description + ") and not very close. If you want to try to recover this one, move closer to it.",
                [{text:'OK', onPress: defaultAction }],
                { cancelable: false }
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
                [{text:'OK', onPress: defaultAction }],
                { cancelable: false }
              );
            }
          }
        }
        else if (nearestSetup !== undefined && nearestNormal === undefined) {
          Alert.alert("Recovery might not be needed.",
            "We can not find a recoverable Crownstone in range, though there is a Crownstone in setup mode close by. Maybe the Crownstone has already been recovered or set to factory defaults? Try adding it to your Sphere!",
            [{text:'OK', onPress: defaultAction }],
            { cancelable: false }
          )
        }
        else {
          Alert.alert("No nearby Crownstones.",
            "We can't find any Crownstones nearby, please follow the steps again to retry. Make sure to hold your phone close!",
            [{text:'OK', onPress: defaultAction }],
            { cancelable: false }
          )
        }
      })
  }

  recoverStone(handle) {
    this.switchImages();
    LOG.info('attempting to recover handle:', handle);
    let recoveryPromise = () => {
      return BluenetPromiseWrapper.recover(handle);
    };

    BlePromiseManager.registerPriority(recoveryPromise, {from: 'Recovering stone'})
      .then(() => {
        let defaultAction = () => {
          // pop twice to get back to the settings.
          BackAction();
          BackAction();
        };
        Alert.alert("Success!",
          "This Crownstone has been reset to factory defaults. After plugging it in and out once more, you can add it to a new Sphere.",
          [{text:'OK', onPress: defaultAction}],
          { cancelable: false }
        )
      })
      .catch((err) => {
        LOGe.info("ERROR IN RECOVERY", err);
        let defaultAction = () => { BackAction(); };
        if (err === "NOT_IN_RECOVERY_MODE") {
          Alert.alert("Not in recovery mode.",
            "You have 20 seconds after you plug the Crownstone in to recover. Please follow the steps again to retry.",
            [{text:'OK', onPress: defaultAction}],
            { cancelable: false }
          )
        }
        else {
          Alert.alert("Error during recovery.",
            "Please repeat the process to try again.",
            [{text:'OK', onPress: defaultAction}],
            { cancelable: false }
          )
        }
      })
  }

  render() {
    let imageSize = 0.45;
    let leftPos = 0.5 * (screenWidth - imageSize*screenHeight);
    return (
      <Background hasNavBar={false} image={this.props.backgrounds.detailsDark} safeView={true}>
        <OrangeLine/>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text, {color:colors.white.hex}]}>Hold your phone next to the Crownstone.</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information, {color:colors.white.hex}]}>{this.state.text}</Text>
          <View style={{flex:1}} />
          <View style={{width: screenWidth, height:imageSize*screenHeight}}>
            <Animated.View style={{opacity:this.state.fade1, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlug.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
            <Animated.View style={{opacity:this.state.fade2, position:'absolute', left:leftPos, top: 0}}>
              <Image source={require('../../images/lineDrawings/holdingPhoneNextToPlugPairing.png')} style={{width:imageSize*screenHeight, height:imageSize*screenHeight}} />
            </Animated.View>
          </View>
          <View style={{flex:1}} />
          <View style={{marginBottom: 20}}>
            <ActivityIndicator animating={true} color={colors.white.hex} size="large"/>
          </View>
        </View>
      </Background>
    )
  }
}

