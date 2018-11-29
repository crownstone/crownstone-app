
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationSetupStep2", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OverlayBox }                                from '../components/overlays/OverlayBox'
import { styles, colors, screenWidth } from '../styles'
import { eventBus }                                  from '../../util/EventBus'
import { Util }                                      from "../../util/Util";

export class LocalizationSetupStep2 extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

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
    let ai = Util.data.getAiData(state, this.state.sphereId);

    return (
      <OverlayBox
        visible={this.state.visible}
        overrideBackButton={() => { this.setState({visible:false}); }}
      >
        <Text style={{fontSize: 23, fontWeight: 'bold', color: colors.menuBackground.hex, padding:15}}>{ lang("The_Next_Step") }</Text>
        <Image source={require('../../images/localizationExplanation.png')} style={{width:0.6*screenWidth, height:0.6*screenWidth}}/>
        <Text style={{fontSize: 13, color: colors.blue.hex, textAlign:'center'}}>{ lang("You_can_now_teach__when_y",ai.name,ai.name) }</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize:14, fontWeight:'bold', color: colors.blue.hex, textAlign:'center'}}>{ lang("Once_youre_ready__tap_one") }</Text>
        <View style={{flex:1}}/>
        <TouchableOpacity onPress={() => {this.setState({visible:false});}} style={[styles.centered,{width:0.4*screenWidth, height:36, borderRadius:18, borderWidth:2, borderColor:colors.blue.rgba(0.25), marginBottom:10}]}>
          <Text style={{fontSize: 13, color: colors.blue.hex}}>{ lang("OK") }</Text>
        </TouchableOpacity>
      </OverlayBox>
    );
  }
}