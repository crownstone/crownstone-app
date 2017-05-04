import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OverlayContent }  from '../components/overlays/OverlayContent'
import { OverlayBox }      from '../components/overlays/OverlayBox'
import { eventBus }        from '../../util/EventBus'
import { FirmwareHandler } from "../../native/firmware/FirmwareHandler";
import { LOG }             from "../../logging/Log";
import { Util }            from "../../util/Util";
import { ProgressCircle }  from "../components/ProgressCircle";
import { styles, colors , screenHeight, screenWidth } from '../styles'
import {Icon} from "../components/Icon";
import {NativeBus} from "../../native/libInterface/NativeBus";
import {BleUtil} from "../../util/BleUtil";

export class DfuOverlay extends Component<any, any> {
  unsubscribe : any = [];
  processSubscriptions = [];
  processReject : any = null;
  paused : boolean = false;
  helper : any = null;
  showTimeout : any = null;
  fallbackTimeout : any = null;
  uuid : String = null;

  constructor() {
    super();
    this.uuid = Util.getUUID();
    this.state = {
      visible: false,
      step: 0,
      stoneId: null,
      sphereId: null,
      progress: 0,
      phaseDescription: 'determining...',
      currentPhase: 0,
      phasesRequired: null,
      detail: ''
    };
  }

  componentDidMount() {
    // data = { stoneId : string , sphereId: string };
    eventBus.on("updateCrownstoneFirmware", (data : any = {}) => {
      this.setState({
        visible: true,
        step: 0,
        stoneId: data.stoneId,
        sphereId: data.sphereId,
        progress: 0,
        phaseDescription: '',
        currentPhase: 0,
        phasesRequired: 0,
        detail: '',
      });
    });
    eventBus.on("updateDfuProgress", (progress : number) => {
      this.setState({progress:progress});
    });
    eventBus.on("updateDfuStep", (step : number) => {
      this.setState({step:step});
    });
  }

  componentWillUnmount() {
    this.sessionCleanup();

    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  startProcess() {
    this.setState({step:1});
    let state = this.props.store.getState();
    let userConfig = state.user;
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;
    FirmwareHandler.getNewVersions(
      userConfig.firmwareVersionsAvailable[stoneConfig.hardwareVersion],
      userConfig.bootloaderVersionsAvailable[stoneConfig.hardwareVersion],
      stoneConfig.hardwareVersion
    )
      .catch((err) => {
        this.setState({step: -2});
        throw err;
      })
      .then(() => {
        return this.startDFU(userConfig);
      })
      .catch((err) => {
        BleUtil.stopHighFrequencyScanning(this.uuid);
        this.processReject = null;
        this.sessionCleanup();
        if (this.state.step !== -2) {
          if (this.helper) {
            this.helper.finish();
            // this means that DFU was successful but we failed at performing setup.
            if (this.helper.dfuSuccessful === true) {
              this.setState({step: -3});
            }
            else {
              this.setState({step: -1});
            }
          }
          else {
            this.setState({step: -1});
          }
        }
        LOG.error("DfuOverlay: ERROR DURING DFU: ", err);
      })
  }

  startDFU(userConfig) {
    return new Promise((resolve, reject) => {
      this.setState({step:2});
      setTimeout(() => { resolve(); }, 2500);
    })
    .then(() => {
      return this._searchForCrownstone(2000);
    })
    .then(() => {
      this.setState({ step: 5, phaseDescription:'setting up...', detail:'putting Crownstone in update mode...' });
      this.helper = FirmwareHandler.getFirmwareHelper(this.props.store, this.state.sphereId, this.state.stoneId);
      return this.helper.putInDFU();
    })
    .then(() => {
      this.setState({phaseDescription:'determining...',});
      return this.helper.getBootloaderVersion();
    })
    .then(() => {
      let phasesRequired = this.helper.getAmountOfPhases();
      if (phasesRequired > 0) {
        return this.handlePhase(0, phasesRequired);
      }
    })
    .then(() => {
      this.helper.finish();
      this.props.store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        stoneId: this.state.stoneId,
        sphereId: this.state.sphereId,
        data: {
          firmwareVersion: userConfig.firmwareVersionAvailable,
          bootloaderVersion: userConfig.bootloaderVersionAvailable,
        }
      });
      this.setState({ step: 7 });
    })
  }

  _searchForCrownstone(minimumTimeVisibleWhenShown = 2000) : Promise<any> {
    let timeStart = new Date().valueOf();
    let searchTimeBeforeView = 2000;
    let state = this.props.store.getState();
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;

    // we need high frequency scanning to get duplicates of the DFU crownstone.
    BleUtil.startHighFrequencyScanning(this.uuid, true);
    return new Promise((resolve, reject) => {
      this.processReject = reject;

      // this allows us to initially hide this view and to only show it when the user requires it.
      this.showTimeout = setTimeout(() => {
        if (this.state.step !== 3) {
          eventBus.emit("updateDfuStep", 3);
        }
      }, searchTimeBeforeView);

      // the timeout will show the "get closer" even if nothing is found up to that point.
      this.fallbackTimeout = setTimeout(() => {
        if (this.state.step !== 4) {
          eventBus.emit("updateDfuStep", 4);
        }
      }, 3000);
      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        data.setupMode = setupMode || false;
        data.dfuMode = dfuMode || false;

        if (data.rssi < -75) {
          eventBus.emit("updateDfuStep", 4);
        }
        else if (this.paused === false) {
          // no need to HF scan any more
          BleUtil.stopHighFrequencyScanning(this.uuid);
          let timeSeenView = new Date().valueOf() - timeStart;
          this.processReject = null;
          this.sessionCleanup();
          if (timeSeenView < minimumTimeVisibleWhenShown && (this.state.step === 3 || this.state.step === 4)) {
            setTimeout(() => { resolve(data) }, minimumTimeVisibleWhenShown - timeSeenView)
          }
          else {
            resolve(data);
          }
        }
      };

      this.processSubscriptions.push(eventBus.on(Util.events.getCrownstoneTopic(this.state.sphereId, this.state.stoneId), (data) => {
        rssiResolver(data, false, false);
      }));
      this.processSubscriptions.push(NativeBus.on(NativeBus.topics.setupAdvertisement, (setupAdvertisement) => {
        if (setupAdvertisement.handle === stoneConfig.handle) {
          rssiResolver(setupAdvertisement, true, false);
        }
      }));
      this.processSubscriptions.push(NativeBus.on(NativeBus.topics.dfuAdvertisement, (dfuAdvertisement) => {
        if (dfuAdvertisement.handle === stoneConfig.handle) {
          rssiResolver(dfuAdvertisement, false, true);
        }
      }))
    })
  }

  handlePhase(phase, phasesRequired) {
    LOG.info("DfuOverlay: Handling phase:", phase, " out of ", phasesRequired);
    return new Promise((resolve, reject) => {
      this._searchForCrownstone(0)
        .then((data) => {
          this.setState({
            step:6,
            currentPhase: phase,
            phaseDescription: (phase + 1) + ' / '+ phasesRequired,
            phasesRequired: phasesRequired,
            progress: 0,
            dfuSuccess: phase > 1 // phase 0 would be bootloader, phase 1 would be firmware
          });
          this.helper.performPhase(phase, data.setupMode)
            .then(() => {
              let nextPhase = phase + 1;
              // if there are 4 required, the last one we need to do is 3 since we start at 0. (this means nextPhase = 4 @ phase = 3)
              if (nextPhase < phasesRequired) {
                return this.handlePhase(nextPhase, phasesRequired);
              }
            })
            .then(() => {
              resolve();
            })
            .catch((err) => { reject(err) })
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  sessionCleanup() {
    clearTimeout(this.showTimeout);
    clearTimeout(this.fallbackTimeout);

    if (typeof this.processReject === 'function') {
      this.processReject("User cancelled");
      this.processReject = null;
    }
    this.processSubscriptions.forEach((callback) => {callback()});
    this.processSubscriptions = [];

    this.paused = false;
  }


  getContent() {
    let abort = () => {
      this.paused = true;
      Alert.alert(
        "Are you sure?",
        "You can always update this Crownstone later by tapping on it again.",
        [{text:'Not yet', onPress: () => { this.paused = false; }}, {text:'OK', onPress: () => {
          this.sessionCleanup();
          this.setState({visible: false});
        }}]);
    };
    let radius = 0.28*screenWidth;
    switch (this.state.step) {
      case 0:
        return <OverlayContent
          title={'Update Available'}
          icon={'c1-update-arrow'}
          iconSize={0.35*screenWidth}
          header={'There is an update available for your Crownstone!'}
          text={'This process may take a few minutes. Please stay close to the Crownstone until it is finished. Tap next to get started!'}
          buttonCallback={() => { this.startProcess();} }
          buttonLabel={'Next'}
        />;
      case 1:
        return (
          <OverlayContent
            title={'Downloading Updates'}
            icon={'md-cloud-download'}
            header={'Downloading updates from cloud...'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flexGrow:1}} />
          </OverlayContent>
        );
      case 2:
        return (
          <OverlayContent
            title={'Download Complete'}
            icon={'md-cloud-done'}
            header={'Downloading complete!'}
            text={'Moving on!'}
          />
        );
      case 3:
        return (
          <OverlayContent
            title={'Searching'}
            icon={'c2-crownstone'}
            header={'Looking for Crownstone..'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flexGrow:1}} />
          </OverlayContent>
        );
      case 4:
        return (
          <OverlayContent
            title={'Searching'}
            icon={'c2-crownstone'}
            header={'Please move a little closer to it!'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
            <View style={{flexGrow:1}} />
          </OverlayContent>
        );
      case 5:
        return (
          <OverlayContent
            title={'Preparing Crownstone'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={this._getLoadingColor(true)}
                    absolute={true}
                  />
                  <ActivityIndicator animating={true} size="large" style={{position:'relative', top:2,left:2}} />
                </View>
              </View>}
            header={'Putting the Crownstone in update mode now...'}
          />
        );
      case 6:
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={this._getLoadingColor(true)}
                    absolute={true}
                  />
                  { this.state.progress > 0 ? <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={this.state.progress}
                    color={this._getLoadingColor(false)}
                    absolute={true}
                  /> : undefined }
                  { this.state.progress > 0 ?
                    <Text style={{fontSize: 25, paddingBottom: 10}}>{Math.floor(100 * this.state.progress) + ' %'}</Text> :
                    <ActivityIndicator animating={true} size="large" style={{position:'relative', top:2,left:2}} />
                  }
                  <Text style={{fontSize:13}}>{this.state.phaseDescription}</Text>
                </View>
              </View>}
            header={'Update is in progress. Please stay close to the Crownstone.'}
          />
        );
      case 7:
        return (
          <OverlayContent
            title={'Updating Done!'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.green.hex}
                    absolute={true}
                  />
                  <Icon name="md-checkmark" size={radius} color={colors.green.hex} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'Everything is finished, enjoy the new version!'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"Thanks!"}
          />
        );
      case -1:
        return (
          <OverlayContent
            title={'Update failed...'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.csBlue.hex}
                    absolute={true}
                  />
                  <Icon name="ios-sad" size={radius} color={colors.csBlue.hex} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'We\'re sorry... Maybe try it again?'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"Fine..."}
          />
        );
      case -2:
        return (
          <OverlayContent
            title={'Update failed...'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.csBlue.hex}
                    absolute={true}
                  />
                  <Icon name="ios-cloudy-night" size={radius} color={colors.csBlue.hex} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'We could not download the requested firmware version from the Cloud. Maybe try again later?'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"Fine..."}
          />
        );
      case -3:
        return (
          <OverlayContent
            title={'Success, But...'}
            eyeCatcher={
              <View style={{flexGrow:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.csBlue.hex}
                    absolute={true}
                  />
                  <Icon name="md-information-circle" size={radius} color={colors.csBlue.hex} style={{position:'relative', left:0, top:0.05*radius}} />
                </View>
              </View>}
            header={'The update was successful but something went wrong with the setup phase afterwards. You can just setup it like a normal Crownstone to finalize the process.'}
            buttonCallback={ () => { this.setState({visible: false}); }}
            buttonLabel={"OK!"}
          />
        );
    }
  }

  _getLoadingColor(background : boolean) {
    if (background) {
      switch (this.state.currentPhase) {
        case 0:
          return colors.gray.rgba(0.3);
        case 1:
          return colors.green.hex;
        case 2:
          return colors.lightBlue2.hex;
        case 3:
          return colors.blue2.hex;
      }
    }
    else {
      switch (this.state.currentPhase) {
        case 0:
          return colors.green.hex;
        case 1:
          return colors.lightBlue2.hex;
        case 2:
          return colors.blue2.hex;
        case 3:
          return colors.csBlue.hex;
      }
    }

  }

  render() {
    return (
      <OverlayBox visible={this.state.visible} canClose={true} closeCallback={() => {
          let finish = () => {
            this.sessionCleanup();
            this.setState({visible: false});
          };
          if (this.state.step > 0) {
            Alert.alert("Are you sure?", "You can always update this Crownstone later.", [{text:'No'}, {text:'Yes', onPress: finish}]);
          }
          else {
            finish();
          }
        }
      } backgroundColor={colors.csBlue.rgba(0.3)}>
        {this.getContent()}
      </OverlayBox>
    );
  }
}

