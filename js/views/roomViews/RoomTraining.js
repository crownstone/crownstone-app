import React, { Component } from 'react'
import {
  Animated,
  Alert,
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';

var Actions = require('react-native-router-flux').Actions;

import { TopBar } from '../components/Topbar'
import { NativeBridge } from '../../native/NativeBridge'
import { safeDeleteFile } from '../../util/util'
import { Background } from '../components/Background'
import RNFS from 'react-native-fs'
import { colors, width, height } from '../styles'
var Icon = require('react-native-vector-icons/Ionicons');


export class RoomTraining extends Component {
  constructor(props) {
    super();
    this.state = {text:'initializing', active: false, opacity: new Animated.Value(0), iconIndex: 0, progress:0};
    this.collectedData = [];
    this.dataLimit = 30000;
  }

  componentDidMount() {
    this.start();
  }

  componentWillUnmount() {
    this.stop()
  }

  start() {
    this.collectedData = [];
    this.setState({text:'initializing', active:true});
    NativeBridge.stopListeningToLocationUpdates();
    NativeBridge.startFingerprinting(this.handleCollection.bind(this));
  }

  stop(forceAbort = false) {
    if (this.state.active === true || forceAbort) {
      NativeBridge.startListeningToLocationUpdates();
      NativeBridge.abortFingerprinting();
      this.collectedData = [];
      this.setState({active: false});
    }
  }

  handleCollection(data) {
    this.collectedData.push(data);
    this.setState({text: this.collectedData.length + " samples"});
    this.animatePulse();

    if (this.collectedData.length == this.dataLimit) {
      this.finalizeFingerprint()
    }
  }

  finalizeFingerprint() {
    this.setState({text:'Finished!', active:false});
    const store = this.props.store;
    const state = store.getState();
    let groupId = state.app.activeGroup;
    NativeBridge.finalizeFingerprint(groupId, this.props.locationId);
    NativeBridge.getFingerprint(groupId, this.props.locationId)
      .then((result) => {
        console.log("gathered fingerprint:", result);
        store.dispatch({
          type:'UPDATE_LOCATION_FINGERPRINT',
          groupId: groupId,
          locationId: this.props.locationId,
          data:{ fingerprintRaw: result }
        });

        // -------------
        // DEBUG -- only for intern
        let path = RNFS.DocumentDirectoryPath + '/' + state.groups[groupId].locations[this.props.locationId].config.name + '_fingerprint.txt';
        safeDeleteFile(path).then(() => {
          RNFS.writeFile(path, result).then((data) => {
            console.log('written to file');
          }).done();
        });
        // -------------
        NativeBridge.startListeningToLocationUpdates();
      }).done();
  }

  animatePulse() {
    let newIconIndex = (this.state.iconIndex+1) % 4;
    this.setState({iconIndex: newIconIndex});
    Animated.timing(this.state.opacity, {toValue: 1, duration:80}).start();
    setTimeout(() => {Animated.timing(this.state.opacity, {toValue: 0, duration:450}).start();},80);
  }

  render() {
    let icons = ['ios-finger-print','ios-outlet-outline','ios-pin-outline','ios-pricetag-outline'];

    return (
      <Background hideInterface={true} background={require('../../images/mainBackgroundLight.png')}>
        <TopBar
          left={this.state.active ? "Cancel" : "Back"}
          notBack={this.state.active}
          leftAction={this.state.active ? () => {
            NativeBridge.pauseCollectingFingerprint();
            Alert.alert(
              "Do you want to cancel training?",
              "Cancelling the training process will revert it to the way it was before.",
              [
                {text:'No', onPress: () => { NativeBridge.resumeCollectingFingerprint(this.handleCollection.bind(this)); }},
                {text:'Yes', onPress: () => { this.stop(true); Actions.pop(); }}
              ]
            )}
          : Actions.pop}
          title="Train Room"/>
        <View style={{flexDirection:'column', flex:1}}>
          <View style={{padding:30, alignItems:'center'}}>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:20,
                fontWeight:'600',
                color: colors.menuBackground.h,
                textAlign:'center'
              }}>Walk around the room so it can learn to locate you within it. Each beat a point is collected.</Text>
          </View>


          <View style={{flex:1}} />
          <View style={{flex:1, alignItems:'center', justifyContent:'center', marginTop:-40}} >
            <View style={{position:'relative'}}>
              <View style={{backgroundColor:'rgba(255,255,255,1)', width:0.5*width, height:0.5*width, borderRadius:0.25*width}} />
              <Animated.View style={{marginTop: -0.5*width, opacity:this.state.opacity, backgroundColor:colors.green.h, width:0.5*width, height:0.5*width, borderRadius:0.25*width, alignItems:'center', justifyContent:'center'}}>
                <Icon name={icons[this.state.iconIndex]} size={0.3*width} color="#fff" style={{backgroundColor:'transparent'}} />
              </Animated.View>
              <View style={{backgroundColor:'transparent', marginTop: -0.5*width, width:0.5*width, height:0.5*width, borderRadius:0.25*width,  alignItems:'center', justifyContent:'center'}}>
                <Text style={{backgroundColor:'transparent', fontSize:22, fontWeight:'200'}}>{this.state.text}</Text>
              </View>
            </View>
          </View>
          <View style={{flex:1}} />
          <TouchableHighlight onPress={() => {this.finalizeFingerprint()}}><Text>Click me to finish collecting fingerprint.</Text></TouchableHighlight>
        </View>
      </Background>
    );

  }
}