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

export class DfuOverlay extends Component<any, any> {
  unsubscribe : any = [];
  processSubscriptions = [];
  processReject : any = null;
  paused : boolean = false;
  helper : any = null;

  constructor() {
    super();
    this.state = { visible: false, step: 5, stoneId: null, progress:0, phases: 'determining...', currentPhase:0, phasesRequired: null, detail:'' };
  }

  componentDidMount() {
    eventBus.on("updateCrownstoneFirmware", (data : any = {}) => {
      this.setState({
        visible: true,
        step: 0,
        stoneId: data.stoneId,
        sphereId: data.sphereId,
        progress: 0,
        phases: '',
        currentPhase: 0,
        phasesRequired: 0,
        detail: '',
      });
    })
  }

  componentWillUnmount() {
    this.sessionCleanup();

    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  startProcess() {
    this.setState({step:1});
    let state = this.props.store.getState();
    let userConfig = state.user.config;
    let stoneConfig = state.spheres[this.state.sphereId].stones[this.state.stoneId].config;
    FirmwareHandler.getNewVersions(userConfig.firmwareVersionAvailable, userConfig.bootloaderVersionAvailable)
      .then(() => {
        return new Promise((resolve, reject) => {
          this.setState({step:2});
          setTimeout(() => { this.setState({step: 3}); resolve(); }, 2500);
        })
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          this.processReject = reject;
          this.processSubscriptions.push(
            eventBus.on(Util.events.getCrownstoneTopic(this.state.sphereId, this.state.stoneId), (data) => {
              if (data.rssi > -85) {
                this.setState({ step: 4 });
              }
              else if (this.paused === false) {
                resolve(data);
              }
            }
          ));
        })
      })
      .then((data) => {
        this.processReject = null;
        this.sessionCleanup();
        this.setState({ step: 5, phases:'setting up...', detail:'putting Crownstone in update mode...' });
        this.helper = FirmwareHandler.getFirmwareHelper(this.props.store, this.state.sphereId, this.state.stoneId);
        return this.helper.putInDFU();
      })
      .then(() => {
        this.setState({phases:'determining...', detail: 'Getting bootloader version...'});
        return this.helper.getBootloaderVersion();
      })
      .then(() => {
        let phasesRequired = this.helper.getAmountOfPhases();
        this.setState({ phasesRequired: phasesRequired, phases: this.state.currentPhase + ' / '+ phasesRequired });
        if (phasesRequired > 0) {
          return this.helper.performPhase(0)
        }
      })
      .then(() => {

      })
      .catch((err) => {
        this.processReject = null;
        this.sessionCleanup();
        LOG.error("DfuOverlay: ERROR DURING DFU: ", err);
      })
  }

  handlePhase(phase) {
    this.setState({ currentPhase: phase, phases: phase + ' / '+ this.state.phasesRequired});
    return this.helper.performPhase(phase)
      .then(() => {
        let nextPhase = phase + 1;
        if (nextPhase <= this.state.requiredPhases) {
          return this.handlePhase(nextPhase);
        }
      })
  }

  sessionCleanup() {
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

    switch (this.state.step) {
      case 0:
        return <OverlayContent
          title={'Update Crownstone'}
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
            title={'Updating Crownstone'}
            icon={'md-cloud-download'}
            header={'Downloading updates from cloud...'}
          >
            <ActivityIndicator animating={true} size="large" />
          </OverlayContent>
        );
      case 2:
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            icon={'md-cloud-done'}
            header={'Downloading complete!'}
            text={'Moving on!'}
          />
        );
      case 3:
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            icon={'c2-crownstone'}
            header={'Looking for Crownstone..'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
          </OverlayContent>
        );
      case 4:
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            icon={'c2-crownstone'}
            header={'Please move a little closer to it!'}
            buttonCallback={abort}
            buttonLabel={'Abort'}
          >
            <ActivityIndicator animating={true} size="large" />
          </OverlayContent>
        );
      case 5:
        let radius = 0.28*screenWidth;
        return (
          <OverlayContent
            title={'Updating Crownstone'}
            eyeCatcher={
              <View style={{flex:4, backgroundColor:"transparent", alignItems:'center', justifyContent:'center'}}>
                <View style={{position:'relative', width: 2*radius, height:2*radius, alignItems:'center', justifyContent:'center'}}>
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={1}
                    color={colors.gray.rgba(0.3)}
                    absolute={true}
                  />
                  <ProgressCircle
                    radius={radius}
                    borderWidth={0.25*radius}
                    progress={this.state.progress}
                    color={colors.green.hex}
                    absolute={true}
                  />
                  <Text style={{fontSize:25, paddingBottom:10}}>{100*this.state.progress + ' %'}</Text>
                  <Text style={{fontSize:13}}>{this.state.phases}</Text>
                </View>
              </View>}
            header={'Update is in progress. Please stay close to the Crownstone.'}
            text={this.props.detail}
          />
        )
    }
  }

  _getLoadingColor

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

