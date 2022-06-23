// import {Languages} from "../../Languages"
// import * as React from 'react';
// import {Alert, Animated, Platform, Vibration} from 'react-native';
//
//
// import KeepAwake from 'react-native-keep-awake';
//
// import {FingerprintManager} from '../../native/localization/FingerprintManager'
// import {Bluenet} from '../../native/libInterface/Bluenet'
// import {canUseIndoorLocalizationInSphere} from '../../util/DataUtil'
// import {Background} from '../components/Background'
// import {LOG, LOGd, LOGe} from '../../logging/Log'
//
// import {RoomTraining_explanation} from './trainingComponents/RoomTraining_explanation'
// import {RoomTraining_training} from './trainingComponents/RoomTraining_training'
// import {RoomTraining_finished} from './trainingComponents/RoomTraining_finished'
// import {Util} from "../../util/Util";
//
// import {CLOUD} from "../../cloud/cloudAPI";
// import {core} from "../../Core";
// import {NavigationUtil} from "../../util/navigation/NavigationUtil";
// import {TopBarUtil} from "../../util/TopBarUtil";
// import {LiveComponent} from "../LiveComponent";
// import {background} from "../styles";
// import {BleUtil} from "../../util/BleUtil";
// import {Get} from "../../util/GetUtil";
//
// function lang(key,a?,b?,c?,d?,e?) {
//   return Languages.get("RoomTraining", key)(a,b,c,d,e);
// }
//
// const HF_SCANNING_ID = "ROOM_TRAINING";
//
// export class RoomTraining_old extends LiveComponent<any, any> {
//   static options(props) {
//     let location = Get.location(props.sphereId, props.locationId)
//     return TopBarUtil.getOptions({title:  lang("Teaching_",location.config.name)});
//   }
//
//   collectedData : any;
//   amountOfInvalidPoints : number;
//   invalidMeasurements : any;
//   invalidPointThreshold : number;
//   noSignalTimeout : any;
//
//   trainingFinished = false;
//
//   constructor(props) {
//     super(props);
//     this.state = {
//       phase: 0,
//       text:'initializing',
//       active: false,
//       opacity: new Animated.Value(0),
//       iconIndex: 0,
//       progress:0
//     };
//     this.collectedData = [];
//     this.amountOfInvalidPoints = 0;
//     this.invalidMeasurements = [];
//     this.invalidPointThreshold = Math.round(0.75*props.sampleSize);
//     this.noSignalTimeout = undefined;
//   }
//
//   navigationButtonPressed({buttonId}) {
//     if (buttonId === 'cancel') {
//       FingerprintManager.pauseCollectingFingerprint();
//       Alert.alert(
//         lang("_Do_you_want_to_cancel_tr_header"),
//         lang("_Do_you_want_to_cancel_tr_body"),
//         [
//           {text:lang("_Do_you_want_to_cancel_tr_left"), onPress: () => { FingerprintManager.resumeCollectingFingerprint(this.handleCollection.bind(this)); }},
//           {text:lang("_Do_you_want_to_cancel_tr_right"), onPress: () => { this.stop(true); NavigationUtil.dismissModal(); }}
//         ],
//         { cancelable : false }
//       )
//     }
//   }
//
//   componentDidMount() {
//     LOGd.info("Stopping indoor localization for training purposes");
//     Bluenet.stopIndoorLocalization();
//   }
//
//   componentWillUnmount() {
//     this.stop();
//     BleUtil.stopHighFrequencyScanning(HF_SCANNING_ID);
//     clearTimeout(this.noSignalTimeout);
//
//     let state = core.store.getState();
//     if (canUseIndoorLocalizationInSphere(this.props.sphereId) === true) {
//       LOGd.info("(Re)Starting indoor localization after training");
//       Bluenet.startIndoorLocalization();
//     }
//   }
//
//   start() {
//     this.collectedData = [];
//     this.amountOfInvalidPoints = 0;
//     this.invalidMeasurements = [];
//
//     this.setState({started:true, text:'initializing', active:true});
//     if (Platform.OS === 'android') {
//       BleUtil.startHighFrequencyScanning(HF_SCANNING_ID, 150000)
//     }
//
//     FingerprintManager.startFingerprinting((data) => {this.handleCollection(data);});
//     this.noSignalTimeout = setTimeout(() => {
//       // notify the user by vibration that the fingerprint collection is finished
//       Vibration.vibrate(400, false);
//
//       this.stop(true);
//
//       let defaultAction = () => { NavigationUtil.dismissModal() };
//       Alert.alert(
//         lang("_No_Crownstones_in_range__header"),
//         lang("_No_Crownstones_in_range__body"),
//         [{text:lang("_No_Crownstones_in_range__left"), onPress: defaultAction}],
//         { onDismiss: defaultAction }
//       )
//     },4000);
//   }
//
//   stop(forceAbort = false) {
//     if (this.state.active === true || forceAbort) {
//       FingerprintManager.abortFingerprinting();
//       this.collectedData = [];
//     }
//   }
//
//   handleCollection(data) {
//     if (data.length < 3) {
//       this.amountOfInvalidPoints += 1;
//       this.invalidMeasurements.push(data.length);
//     }
//
//     clearTimeout(this.noSignalTimeout);
//     this.collectedData.push(data);
//     this.setState({progress: this.collectedData.length / this.props.sampleSize});
//     this.animatePulse();
//
//     // if we have too many invalid measurements in the fingerprint (less than 3)
//     if (this.amountOfInvalidPoints > this.invalidPointThreshold) {
//       let averageAmountOfMeasurements = 0;
//       this.invalidMeasurements.forEach((amountOfStones) => {
//         averageAmountOfMeasurements += amountOfStones;
//       });
//       averageAmountOfMeasurements = Math.round(averageAmountOfMeasurements/this.invalidMeasurements.length);
//
//       // notify the user by vibration that the fingerprint collection is finished
//       Vibration.vibrate(400, false);
//
//       this.stop(true);
//
//       let defaultAction = () => { NavigationUtil.dismissModal(); };
//       Alert.alert(
//         lang("_I_can_not_see_enough_Cro_header"),
//         lang("_I_can_not_see_enough_Cro_body",averageAmountOfMeasurements),
// [{text:lang("_I_can_not_see_enough_Cro_left"), onPress: defaultAction}],
//         { onDismiss: defaultAction }
//       )
//     }
//
//     if (this.collectedData.length == this.props.sampleSize) {
//       this.finalizeFingerprint()
//     }
//   }
//
//   animatePulse() {
//     let newIconIndex = (this.state.iconIndex+1) % 4;
//     this.setState({iconIndex: newIconIndex});
//     Animated.timing(this.state.opacity, {toValue: 1, useNativeDriver: false, duration:80}).start();
//     setTimeout(() => {Animated.timing(this.state.opacity, {toValue: 0, useNativeDriver: false, duration:450}).start();},80);
//   }
//
//   finalizeFingerprint() {
//     BleUtil.stopHighFrequencyScanning(HF_SCANNING_ID);
//     // notify the user by vibration that the fingerprint collection is finished
//     Vibration.vibrate(400, false);
//
//     this.setState({text:'Finished!', phase:2});
//     this.trainingFinished = true;
//     TopBarUtil.replaceOptions(this.props.componentId, {title: lang("All_Done_")}, {clearEmptyButtons:true});
//     const store = core.store;
//     FingerprintManager.finalizeFingerprint(this.props.sphereId, this.props.locationId)
//       .then((stringifiedFingerprint : any) => {
//         LOG.info("gathered fingerprint:", stringifiedFingerprint);
//         let transformedFingerprint = FingerprintManager.transformFingerprint(stringifiedFingerprint);
//         store.dispatch({
//           type:'UPDATE_NEW_LOCATION_FINGERPRINT',
//           sphereId: this.props.sphereId,
//           locationId: this.props.locationId,
//           data:{ fingerprintRaw: transformedFingerprint, fingerprintCloudId: null }
//         });
//         let state = store.getState();
//         let deviceId = Util.data.getCurrentDeviceId(state);
//
//
//         return CLOUD.forDevice(deviceId).createFingerprint(this.props.locationId, JSON.parse(transformedFingerprint))
//           .then((fingerprint) => {
//             store.dispatch({
//               type:'UPDATE_LOCATION_FINGERPRINT_CLOUD_ID',
//               sphereId: this.props.sphereId,
//               locationId: this.props.locationId,
//               data:{ fingerprintCloudId: fingerprint.id }
//             });
//           })
//           .catch((err) => {
//             LOGe.info("uploadedFingerprint fingerprint ERROR:", err?.message);
//           });
//       }).catch((err) => { LOGe.cloud("ERR W fingerprint uploading", err?.message)});
//   }
//
//
//
//   render() {
//     let state  = core.store.getState();
//     let roomName = 'this room';
//     let sphere = state.spheres[this.props.sphereId];
//     if (sphere) {
//       let location = sphere.locations[this.props.locationId];
//       if (location) {
//         roomName = location.config.name || roomName;
//       }
//     }
//
//
//     let quitMethod = () => { NavigationUtil.dismissModal(); };
//
//     let content = undefined;
//     if (this.state.phase === 0) {
//       content = (
//         <RoomTraining_explanation
//           next={() => {
//             this.setState({phase:1});
//             TopBarUtil.updateOptions(this.props.componentId, {cancel: true});
//             this.start();
//           }}
//           sampleSize={this.props.sampleSize}
//           roomSize={this.props.roomSize}
//           roomName={roomName}
//         />
//       )
//     }
//     else if (this.state.phase === 1) {
//       content = (
//         <RoomTraining_training
//           progress={this.state.progress}
//           opacity={this.state.opacity}
//           iconIndex={this.state.iconIndex}
//         />
//       );
//     }
//     else if (this.state.phase === 2) {
//       content = <RoomTraining_finished quit={ quitMethod } />
//     }
//
//     return (
//       <Background hasNavBar={false} image={background.main}>
//         <KeepAwake />
//         {content}
//       </Background>
//     );
//   }
// }
//
