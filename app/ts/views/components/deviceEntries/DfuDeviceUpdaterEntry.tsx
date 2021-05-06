
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DfuDeviceUpdaterEntry", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  View
} from "react-native";

import { Icon } from '../Icon';
import { styles, colors, screenWidth } from "../../styles";
import {AnimatedCircle} from "../animated/AnimatedCircle";
import { core } from "../../../core";
import { DfuExecutor, DfuPhases } from "../../../native/firmware/DfuExecutor";


export class DfuDeviceUpdaterEntry extends Component<any, any> {
  baseHeight : number;

  DFU: DfuExecutor;
  constructor(props) {
    super(props);

    this.baseHeight = props.height || 80;

    this.state = {
      updateSuccessful: false,
      updateFailed: false,
      totalProgressWidth: new Animated.Value(0),
      phaseProgressWidth: new Animated.Value(0),
      successIndicatorWidth: new Animated.Value(0),
      isUpdating: false,
      currentStep: null,
      totalSteps: null,
      phase: null,
      info: null,
      attempts:0,
    };

    this.DFU = new DfuExecutor(this.props.sphereId, this.props.stoneId, (stateData : dfuStatusUpdate) => { this._updateState(stateData); })
  }

  _updateState(stateData) {
    this.setState({
      currentStep: stateData.currentStep,
      totalSteps: stateData.totalSteps,
      phase: stateData.phase,
      info: stateData.info,
    })

    let totalProgress = ((stateData.currentStep+1) + stateData.progress ) / (stateData.totalSteps+2);
    let animations = [];
    this.state.totalProgressWidth.stopAnimation()
    this.state.successIndicatorWidth.setValue(0);
    animations.push(Animated.timing(this.state.totalProgressWidth, {toValue: totalProgress * screenWidth, useNativeDriver: false, duration: 100}));
    if (stateData.progress === 0) {
      this.state.phaseProgressWidth.setValue(0);
    }
    else {
      this.state.phaseProgressWidth.stopAnimation()
      animations.push(Animated.timing(this.state.phaseProgressWidth, {toValue: stateData.progress * screenWidth, useNativeDriver: false, duration: 100}));
    }
    Animated.parallel(animations).start();
  }

  componentDidMount(): void {
    if (this.props.isUpdating) {
      this.start();
    }
  }

  componentDidUpdate(prevProps, prevState, snapShot) {
    if (!this.props.isUpdating && prevProps.isUpdating === true) {
      this.stop();
    }
    else if (this.props.isUpdating && prevProps.isUpdating === false) {
      if (this.state.isUpdating === false && this.state.updateSuccessful === false) {
        this.start();
      }
      else if (this.state.isUpdating === false && this.state.updateSuccessful === true) {
        this.props.success(this.state.attempts)
      }
    }
  }

  componentWillUnmount(): void {
    this.DFU.abort();
  }

  start() {
    this.setState({isUpdating: true, updateFailed: false, updateSuccessful: false})
    this.DFU.startDfu()
      .then(() => {
        this.setState({isUpdating: false, updateSuccessful: true, updateFailed: false})
        this.props.success(this.state.attempts);
        let animations = [];
        animations.push(Animated.timing(this.state.totalProgressWidth, {toValue: 0, useNativeDriver: false, duration: 400}));
        animations.push(Animated.timing(this.state.phaseProgressWidth, {toValue: 0, useNativeDriver: false, duration: 400}));
        animations.push(Animated.timing(this.state.successIndicatorWidth, {toValue: screenWidth, useNativeDriver: false, duration: 400}));
        Animated.parallel(animations).start();
      })
      .catch((err) => {
        let attemptCount = this.state.attempts + 1
        this.setState({isUpdating: false, updateSuccessful: false, updateFailed: true, attempts: attemptCount});
        let animations = [];
        animations.push(Animated.timing(this.state.totalProgressWidth, {toValue: 0, useNativeDriver: false, duration: 100}));
        animations.push(Animated.timing(this.state.phaseProgressWidth, {toValue: 0, useNativeDriver: false, duration: 100}));
        animations.push(Animated.timing(this.state.successIndicatorWidth, {toValue: 0, useNativeDriver: false, duration: 100}));
        Animated.parallel(animations).start();

        let cloudIssue = false;
        if (this.DFU.errorInformation === "DOWNLOAD_FAILED") {
          cloudIssue = true;
        }

        // console.log("err",err, this.DFU.errorInformation)
        this.props.failed(attemptCount, cloudIssue);
      })
  }

  stop(skipState = false) {
    if (this.state.isUpdating) {
      this.DFU.abort();
      if (skipState === false) {
        this.setState({ isUpdating: false, updateSuccessful: false, updateFailed: true })
      }
      this.props.failed(this.state.attempts)
    }
  }



  _getIcon(stone) {
    let color = this.props.iconColor || colors.green.rgba(0.8);
    return (
      <AnimatedCircle size={60} color={color}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </AnimatedCircle>
    );
  }


  _getDetailText() {
    if (this.state.isUpdating) {
      let progressLabel = null;
      switch (this.state.phase) {
        case DfuPhases.PREPARATION:                 progressLabel = lang("Preparing___");                  break;
        case DfuPhases.GET_INFORMATION_FROM_CLOUD:  progressLabel = lang("Getting_update_informatio");     break;
        case DfuPhases.SEACHING_FOR_CROWNSTONE:     progressLabel = lang("Looking_for_Crownstone___");     break;
        case DfuPhases.RESERVING_BLE_CONTROLLER:    progressLabel = lang("WAITING_TO_USE_BLE_CONTROLLER"); break;
        case DfuPhases.GETTING_VERSION_INFORMATION: progressLabel = lang("Checking_versions___");          break;
        case DfuPhases.GETTING_FIRMWARE_VERSION:    progressLabel = lang("Checking_Firmware_version");     break;
        case DfuPhases.GETTING_BOOTLOADER_VERSION:  progressLabel = lang("Checking_Bootloader_versi");     break;
        case DfuPhases.PREPARING_BOOTLOADER_STEPS:  progressLabel = lang("Checking_Bootloader_steps");     break;
        case DfuPhases.PUT_IN_DFU_MODE:             progressLabel = lang("Preparing_Crownstone_for_");     break;
        case DfuPhases.PREPARING_FIRMWARE_STEPS:    progressLabel = lang("Checking_Firmware_steps__");     break;
        case DfuPhases.BOOTLOADER:                  progressLabel = lang("Updating_Bootloader___");        break;
        case DfuPhases.FIRMWARE:                    progressLabel = lang("Updating_Firmware___");          break;
        case DfuPhases.SETUP:                       progressLabel = lang("Finalizing___");                 break;
      }

      switch (this.state.phase) {
        case DfuPhases.PREPARATION:
        case DfuPhases.GET_INFORMATION_FROM_CLOUD:
        case DfuPhases.SEACHING_FOR_CROWNSTONE:
        case DfuPhases.RESERVING_BLE_CONTROLLER:
        case DfuPhases.GETTING_VERSION_INFORMATION:
        case DfuPhases.GETTING_FIRMWARE_VERSION:
        case DfuPhases.GETTING_BOOTLOADER_VERSION:
        case DfuPhases.PUT_IN_DFU_MODE:
        case DfuPhases.PREPARING_BOOTLOADER_STEPS:
        case DfuPhases.PREPARING_FIRMWARE_STEPS:
          return <Text style={{fontSize: 12, fontWeight: '100'}}>{ progressLabel }</Text>
        case DfuPhases.BOOTLOADER:
        case DfuPhases.FIRMWARE:
        case DfuPhases.SETUP:
          return <Text style={{fontSize: 12, fontWeight: '100'}}>{ lang("Step______",this.state.currentStep || 1,this.state.totalSteps, progressLabel) }</Text>
      }
    }
  }

  _getUpdateStateText() {
    switch (this.state.phase) {
      case DfuPhases.PREPARATION:
      case DfuPhases.GET_INFORMATION_FROM_CLOUD:
      case DfuPhases.SEACHING_FOR_CROWNSTONE:
      case DfuPhases.RESERVING_BLE_CONTROLLER:
      case DfuPhases.GETTING_VERSION_INFORMATION:
      case DfuPhases.GETTING_FIRMWARE_VERSION:
      case DfuPhases.GETTING_BOOTLOADER_VERSION:
      case DfuPhases.PUT_IN_DFU_MODE:
      case DfuPhases.PREPARING_BOOTLOADER_STEPS:
      case DfuPhases.PREPARING_FIRMWARE_STEPS:
        return lang("Preparing_for_update")
      case DfuPhases.BOOTLOADER:
      case DfuPhases.FIRMWARE:
      case DfuPhases.SETUP:
        return lang("Update_in_progress___")
    }
  }

  render() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];

    let shouldStillUpdate = !this.state.isUpdating && !this.state.updateSuccessful && !this.state.updateFailed;
    return (
      <View style={[{height: this.baseHeight, width: screenWidth, overflow:'hidden', backgroundColor: colors.white.rgba(0.5)}]}>
        <Animated.View style={{position:'absolute', top:0, left:0, height: this.baseHeight,   width: this.state.phaseProgressWidth, backgroundColor: colors.iosBlue.rgba(0.20)}} />
        <Animated.View style={{position:'absolute', top:this.baseHeight-5, left:0, height: 5, width: this.state.totalProgressWidth, backgroundColor: colors.iosBlueDark.rgba(0.8)}} />
        <Animated.View style={{position:'absolute', top:0, left:0, height: this.baseHeight,   width: this.state.successIndicatorWidth, backgroundColor: colors.green.rgba(0.5)}} />
        <View style={{ height: this.baseHeight, width: screenWidth, alignItems: 'center', paddingLeft:15, paddingRight:15,}}>
          <View style={{flexDirection: 'row', height: this.baseHeight, paddingRight: 0, paddingLeft: 0, flex: 1}}>
            <View style={{paddingRight: 20, height: this.baseHeight, justifyContent: 'center'}}>
              {this._getIcon(stone) }
            </View>
            <View style={{flex: 1, height: this.baseHeight, justifyContent: 'center'}}>
              <View style={{flexDirection: 'column'}}>
                <Text style={{fontSize: 17, fontWeight: this.props.closeEnough ? 'bold' : '300'}}>{stone.config.name}</Text>
                { this.state.isUpdating ? <Text style={{fontSize: 14, fontWeight: '100'}}>{ this._getUpdateStateText() }</Text> : undefined }
                { shouldStillUpdate ? <Text style={{fontSize: 14, fontWeight: '100'}}>{ lang("Waiting_for_update___") }</Text>: undefined }
                { this._getDetailText() }
                { this.state.updateSuccessful ? <Text style={{fontSize: 14, fontWeight: 'bold'}}>{ lang("Update_finished_") }</Text> : undefined }
                { this.state.updateFailed ?     <Text style={{fontSize: 14, fontWeight: 'bold'}}>{ lang("Update_failed__Ill_retry_i") }</Text> : undefined }
              </View>
            </View>
            { this.props.isUpdating ? <ActivityIndicator animating={true} size='large' color={colors.csBlueDark.hex} /> : null}
          </View>
        </View>
      </View>
    );
  }
}
