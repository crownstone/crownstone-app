import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  BackAndroid,
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
import {Scheduler} from "../../logic/Scheduler";

let STEP_TYPES = {
  UPDATE_AVAILABLE:           'UPDATE_AVAILABLE',
  DOWNLOAD_PROGRESS:          'DOWNLOAD_PROGRESS',
  DOWNLOAD_SUCCES:            'DOWNLOAD_SUCCES',
  SEARCHING:                  'SEARCHING',
  SEARCHING_MOVE_CLOSER:      'SEARCHING_MOVE_CLOSER',
  SEARCHING_MOVE_EVEN_CLOSER: 'SEARCHING_MOVE_EVEN_CLOSER',
  SEARCHING_RESET_BLE:        'SEARCHING_RESET_BLE',
  GET_BOOTLOADER_VERSION:     'GET_BOOTLOADER_VERSION',
  UPDATE_PROGRESS:            'UPDATE_PROGRESS',
  UPDATE_SUCCES:              'UPDATE_SUCCES',
  UPDATE_FAILED:              'UPDATE_FAILED',
  DOWNLOAD_FAILED:            'DOWNLOAD_FAILED',
  SETUP_FAILED:               'SETUP_FAILED',
};

let stepSearchingTypes = {};
stepSearchingTypes[STEP_TYPES.SEARCHING] = true;
stepSearchingTypes[STEP_TYPES.SEARCHING_MOVE_CLOSER] = true;
stepSearchingTypes[STEP_TYPES.SEARCHING_MOVE_EVEN_CLOSER] = true;

export class DfuOverlay extends Component<any, any> {
  unsubscribe : any = [];
  processSubscriptions = [];
  processReject : any = null;
  paused : boolean = false;
  helper : any = null;
  cancelShowTimeout : any = null;
  cancelMoveCloserTimeout : any = null;
  cancelMoveEvenCloserTimeout : any = null;
  cancelResetBleTimeout : any = null;
  uuid : String = null;
  backButtonFunction : any = null;
  killProcess : boolean = false;

  constructor() {
    super();
    this.uuid = Util.getUUID();
    this.state = {
      visible: false,
      step: STEP_TYPES.UPDATE_AVAILABLE,
      stoneId: null,
      sphereId: null,
      progress: 0,
      phaseDescription: 'determining...',
      currentPhase: 0,
      phasesRequired: null,
      detail: '',
      firmwareUpdatedInStore: false,
      alreadyInDfuMode: false
    };
  }

  componentDidMount() {
    // data = { stoneId : string , sphereId: string };
    this.unsubscribe.push(eventBus.on("updateCrownstoneFirmware", (data : any = {}) => {
      this.setState({
        visible: true,
        step: STEP_TYPES.UPDATE_AVAILABLE,
        stoneId: data.stoneId,
        sphereId: data.sphereId,
        progress: 0,
        phaseDescription: '',
        currentPhase: 0,
        phasesRequired: 0,
        detail: '',
        firmwareUpdatedInStore: false,
        alreadyInDfuMode: data.alreadyInDfuMode || false,
        firmwareToUpload: null,
        bootloaderToUpdate: null,
      });
    }));
    this.unsubscribe.push(eventBus.on("updateDfuProgress", (progress : number) => {
      this.setState({progress:progress});
    }));
    this.unsubscribe.push(eventBus.on("updateDfuStep", (step : string) => {
      this.setState({step:step});
    }));
  }

  componentWillUnmount() {
    this._searchCleanup();
    this._processCleanup();

    this.killProcess = true;

    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  initializeProcess() {
    FirmwareHandler.dfuInProgress = true;
    this.killProcess = false;
    if (Platform.OS === 'android') {
      this.backButtonFunction = () => { return true; };
      BackAndroid.addEventListener('hardwareBackPress', this.backButtonFunction);
    }
  }

  startProcess() {
    this.initializeProcess();
    let state = this.props.store.getState();
    let userConfig = state.user;
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;

    this.setState({
      step: STEP_TYPES.DOWNLOAD_PROGRESS,
      firmwareToUpload: userConfig.firmwareVersionsAvailable[stoneConfig.hardwareVersion],
      bootloaderToUpdate: userConfig.bootloaderVersionsAvailable[stoneConfig.hardwareVersion]
    });

    FirmwareHandler.getNewVersions(
      userConfig.firmwareVersionsAvailable[stoneConfig.hardwareVersion],
      userConfig.bootloaderVersionsAvailable[stoneConfig.hardwareVersion],
      stoneConfig.hardwareVersion
    )
      .catch((err) => {
        this.setState({step: STEP_TYPES.DOWNLOAD_FAILED});
        throw err;
      })
      .then(() => {
        return this.startDFU(userConfig, stoneConfig);
      })
      .catch((err) => {
        let killCurrentProcess = this.killProcess;
        this._searchCleanup();
        this._processCleanup();

        if (killCurrentProcess === true) {
          LOG.error("DfuOverlay: killProcess is true. Aborting DFU");
          return;
        }

        if (this.state.step !== STEP_TYPES.DOWNLOAD_FAILED) {
          if (this.helper) {
            // this means that DFU was successful but we failed at performing setup.
            if (this.helper.dfuSuccessful === true) {
              this.props.store.dispatch({
                type: "UPDATE_STONE_DFU_RESET",
                stoneId: this.state.stoneId,
                sphereId: this.state.sphereId,
                data: {
                  dfuResetRequired: false,
                }
              });
              this.setState({step: STEP_TYPES.SETUP_FAILED});
            }
            else {
              this.setState({step: STEP_TYPES.UPDATE_FAILED});
            }
          }
          else {
            this.setState({step: STEP_TYPES.UPDATE_FAILED});
          }
        }
        LOG.error("DfuOverlay: ERROR DURING DFU: ", err);
      })
  }

  startDFU(userConfig, stoneConfig) {
    return new Promise((resolve, reject) => {
      this.setState({step: STEP_TYPES.DOWNLOAD_SUCCES});
      Scheduler.scheduleCallback(() => { resolve(); }, 2500, 'startDFU timeout');
    })
    .then(() => {
      return this._searchForCrownstone(2000);
    })
    .then((data : any) => {
      this.setState({ step: STEP_TYPES.GET_BOOTLOADER_VERSION, phaseDescription:'setting up...', detail:'putting Crownstone in update mode...' });
      this.helper = FirmwareHandler.getFirmwareHelper(this.props.store, this.state.sphereId, this.state.stoneId);
      return this.helper.putInDFU(data);
    })
    .then(() => {
      this.setState({phaseDescription:'determining...',});
      return this.helper.getBootloaderVersion();
    })
    .then((bootloaderVersion) => {
      // add Bootloader version to store
      this.props.store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        stoneId: this.state.stoneId,
        sphereId: this.state.sphereId,
        data: {
          bootloaderVersion: bootloaderVersion,
        }
      });

      let phasesRequired = this.helper.getAmountOfPhases(stoneConfig.dfuResetRequired);
      if (this.helper.resetRequired === true) {
        this.props.store.dispatch({
          type: "UPDATE_STONE_DFU_RESET",
          stoneId: this.state.stoneId,
          sphereId: this.state.sphereId,
          data: {
            dfuResetRequired: true,
          }
        });
      }
      if (phasesRequired > 0) {
        // if the first phase expects the Crownstone to be in normal mode, switch back from DFU first.
        if (this.helper.dfuSegmentFinishedAtPhase(0) === true) {
          return this.helper.restartInAppMode()
            .then(() => {
              return this.handlePhase(0, phasesRequired);
            })
        }
        else {
          return this.handlePhase(0, phasesRequired);
        }
      }
      else if (this.state.alreadyInDfuMode === true) {
        return this.helper.restartInAppMode()
          .then(() => {
            this.helper.loadSetupPhase();
            return this.handlePhase(0, 1);
          })
      }
    })
    .then(() => {
      this._processCleanup();
      eventBus.emit("DFU_completed", stoneConfig.handle);
      this.props.store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        stoneId: this.state.stoneId,
        sphereId: this.state.sphereId,
        data: {
          firmwareVersion: userConfig.firmwareVersionAvailable,
          bootloaderVersion: userConfig.bootloaderVersionAvailable,
          dfuResetRequired: false,
        }
      });
      this.setState({ step: STEP_TYPES.UPDATE_SUCCES });
    })
  }



  handlePhase(phase, phasesRequired) {
    // the +1 in the log is to match the UI.
    LOG.info("DfuOverlay: Handling phase:", phase + 1, " out of ", phasesRequired);
    return new Promise((resolve, reject) => {
      this._searchForCrownstone(0)
        .then((data) => {
          // store the firmware version
          if (this.helper.dfuSegmentFinishedAtPhase(phase)) {
            this.props.store.dispatch({
              type: "UPDATE_STONE_CONFIG",
              stoneId: this.state.stoneId,
              sphereId: this.state.sphereId,
              data: {
                firmwareVersion: this.state.firmwareToUpload,
              }
            });
          }

          this.setState({
            step: STEP_TYPES.UPDATE_PROGRESS,
            currentPhase: phase,
            phaseDescription: (phase + 1) + ' / '+ phasesRequired,
            phasesRequired: phasesRequired,
            progress: 0,
            firmwareUpdatedInStore: this.helper.dfuSegmentFinishedAtPhase(phase)
          });

          this.helper.performPhase(phase, data)
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

  _searchForCrownstone(minimumTimeVisibleWhenShown = 2000) : Promise<any> {
    if (this.killProcess === true) {
      throw "DFU Aborted.";
    }

    let timeStart = new Date().valueOf();
    let searchTimeBeforeView = 2000;
    let state = this.props.store.getState();
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;

    // we need high frequency scanning to get duplicates of the DFU crownstone.
    LOG.info("DfuOverlay: Start HF Scanning for all Crownstones");
    BleUtil.startHighFrequencyScanning(this.uuid, true);
    return new Promise((resolve, reject) => {
      this.processReject = reject;

      // this allows us to initially hide this view and to only show it when the user requires it.
      // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
      this.cancelShowTimeout = Scheduler.scheduleCallback(() => {
        if (this.state.step !== STEP_TYPES.SEARCHING) {
          eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING);
        }
      }, searchTimeBeforeView, 'dfu this.cancelShowTimeout');

      // the timeout will show the "get closer" even if nothing is found up to that point.
      // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
      this.cancelMoveCloserTimeout = Scheduler.scheduleCallback(() => {
        if (this.state.step !== STEP_TYPES.SEARCHING_MOVE_CLOSER) {
          eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_CLOSER);
        }
      }, 3000, 'dfu this.cancelMoveCloserTimeout');

      this.cancelMoveEvenCloserTimeout = Scheduler.scheduleCallback(() => {
        if (this.state.step !== STEP_TYPES.SEARCHING_MOVE_EVEN_CLOSER) {
          eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_EVEN_CLOSER);
        }
      }, 6000, 'dfu this.cancelMoveEvenCloserTimeout');

      this.cancelResetBleTimeout = Scheduler.scheduleCallback(() => {
        if (this.state.step !== STEP_TYPES.SEARCHING_RESET_BLE) {
          eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_RESET_BLE);
        }
      }, 10000, 'dfu this.cancelResetBleTimeout');


      // this will show the user that he has to move closer to the crownstone or resolve if the user is close enough.
      let rssiResolver = (data, setupMode, dfuMode) => {
        data.setupMode = setupMode || false;
        data.dfuMode = dfuMode || false;
        LOG.debug("DfuOverlay: Found match:", data);
        if ((data.setupMode && data.rssi < -93) || (data.rssi < -80)) {
          eventBus.emit("updateDfuStep", STEP_TYPES.SEARCHING_MOVE_CLOSER);
        }
        else if (this.paused === false) {
          // no need to HF scan any more
          LOG.info("DfuOverlay: Stop HF Scanning for all Crownstones");
          BleUtil.stopHighFrequencyScanning(this.uuid);
          let timeSeenView = new Date().valueOf() - timeStart;
          this.processReject = null;
          this._searchCleanup();
          if (timeSeenView < minimumTimeVisibleWhenShown && stepSearchingTypes[this.state.step]) {
            // we use the scheduleCallback instead of setTimeout to make sure the process won't stop because the user disabled his screen.
            Scheduler.scheduleCallback(() => { resolve(data) }, minimumTimeVisibleWhenShown - timeSeenView, 'rssiResolver timeout');
          }
          else {
            resolve(data);
          }
        }
      };

      this.processSubscriptions.push(NativeBus.on(NativeBus.topics.advertisement, (advertisement) => {
        if (advertisement.handle === stoneConfig.handle) {
          rssiResolver(advertisement, false, false);
        }
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
    });
  }

  _searchCleanup() {
    if (typeof this.cancelShowTimeout === 'function')     { this.cancelShowTimeout();     this.cancelShowTimeout = null;     }
    if (typeof this.cancelMoveCloserTimeout === 'function') { this.cancelMoveCloserTimeout(); this.cancelMoveCloserTimeout = null; }
    if (typeof this.cancelMoveEvenCloserTimeout === 'function') { this.cancelMoveEvenCloserTimeout(); this.cancelMoveEvenCloserTimeout = null; }
    if (typeof this.cancelResetBleTimeout === 'function') { this.cancelResetBleTimeout(); this.cancelResetBleTimeout = null; }

    if (typeof this.processReject === 'function') {
      this.processReject("User cancelled");
      this.processReject = null;
    }
    this.processSubscriptions.forEach((callback) => {callback()});
    this.processSubscriptions = [];

    this.paused = false;
  }

  _processCleanup() {
    BleUtil.stopHighFrequencyScanning(this.uuid);
    this.processReject = null;

    FirmwareHandler.dfuInProgress = false;
    if (Platform.OS === 'android') {
      BackAndroid.removeEventListener('hardwareBackPress', this.backButtonFunction);
      this.backButtonFunction = null;
    }

    this.killProcess = false;

    if (this.helper)
      this.helper.finish();
  }


  getContent() {
    let abort = () => {
      this.paused = true;
      let defaultAction = () => { this.paused = false; };
      Alert.alert(
        "Are you sure?",
        "You can always update this Crownstone later by tapping on it again.",
        [{text:'Not yet', onPress: defaultAction }, {text:'OK', onPress: () => {
          this._searchCleanup();
          eventBus.emit("updateCrownstoneFirmwareEnded");
          this.setState({visible: false});
        }}],
        { onDismiss: defaultAction });
    };

    let closeOverlay = () => {
        eventBus.emit("updateCrownstoneFirmwareEnded");
        this.setState({visible: false});
    };
    let radius = 0.28*screenWidth;
    switch (this.state.step) {
      case STEP_TYPES.UPDATE_AVAILABLE:
        return <OverlayContent
          title={'Update Available'}
          icon={'c1-update-arrow'}
          iconSize={0.35*screenWidth}
          header={'There is an update available for your Crownstone!'}
          text={'This process may take a few minutes. Please stay close to the Crownstone until it is finished. Tap next to get started!'}
          buttonCallback={() => { this.startProcess();} }
          buttonLabel={'Next'}
        />;
      case STEP_TYPES.DOWNLOAD_PROGRESS:
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
      case STEP_TYPES.DOWNLOAD_SUCCES:
        return (
          <OverlayContent
            title={'Download Complete'}
            icon={'md-cloud-done'}
            header={'Downloading complete!'}
            text={'Moving on!'}
          />
        );
      case STEP_TYPES.SEARCHING:
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
      case STEP_TYPES.SEARCHING_MOVE_CLOSER:
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
      case STEP_TYPES.SEARCHING_MOVE_EVEN_CLOSER:
        return (
            <OverlayContent
                title={'Searching'}
                icon={'c2-crownstone'}
                header={'Please hold your phone as close to it as possible!'}
                buttonCallback={abort}
                buttonLabel={'Abort'}
            >
              <ActivityIndicator animating={true} size="large" />
              <View style={{flexGrow:1}} />
            </OverlayContent>
        );
      case STEP_TYPES.SEARCHING_RESET_BLE:
        return (
            <OverlayContent
                title={'Searching'}
                icon={'c2-crownstone'}
                header={'Please hold your phone as close to it as possible!\nIf that doesn\'t work, try turning your Bluetooth off and on.'}
                buttonCallback={abort}
                buttonLabel={'Abort'}
            >
              <ActivityIndicator animating={true} size="large" />
              <View style={{flexGrow:1}} />
            </OverlayContent>
        );
      case STEP_TYPES.GET_BOOTLOADER_VERSION:
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
      case STEP_TYPES.UPDATE_PROGRESS:
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
      case STEP_TYPES.UPDATE_SUCCES:
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
            buttonCallback={closeOverlay}
            buttonLabel={"Thanks!"}
          />
        );
      case STEP_TYPES.UPDATE_FAILED:
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
            header={'We\'re sorry... Maybe try again while keeping an eye at the update process?'}
            buttonCallback={closeOverlay}
            buttonLabel={"Fine..."}
          />
        );
      case STEP_TYPES.DOWNLOAD_FAILED:
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
            buttonCallback={closeOverlay}
            buttonLabel={"Fine..."}
          />
        );
      case STEP_TYPES.SETUP_FAILED:
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
            buttonCallback={closeOverlay}
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
      <OverlayBox
        visible={this.state.visible}
        canClose={this.state.step === STEP_TYPES.UPDATE_AVAILABLE}
        closeCallback={() => {
          Alert.alert(
            "Are you sure?",
            "You can always update this Crownstone later.",
            [
              {text:'No'},
              {text:'Yes', onPress: () => {
                this._searchCleanup();
                eventBus.emit("updateCrownstoneFirmwareEnded");
                this.setState({visible: false});
              }}
            ]
          );
        }}
        backgroundColor={colors.csBlue.rgba(0.3)}>
        {this.getContent()}
      </OverlayBox>
    );
  }
}

