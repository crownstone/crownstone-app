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
  View
} from 'react-native';

var Actions = require('react-native-router-flux').Actions;

import { TopBar } from '../components/Topbar'
import { FingerprintManager } from '../../native/FingerprintManager'
import { Bluenet } from '../../native/Proxy'
import { sphereRequiresFingerprints } from '../../native/LocationHandler'
import { Background } from '../components/Background'
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Icon } from '../components/Icon';
import { LOG, LOGDebug } from '../../logging/Log'
import { IconButton } from '../components/IconButton'


export class RoomTraining extends Component {
  constructor(props) {
    super();
    this.state = {started: false, text:'initializing', active: false, opacity: new Animated.Value(0), iconIndex: 0, progress:0};
    this.collectedData = [];
    this.dataLimit = 60;
  }

  componentDidMount() {

    LOGDebug("Stopping indoor localization for training purposes");
    Bluenet.stopIndoorLocalization();
  }

  componentWillUnmount() {
    this.stop();

    let state = this.props.store.getState();
    if (sphereRequiresFingerprints(state, this.props.sphereId) === false) {
      LOGDebug("(Re)Starting indoor localization after training");
      Bluenet.startIndoorLocalization();
    }
  }

  start() {
    this.collectedData = [];
    this.setState({started:true, text:'initializing', active:true});
    FingerprintManager.startFingerprinting((data) => {this.handleCollection(data);});
  }

  stop(forceAbort = false) {
    if (this.state.active === true || forceAbort) {
      FingerprintManager.abortFingerprinting();
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
    let sphereId = state.app.activeSphere;
    FingerprintManager.finalizeFingerprint(sphereId, this.props.locationId);
    FingerprintManager.getFingerprint(sphereId, this.props.locationId)
      .then((result) => {
        LOG("gathered fingerprint:", result);
        store.dispatch({
          type:'UPDATE_LOCATION_FINGERPRINT',
          sphereId: sphereId,
          locationId: this.props.locationId,
          data:{ fingerprintRaw: result }
        });

      }).done();
  }

  animatePulse() {
    let newIconIndex = (this.state.iconIndex+1) % 4;
    this.setState({iconIndex: newIconIndex});
    Animated.timing(this.state.opacity, {toValue: 1, duration:80}).start();
    setTimeout(() => {Animated.timing(this.state.opacity, {toValue: 0, duration:450}).start();},80);
  }

  render() {
    let icons = ['c1-locationPin1','ios-outlet-outline','ios-pin-outline','c1-brain','c1-male','c1-female'];

    let state  = this.props.store.getState();
    let ai = getAiData(state, this.props.sphereId);

    if (this.state.started === false) {
      return (
        <Background hideInterface={true} image={this.props.backgrounds.main}>
          <TopBar
            leftAction={ Actions.pop }
            title={"Teaching " + ai.name}/>
            <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:20,
                fontWeight:'600',
                color: colors.menuBackground.hex,
                textAlign:'center'
              }}>{"To let " + ai.name + " find you in this room, we need to help " + ai.him + " a little!"}</Text>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:16,
                fontWeight:'300',
                color: colors.menuBackground.hex,
                textAlign:'center',
                paddingTop:20,
              }}>To train, walk around the room with your phone in your hand.
                Try to get to every spot in the room, near the walls as well and through the center.
                The training process takes 1 minute and you can see the progress on your screen.
              </Text>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:16,
                fontWeight:'300',
                color: colors.menuBackground.hex,
                textAlign:'center',
                paddingTop:20,
                paddingBottom:20,
              }}>Press the button below to get started!
              </Text>

              <View style={{flex:1}} />
              <TouchableOpacity
                style={[
                  {borderWidth:5, borderColor:"#fff", backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth},
                  styles.centered
                ]}
                onPress={() => {this.start();}}
              >
                <Icon name="c1-locationPin1" size={0.32*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
              </TouchableOpacity>
              <View style={{flex:1}} />
           </View>
        </Background>
      );
    }
    else {
      return (
        <Background hideInterface={true} image={this.props.backgrounds.main}>
          <TopBar
            left={this.state.active ? "Cancel" : "Back"}
            notBack={this.state.active}
            leftAction={this.state.active ? () => {
              FingerprintManager.pauseCollectingFingerprint();
              Alert.alert(
                "Do you want to cancel training?",
                "Cancelling the training process will revert it to the way it was before.",
                [
                  {text:'No', onPress: () => { FingerprintManager.resumeCollectingFingerprint(this.handleCollection.bind(this)); }},
                  {text:'Yes', onPress: () => { this.stop(true); Actions.pop(); }}
                ]
              )}
              : Actions.pop }
            title="Train Room"/>
          <View style={{flexDirection:'column', flex:1}}>
            <View style={{padding:30, alignItems:'center'}}>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:20,
                fontWeight:'600',
                color: colors.menuBackground.hex,
                textAlign:'center'
              }}>{this.state.active ?
                "Walk around the room so " + ai.name + " can learn to locate you within it. Each beat " + ai.he + " learns a bit more about the room!" :
                "All Done! Once you have taught " + ai.name + " all the rooms, " + ai.he + " will start doing " + ai.his + " best to determine in which room you are!"
              }</Text>
            </View>

            <View style={{flex:1}} />
            <View style={{flex:1, alignItems:'center', justifyContent:'center', marginTop:-40}} >
              <View style={{position:'relative'}}>
                <View style={{backgroundColor:'rgba(255,255,255,1)', width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth}} />
                <Animated.View style={{marginTop: -0.5*screenWidth, opacity:this.state.opacity, backgroundColor:colors.green.hex, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth, alignItems:'center', justifyContent:'center'}}>
                  <Icon name={icons[this.state.iconIndex]} size={0.3*screenWidth} color="#fff" style={{backgroundColor:'transparent'}} />
                </Animated.View>
                <View style={{backgroundColor:'transparent', marginTop: -0.5*screenWidth, width:0.5*screenWidth, height:0.5*screenWidth, borderRadius:0.25*screenWidth,  alignItems:'center', justifyContent:'center'}}>
                  <Text style={{backgroundColor:'transparent', fontSize:22, fontWeight:'200'}}>{this.state.text}</Text>
                </View>
              </View>
            </View>
            <View style={{flex:1}} />
          </View>
        </Background>
      );
    }
  }
}