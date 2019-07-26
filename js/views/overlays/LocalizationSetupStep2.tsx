
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LocalizationSetupStep2", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { OverlayBox }                                from '../components/overlays/OverlayBox'
import { styles, colors, screenWidth } from '../styles'
import { Util }                                      from "../../util/Util";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";

export class LocalizationSetupStep2 extends Component<any, any> {
  constructor(props) {
    super(props);

    this.state = { visible: false, sphereId: props.data };
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  render() {
    return (
      <OverlayBox
        visible={this.state.visible}
        overrideBackButton={() => { this.setState({visible:false}); }}
      >
        <Text style={{fontSize: 23, fontWeight: 'bold', color: colors.menuBackground.hex, padding:15}}>{ lang("The_Next_Step") }</Text>
        <Image source={require('../../images/localizationExplanation.png')} style={{width:0.6*screenWidth, height:0.6*screenWidth}}/>
        <Text style={{fontSize: 13, color: colors.blue.hex, textAlign:'center'}}>{ lang("You_can_now_teach__when_y") }</Text>
        <View style={{flex:1}}/>
        <Text style={{fontSize:14, fontWeight:'bold', color: colors.blue.hex, textAlign:'center'}}>{ lang("Once_youre_ready__tap_one") }</Text>
        <View style={{flex:1}}/>
        <TouchableOpacity
          onPress={() => {this.setState({visible:false}, () => {  NavigationUtil.closeOverlay(this.props.componentId); });}}
          style={[styles.centered,{width:0.4*screenWidth, height:36, borderRadius:18, borderWidth:2, borderColor:colors.blue.rgba(0.25), marginBottom:10}]}>
          <Text style={{fontSize: 13, color: colors.blue.hex}}>{ lang("OK") }</Text>
        </TouchableOpacity>
      </OverlayBox>
    );
  }
}