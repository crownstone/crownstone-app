
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("TapToToggleCalibration", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {LOG, LOGe} from '../../logging/Log'
import { BlePromiseManager }                          from '../../logic/BlePromiseManager'
import { addDistanceToRssi, Util }                    from '../../util/Util'
import { OverlayBox }                                 from '../components/overlays/OverlayBox'
import { styles, colors , screenHeight, screenWidth } from '../styles'
import { core } from "../../core";
import { StoneAvailabilityTracker } from "../../native/advertisements/StoneAvailabilityTracker";

export class TapToToggleCalibration extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = { visible: false, step:0, tutorial: true, canClose: false};
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("CalibrateTapToToggle", (data : any = {}) => {
      let state = core.store.getState();
      if (state.app.tapToToggleEnabled !== false) {
        core.eventBus.emit("ignoreTriggers");
        this.setState({
          visible: true,
          step: data.tutorial === false ? 1 : 0,
          tutorial: data.tutorial === undefined ? true  : data.tutorial
        });
      }
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  learnDistance(attempt = 0) {
    // show loading screen
    core.eventBus.emit("showLoading", lang("Waiting_to_start_learning"));

    // make sure we don't strangely trigger stuff while doing this.
    core.eventBus.emit("ignoreTriggers");

    let learnDistancePromise = () => {
      return new Promise((resolve, reject) => {
        core.eventBus.emit("showLoading", lang("Finding_Tap_to_Toggle_dis"));
        // timeout for the user to put his phone on the
        setTimeout(() => {
          core.eventBus.emit("showLoading", lang("Learning_Tap_to_Toggle_di"));
          // waiting for the data to be collected. We use the RSSI updates through the iBeacon messages which come in at
          // StoneStateHandler.js ~ line 35
          setTimeout(() => {
            let state = core.store.getState();
            let sphereIds = Object.keys(state.spheres);
            let minRSSI = -1000;

            // search through all present spheres  that are not disabled and have RSSI indicators
            sphereIds.forEach((sphereId) => {
              let sphere = state.spheres[sphereId];
              if (sphere.state.present === true) {
                let stoneIds = Object.keys(sphere.stones);
                stoneIds.forEach((stoneId) => {
                  minRSSI = Math.max(StoneAvailabilityTracker.getRssi(stoneId), minRSSI);
                });
              }
            });
            LOG.info("TapToToggleCalibration: measured RSSI", minRSSI);
            resolve(minRSSI);
          }, 3500);
        }, 1000);
      })
    };

    BlePromiseManager.registerPriority(learnDistancePromise, {from:'Tap-to-toggle distance estimation.'})
      .then((nearestRSSI : number) => {
        if (nearestRSSI > -70) {
          let rssiAddedDistance = Math.max(nearestRSSI - 5, addDistanceToRssi(nearestRSSI, 0.1));
          LOG.info("TapToToggleCalibration: measured RSSI", nearestRSSI, 'added distance value:', rssiAddedDistance);

          let state = core.store.getState();
          let currentDeviceSpecs = Util.data.getDeviceSpecs(state);
          let deviceId = Util.data.getDeviceIdFromState(state, currentDeviceSpecs.address);
          core.store.dispatch({
            type: 'UPDATE_DEVICE_CONFIG',
            deviceId: deviceId,
            data: { tapToToggleCalibration: rssiAddedDistance }
          });
          core.eventBus.emit("showLoading", lang("Great_"));

          setTimeout(() => {
            core.eventBus.emit("hideLoading");
          }, 500);
          this.setState({step:2});
        }
        else {
          core.eventBus.emit("hideLoading");
          if (attempt === 2) {
            Alert.alert(
              lang("_Thats_a_bit_far_away___M_header"),
              lang("_Thats_a_bit_far_away___M_body"),
              [{text:lang("_Thats_a_bit_far_away___M_left")}])
          }
          else {
            let defaultAction = () => {this.learnDistance(attempt + 1)};
            Alert.alert(
              lang("_Thats_a_bit_far_away___T_header"),
              lang("_Thats_a_bit_far_away___T_body"),
              [{text:lang("_Thats_a_bit_far_away___T_left"), onPress: defaultAction }], { onDismiss: defaultAction })
          }

        }
      })
      .catch((err) => {
        LOGe.info("TapToToggleCalibration error:", err);
        core.eventBus.emit("hideLoading");
        Alert.alert(
          lang("_Something_went_wrong__Ma_header"),
          lang("_Something_went_wrong__Ma_body"),
          [{text:lang("_Something_went_wrong__Ma_left")}])
      })
  }

  getContent() {
    if (!this.state.visible) { return; }

    let state = core.store.getState();
    let presentSphereId = Util.data.getPresentSphereId(state);

    let props : any = {};
    switch(this.state.step) {
      case 0:
        props = {
          title: lang("Using_Tap_to_Toggle"),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header:  lang("Now_that_youve_added_a_Cr"),
          explanation: lang("Tap_to_toggle_means_you_c"),
          back: false,
          nextCallback: () => {this.setState({step:1});},
          nextLabel: lang("Next")};
        break;
      case 1:
        props = {
          title: lang("Setting_it_up"),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
          header:  lang("In_order_to_use_tap_to_to"),
          explanation: lang("This_will_only_take_a_min"),
          back: true,
          backCallback: () => {this.setState({step:0});},
          nextCallback: () => {this.learnDistance()},
          nextLabel: lang("Next")};
        if (this.state.tutorial === false) {
          props.title =  lang("Calibration");
          props.header =  lang("To_start_calibrating_tap_");
          props.explanation =  lang("The_new_distance_will_be_");
          props.back = false;
          props.nextLabel =  lang("Start");
        }
        break;
      case 2:
        props = {
          title:  lang("Great_"),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header: lang("Now_that_I_can_recognise_"),
          explanation: lang("After_you_click_Next_Ill_"),
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {core.eventBus.emit("useTriggers"); this.setState({step:3})},
          nextLabel: lang("Next")};

        if (this.state.tutorial === false) {
          props.title =  lang("Done_");
          props.header =  lang("The_new_distance_has_been");
          props.explanation =  lang("Once_you_press_Done_the_n");
          props.nextCallback = () => {core.eventBus.emit("useTriggers"); this.setState({visible: false})},
          props.nextLabel =  lang("Done")}
        break;
      case 3:
        props = {
          title: lang("Lets_give_it_a_try_"),
          image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkToggle.png'),
          header:  lang("Touch_your_phone_to_the_C"),
          explanation: lang("Once_the_phone_vibrates__"),
          back: true,
          backCallback: () => {this.setState({step:1});},
          nextCallback: () => {this.setState({visible: false});},
          nextLabel: lang("Finish_")};
        break;
    }

    if (!presentSphereId) {
      props = {
        title: lang("Training_Tap_to_Toggle"),
        image: require('../../images/lineDrawings/holdingPhoneNextToPlugDarkBlank.png'),
        header:  lang("Tap_to_toggle_can_only_be"),
        explanation: lang("Try_it_again_later_when_y"),
        back: false,
        nextCallback: () => { this.setState({visible: false});},
        nextLabel: lang("OK")};
    }

    return (
      <View style={{flex:1, alignItems:'center'}}>
        <Text style={{fontSize: 20, fontWeight: 'bold', color: colors.csBlue.hex, padding:15}}>{props.title}</Text>
        <Image source={props.image} style={{width:0.45*screenWidth, height:0.45*screenWidth, margin:0.025*screenHeight}} />
        <Text style={{fontSize: 14, fontWeight: 'bold', color: colors.csBlue.hex, textAlign:'center'}}>{props.header}</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize: 12, color: colors.blue.hex, textAlign:'center', paddingLeft:10, paddingRight:10}}>{props.explanation}</Text>
        <View style={{flex:1}}/>
        { props.back ?
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity onPress={props.backCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.2),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.rgba(0.6)}}>{ lang("Back") }</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
            <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
              width: 0.3 * screenWidth,
              height: 36,
              borderRadius: 18,
              borderWidth: 2,
              borderColor: colors.blue.rgba(0.5),
            }]}>
              <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
            </TouchableOpacity>
          </View>
          :
          <TouchableOpacity onPress={props.nextCallback} style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue.rgba(0.5),
          }]}>
            <Text style={{fontSize: 14, color: colors.blue.hex}}>{props.nextLabel}</Text>
          </TouchableOpacity>
        }
      </View>
    )
  }

  abortCloseCallback() {
    // when closed without training, tell the user where to find the calibration button.
    if (this.state.tutorial === true) {
      let explanationLabel =  lang("You_can_calibrate_tap_to_");
      if (Platform.OS === 'android') {
        explanationLabel =  lang("You_can_calibrate_tap_to_t");
      }
      Alert.alert(
        lang("_Training_Tap_to_Toggle_L_header"),
        lang("_Training_Tap_to_Toggle_L_body",explanationLabel),
        [{text:lang("_Training_Tap_to_Toggle_L_left")}])
    }
    core.eventBus.emit("useTriggers");
    this.setState({visible: false});
  }

  render() {
    return (
      <OverlayBox
        visible={this.state.visible} canClose={true}
        closeCallback={() => {this.abortCloseCallback();}}
        overrideBackButton={() => { if (this.state.step === 0) { this.abortCloseCallback(); }}}
        backgroundColor={colors.csBlue.rgba(0.3)}
        width={Math.min(320, 0.9*screenWidth)}
        height={Math.min(500, 0.95*screenHeight)}
      >
        {this.getContent()}
      </OverlayBox>
    );
  }
}