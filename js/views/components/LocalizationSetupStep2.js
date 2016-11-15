import React, { Component } from 'react'
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { FadeInView }                                 from './animated/FadeInView'
import { styles, colors , screenHeight, screenWidth } from './../styles'
import { eventBus }                                   from '../../util/eventBus'
import { getAiData }                                  from '../../util/dataUtil'

export class LocalizationSetupStep2 extends Component {
  constructor() {
    super();

    this.state = { visible: false, sphereId: undefined };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(eventBus.on("showLocalizationSetupStep2", (sphereId) => {
      this.setState({visible: true, sphereId: sphereId});
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }


  _getOverlay() {
    if (this.state.visible) {
      let state = this.props.store.getState();
      let ai = getAiData(state, this.state.sphereId);

      return (
        <View
          style={{backgroundColor:colors.white.rgba(0.5), width:0.85*screenWidth, height:0.75*screenHeight, borderRadius: 25, padding: 0.03*screenWidth}}>
          <View
            style={[styles.centered, {backgroundColor:'#fff', flex:1, borderRadius: 25-0.02*screenWidth, padding: 0.03*screenWidth}]}>
            <Text
              style={{fontSize: 23, fontWeight: 'bold', color: colors.menuBackground.hex, padding:15}}>{"The Next Step"}</Text>
            <Image source={require('../../images/localizationExplanation.png')}
                   style={{width:0.6*screenWidth, height:0.6*screenWidth}}/>
            <Text
              style={{fontSize: 13, color: colors.blue.hex, textAlign:'center'}}>{"You can now teach " + ai.name + " when you are in certain rooms. " +
            "This new icon indicates that " + ai.name + " is ready to learn how to identify this room!"}</Text>
            <View style={{flex:1}}/>
            <Text style={{fontSize:14, fontWeight:'bold', color: colors.blue.hex, textAlign:'center'}}>
              {"Tap a room to get started!"}
            </Text>
            <View style={{flex:1}}/>
            <TouchableOpacity onPress={() => {this.setState({visible:false});}}
                              style={[styles.centered,{width:0.4*screenWidth, height:36, borderRadius:18, borderWidth:2, borderColor:colors.blue.rgba(0.25), marginBottom:10}]}>
              <Text style={{fontSize: 13, color: colors.blue.hex}}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }


  render() {
    return (
      <FadeInView
        style={[styles.fullscreen, {backgroundColor:'rgba(255,255,255,0.2)',justifyContent:'center', alignItems:'center'}]}
        height={screenHeight}
        duration={200}
        visible={this.state.visible}>
        {this._getOverlay()}
      </FadeInView>
    );
  }
}