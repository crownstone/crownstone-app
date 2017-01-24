import React, { Component } from 'react'
import {
  Animated,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View,
  Vibration
} from 'react-native';

const Actions = require('react-native-router-flux').Actions;

import { FingerprintManager } from '../../native/FingerprintManager'
import { Bluenet } from '../../native/Proxy'
import { canUseIndoorLocalizationInSphere } from '../../util/dataUtil'
import { Background } from '../components/Background'
import { getAiData } from '../../util/dataUtil';
import { LOG, LOGDebug } from '../../logging/Log'

import { RoomTraining_explanation } from './trainingComponents/RoomTraining_explanation'
import { RoomTraining_training } from './trainingComponents/RoomTraining_training'
import { RoomTraining_finished } from './trainingComponents/RoomTraining_finished'


export class RoomTraining extends Component {
  constructor(props) {
    super();
    this.state = {phase: 0, text:'initializing', active: false, opacity: new Animated.Value(0), iconIndex: 0, progress:0};
    this.collectedData = [];
    this.amountOfInvalidPoints = 0;
    this.invalidMeasurements = [];
    this.invalidPointThreshold = Math.round(0.75*props.sampleSize);
    this.noSignalTimeout = undefined;
  }

  componentDidMount() {
    LOGDebug("Stopping indoor localization for training purposes");
    Bluenet.stopIndoorLocalization();
  }

  componentWillUnmount() {
    this.stop();
    clearTimeout(this.noSignalTimeout);

    let state = this.props.store.getState();
    if (canUseIndoorLocalizationInSphere(state, this.props.sphereId) === true) {
      LOGDebug("(Re)Starting indoor localization after training");
      Bluenet.startIndoorLocalization();
    }
  }

  start() {
    this.collectedData = [];
    this.amountOfInvalidPoints = 0;
    this.invalidMeasurements = [];

    this.setState({started:true, text:'initializing', active:true});
    FingerprintManager.startFingerprinting((data) => {this.handleCollection(data);});
    this.noSignalTimeout = setTimeout(() => {
      // notify the user by vibration that the fingerprint collection is finished
      Vibration.vibrate(400, false);

      this.stop(true);

      Alert.alert(
        "No Crownstones in range...",
        "To be able to identify this room, I need to see at least 3 Crownstones in but I can't see any from here... Try to reposition your Crownstones so I can see more of them.",
        [{text:"OK", onPress: () => {
          Actions.pop({popNum:2});
        }}])
    },4000);
  }

  stop(forceAbort = false) {
    if (this.state.active === true || forceAbort) {
      FingerprintManager.abortFingerprinting();
      this.collectedData = [];
    }
  }

  handleCollection(data) {
    if (data.length < 3) {
      this.amountOfInvalidPoints += 1;
      this.invalidMeasurements.push(data.length);
    }

    clearTimeout(this.noSignalTimeout);
    this.collectedData.push(data);
    this.setState({progress: this.collectedData.length / this.props.sampleSize});
    this.animatePulse();

    // if we have too many invalid measurements in the fingerprint (less than 3)
    if (this.amountOfInvalidPoints > this.invalidPointThreshold) {
      let averageAmountOfMeasurements = 0;
      this.invalidMeasurements.forEach((amountOfStones) => {
        averageAmountOfMeasurements += amountOfStones;
      });
      averageAmountOfMeasurements = Math.round(averageAmountOfMeasurements/this.invalidMeasurements.length);

      // notify the user by vibration that the fingerprint collection is finished
      Vibration.vibrate(400, false);

      this.stop(true);

      Alert.alert(
        "I can not see enough Crownstones...",
        "To be able to identify this room, I need to see at least 3 Crownstones but I see only " + averageAmountOfMeasurements + "." +
        "Try to reposition your Crownstones so I can see more of them.",
        [{text:"OK", onPress: () => {
          Actions.pop({popNum:2});
        }}])
    }

    if (this.collectedData.length == this.props.sampleSize) {
      this.finalizeFingerprint()
    }
  }

  animatePulse() {
    let newIconIndex = (this.state.iconIndex+1) % 4;
    this.setState({iconIndex: newIconIndex});
    Animated.timing(this.state.opacity, {toValue: 1, duration:80}).start();
    setTimeout(() => {Animated.timing(this.state.opacity, {toValue: 0, duration:450}).start();},80);
  }

  finalizeFingerprint() {
    // notify the user by vibration that the fingerprint collection is finished
    Vibration.vibrate(400, false);

    this.setState({text:'Finished!', phase:2});
    const store = this.props.store;
    FingerprintManager.finalizeFingerprint(this.props.sphereId, this.props.locationId)
      .then((stringifiedFingerprint) => {
        LOG("gathered fingerprint:", stringifiedFingerprint);
        store.dispatch({
          type:'UPDATE_LOCATION_FINGERPRINT',
          sphereId: this.props.sphereId,
          locationId: this.props.locationId,
          data:{ fingerprintRaw: stringifiedFingerprint }
        });
      }).done();
  }



  render() {
    let state  = this.props.store.getState();
    let ai = getAiData(state, this.props.sphereId);

    let content = undefined;
    if (this.state.phase === 0) {
      content = <RoomTraining_explanation ai={ai} next={() => {this.setState({phase:1}); this.start(); }} sampleSize={this.props.sampleSize} roomSize={this.props.roomSize} />
    }
    else if (this.state.phase === 1) {
      content = (
        <RoomTraining_training
          ai={ai}
          next={() => {this.setState({phase:2});}}
          abort={() => { this.stop(true); Actions.pop({popNum:2}); }}
          {...this.state}
        />
      )
    }
    else if (this.state.phase === 2) {
      content = <RoomTraining_finished ai={ai} quit={() => { Actions.pop({popNum:2}); }} />
    }

    return (
      <Background hideInterface={true} image={this.props.backgrounds.main}>
        {content}
      </Background>
    );
  }
}