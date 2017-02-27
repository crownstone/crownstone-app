import React, { Component } from 'react'
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OverlayBox }                                 from './OverlayBox'
import { styles, colors, screenHeight, screenWidth } from '../../styles'
import { eventBus }                                   from '../../../util/eventBus'
import { getAiData }                                  from '../../../util/DataUtil'

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

  render() {
    let state = this.props.store.getState();
    let ai = getAiData(state, this.state.sphereId);


    return (
      <OverlayBox visible={this.state.visible}>
        <Text style={{fontSize: 23, fontWeight: 'bold', color: colors.menuBackground.hex, padding:15}}>{"The Next Step"}</Text>
        <Image source={require('../../../images/localizationExplanation.png')} style={{width:0.6*screenWidth, height:0.6*screenWidth}}/>
        <Text style={{fontSize: 13, color: colors.blue.hex, textAlign:'center'}}>{"You can now teach " + ai.name + " when you are in certain rooms. " +
        "This new icon indicates that " + ai.name + " is ready to learn how to identify this room!"}</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize:14, fontWeight:'bold', color: colors.blue.hex, textAlign:'center'}}>
          {"Once you're ready, tap one to start training!"}
        </Text>
        <View style={{flex:1}}/>
        <TouchableOpacity onPress={() => {this.setState({visible:false});}} style={[styles.centered,{width:0.4*screenWidth, height:36, borderRadius:18, borderWidth:2, borderColor:colors.blue.rgba(0.25), marginBottom:10}]}>
          <Text style={{fontSize: 13, color: colors.blue.hex}}>OK</Text>
        </TouchableOpacity>
      </OverlayBox>
    );
  }
}