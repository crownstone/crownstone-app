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
import { FingerprintManager } from '../../native/FingerprintManager'
import { Background } from '../components/Background'
import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Icon } from '../components/Icon';
import { LOG } from '../../logging/Log'
import { IconButton } from '../components/IconButton'


export class RoomTraining extends Component {
  constructor(props) {
    super();
    this.state = {started: false, text:'initializing', active: false, opacity: new Animated.Value(0), iconIndex: 0, progress:0};
    this.collectedData = [];
    this.dataLimit = 60;
  }

  componentDidMount() {}

  componentWillUnmount() {
    this.stop()
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
    let icons = ['ios-finger-print','ios-outlet-outline','ios-pin-outline','ios-pricetag-outline'];
    if (this.state.started === false) {
      return (
        <Background hideInterface={true} image={this.props.backgrounds.main}>
          <TopBar
            left={"Back"}
            leftAction={ Actions.pop }
            title="Train Room"/>
          <View style={{flexDirection:'column', flex:1, padding:20, alignItems:'center'}}>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:20,
                fontWeight:'600',
                color: colors.menuBackground.hex,
                textAlign:'center'
              }}>To let Crownstone find you in this room, we need to help it a little!</Text>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:18,
                fontWeight:'300',
                color: colors.menuBackground.hex,
                textAlign:'center',
                paddingTop:40,
              }}>To train, walk around the room with your phone in your hand.
                Try to get to every spot in the room, close by the walls as well and through the center.
                The training process takes 1 minute and you can see the progress on your screen.
              </Text>
              <Text style={{
                backgroundColor:'transparent',
                fontSize:18,
                fontWeight:'300',
                color: colors.menuBackground.hex,
                textAlign:'center',
                paddingTop:40,
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
              <Icon name="ios-finger-print" size={0.35*screenWidth} color="#fff" style={{backgroundColor:"transparent", position:'relative', top:0.01*screenWidth}} />
            </TouchableOpacity>
            <View style={{flex:1}} />
          </View>
        </Background>
      );
    }
    else {
      return (
        <Background hideInterface={true} background={require('../../images/mainBackgroundLight.png')}>
          <TopBar
            left={this.state.active ? "Cancel" : "Back"}
            notBack={this.state.active}
            leftAction={this.state.active ? () => {
              LocalizationUtil.pauseCollectingFingerprint();
              Alert.alert(
                "Do you want to cancel training?",
                "Cancelling the training process will revert it to the way it was before.",
                [
                  {text:'No', onPress: () => { LocalizationUtil.resumeCollectingFingerprint(this.handleCollection.bind(this)); }},
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
              }}>Walk around the room so we can learn to locate you within it. Each beat a point is collected.</Text>
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