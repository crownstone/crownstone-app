
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LibMessages", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import {colors, screenHeight, screenWidth, styles} from '../styles'
import { NavigationUtil } from "../../util/NavigationUtil";

export class LibMessages extends Component<any, any> {

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      ...props.data
    };
  }

  componentDidMount() {
    this.setState({ visible: true });
  }

  render() {
    return (
      <OverlayBox visible={this.state.visible} overrideBackButton={false}>
        <View style={{flex:1}} />
        <IconButton
          name="ios-bluetooth"
          size={0.15*screenHeight}
          color="#fff"
          buttonStyle={{width: 0.2*screenHeight, height: 0.2*screenHeight, backgroundColor:colors.blue.hex, borderRadius: 0.03*screenHeight}}
          style={{position:'relative', top:0.008*screenHeight}}
        />
        <View style={{flex:1}} />
        <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue.hex, padding:15}}>{this.props.header}</Text>
        <Text style={{fontSize: 12, fontWeight: '400',  color: colors.blue.hex, padding:15, textAlign:'center'}}>
          {this.props.body}
        </Text>
        <View style={{flex:1}} />
        <TouchableOpacity
          onPress={() => { this.setState({visible: false}, () => {  NavigationUtil.closeOverlay(this.props.componentId); }) }}
          style={[styles.centered, {
            width: 0.4 * screenWidth,
            height: 36,
            borderRadius: 18,
            borderWidth: 2,
            borderColor: colors.blue.rgba(0.5),
          }]}
        >
          <Text style={{fontSize: 14, color: colors.blue.hex}}>{ lang("OK",this.state.buttonText) }</Text>
        </TouchableOpacity>
        <View style={{flex:0.5}} />
      </OverlayBox>
    );
  }
}