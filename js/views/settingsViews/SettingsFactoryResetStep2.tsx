
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsFactoryResetStep2", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  Text,
  View
} from 'react-native';


import { setupStyle }            from './SetupShared'
import {colors, screenWidth, screenHeight, } from './../styles'
import { BleUtil }               from '../../util/BleUtil'
import { BluenetPromiseWrapper } from '../../native/libInterface/BluenetPromise'
import {LOG, LOGe} from '../../logging/Log'
import { BlePromiseManager }     from "../../logic/BlePromiseManager";
import {MapProvider} from "../../backgroundProcesses/MapProvider";

import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopBarUtil } from "../../util/TopBarUtil";
import { BackgroundNoNotification } from "../components/BackgroundNoNotification";

export class SettingsFactoryResetStep2 extends Component<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("Resettings")});
  }


  lookingForCrownstone : boolean = true;

  constructor(props) {
    super(props);
    this.state = {
      text:lang("Looking_for_Crownstones_n"),
      fade2: new Animated.Value(0),
      fade1: new Animated.Value(1),
    };
  }

  componentDidMount() {
    // this will ignore things like tap to toggle and location based triggers so they do not interrupt.
    core.eventBus.emit("ignoreTriggers");

    // this is done with an event to avoid double starting due to additional construction by the navigation lib.
    core.eventBus.on("StartFactoryResetProcess", () => {
      // we scan high frequency when we see a setup node
      this.searchForStone()
    });
  }

  componentWillUnmount() {
    // Restore trigger state
    core.eventBus.emit("useTriggers");
    BleUtil.cancelAllSearches();
  }

  switchImages() {
    if (this.lookingForCrownstone === true) {
      this.setState({text:lang("Attempting_to_reset_Crown"),});
      Animated.timing(this.state.fade1, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade2, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = false;
    }
    else {
      this.setState({text:lang("Looking_for_Crownstones_ne")});
      Animated.timing(this.state.fade2, {toValue: 0, duration: 200}).start();
      setTimeout(() => {
        Animated.timing(this.state.fade1, {toValue: 1, duration: 200}).start();
      }, 150);
      this.lookingForCrownstone = true;
    }
  }

  _getDescription(stoneInfo) {
    let description = stoneInfo.name;
    if (stoneInfo.locationName) {
      description = lang("_in_", stoneInfo, stoneInfo.locationName);
    }
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
            Alert.alert(
              lang("_Crownstone_in_Setup_mode_header"),
              lang("_Crownstone_in_Setup_mode_body",description),
              [{text:lang("_Crownstone_in_Setup_mode_left"), style: 'cancel', onPress: () => { NavigationUtil.back(); }},{
              text:lang("_Crownstone_in_Setup_mode_right"), onPress: () => {
                this._removeOwnedCrownstone(nearestNormal.handle);
              }}],
              { cancelable: false }
            );
          }
          else {
            let defaultAction = () => { NavigationUtil.back(); };
            Alert.alert(
              lang("_Crownstone_in_Setup_mode__header"),
              lang("_Crownstone_in_Setup_mode__body",description),
              [{text:lang("_Crownstone_in_Setup_mode__left"), onPress: defaultAction }],
              { cancelable: false }
            );
          }
        }
        else {
          // both setup AND normal in range.
          if (nearestNormal.rssi > -60) {
            Alert.alert(
              lang("_Crownstone_in_Setup_mode_n_header"),
              lang("_Crownstone_in_Setup_mode_n_body"),
              [{text:lang("_Crownstone_in_Setup_mode_n_left"), style: 'cancel', onPress: () => { NavigationUtil.back(); }},{
              text:lang("_Crownstone_in_Setup_mode__right"), onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
          else {
            Alert.alert(
              lang("_Crownstone_in_Setup_mode_ne_header"),
              lang("_Crownstone_in_Setup_mode_ne_body"),
              [{text:lang("_Crownstone_in_Setup_mode_ne_left"), style: 'cancel', onPress: () => { NavigationUtil.back(); }},{
              text:lang("_Crownstone_in_Setup_mode_n_right"), onPress: () => { this.recoverStone(nearestNormal.handle); }}],
              { cancelable: false }
            );
          }
        }
      })
      .catch((err) => {
        let defaultAction = () => { NavigationUtil.back(); };
        // either setup or normal or none in range
        if (nearestSetup === undefined && nearestNormal !== undefined) {
          // we detect only our own crownstones.
          if (map[nearestNormal.handle]) {
            let description = this._getDescription(map[nearestNormal.handle]);
            if (nearestNormal.rssi > -60) {
              Alert.alert(
lang("_No_unknown_Crownstone_ne_header"),
lang("_No_unknown_Crownstone_ne_body",description),
[{text:lang("_No_unknown_Crownstone_ne_left"), style: 'cancel', onPress: () => { NavigationUtil.dismissModal(); }},{
text:lang("_No_unknown_Crownstone_ne_right"), onPress: () => {
                  this._removeOwnedCrownstone(nearestNormal.handle);
                }}],
                { cancelable: false }
              );
            }
            else {
              Alert.alert(
lang("_No_unknown_Crownstones_f_header"),
lang("_No_unknown_Crownstones_f_body",description),
[{text:lang("_No_unknown_Crownstones_f_left"), onPress: defaultAction }],
                { cancelable: false }
              );
            }
          }
          else {
            if (nearestNormal.rssi > -70) {
              this.recoverStone(nearestNormal.handle);
            }
            else {
              Alert.alert(
lang("_No_Crownstones_near___We_header"),
lang("_No_Crownstones_near___We_body"),
[{text:lang("_No_Crownstones_near___We_left"), onPress: defaultAction }],
                { cancelable: false }
              );
            }
          }
        }
        else if (nearestSetup !== undefined && nearestNormal === undefined) {
          Alert.alert(
lang("_Recovery_might_not_be_ne_header"),
lang("_Recovery_might_not_be_ne_body"),
[{text:lang("_Recovery_might_not_be_ne_left"), onPress: defaultAction }],
            { cancelable: false }
          )
        }
        else {
          Alert.alert(
lang("_No_nearby_Crownstones____header"),
lang("_No_nearby_Crownstones____body"),
[{text:lang("_No_nearby_Crownstones____left"), onPress: defaultAction }],
            { cancelable: false }
          )
        }
      })
  }

  recoverStone(handle) {
    this.switchImages();
    LOG.info('attempting to factory reset handle:', handle);
    let recoveryPromise = () => {
      return BluenetPromiseWrapper.recover(handle);
    };

    BlePromiseManager.registerPriority(recoveryPromise, {from: 'Recovering stone'})
      .then(() => {
        let defaultAction = () => {
          // pop twice to get back to the settings.
          NavigationUtil.dismissModal();
        };
        Alert.alert(
lang("_Success___This_Crownston_header"),
lang("_Success___This_Crownston_body"),
[{text:lang("_Success___This_Crownston_left"), onPress: defaultAction}],
          { cancelable: false }
        )
      })
      .catch((err) => {
        LOGe.info("ERROR IN RECOVERY", err);
        let defaultAction = () => { NavigationUtil.back(); };
        if (err === "NOT_IN_RECOVERY_MODE") {
          Alert.alert(
lang("_Not_in_Factory_Reset_mod_header"),
lang("_Not_in_Factory_Reset_mod_body"),
[{text:lang("_Not_in_Factory_Reset_mod_left"), onPress: defaultAction}],
            { cancelable: false }
          )
        }
        else {
          Alert.alert(
lang("_Error_during_Factory_Res_header"),
lang("_Error_during_Factory_Res_body"),
[{text:lang("_Error_during_Factory_Res_left"), onPress: defaultAction}],
            { cancelable: false }
          )
        }
      })
  }

  render() {
    let imageSize = 0.45;
    let leftPos = 0.5 * (screenWidth - imageSize*screenHeight);
    return (
      <BackgroundNoNotification hasNavBar={false} image={core.background.light}>
        <View style={{flex:1, flexDirection:'column', paddingTop:30}}>
          <Text style={[setupStyle.text]}>{ lang("Hold_your_phone_next_to_t") }</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={[setupStyle.information]}>{this.state.text}</Text>
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
            <ActivityIndicator animating={true} color={colors.csBlueDark.hex} size="large"/>
          </View>
        </View>
      </BackgroundNoNotification>
    )
  }
}

