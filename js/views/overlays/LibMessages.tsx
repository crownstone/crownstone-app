
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LibMessages", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { NativeBus }          from '../../native/libInterface/NativeBus'
import { IconButton }         from '../components/IconButton'
import { OverlayBox }         from '../components/overlays/OverlayBox'
import {colors, screenHeight, screenWidth, styles} from '../styles'

export class LibMessages extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);

    this.state = {
      visible: false,
      header: null,
      body: null,
      type: null,
      buttonText: null,
    };
    this.unsubscribe = [];
  }

  componentDidMount() {
    this.unsubscribe.push(NativeBus.on(NativeBus.topics.libPopup, (data) => {
      this.setState({visible: true, ...data});
    }));

    this.unsubscribe.push(NativeBus.on(NativeBus.topics.libAlert, (data) => {
      Alert.alert(
        lang("arguments___arguments___O_header",data.header),
        lang("arguments___arguments___O_body",data.body),
        [{text: data.buttonText || lang("arguments___arguments___O_left")}])
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
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
          onPress={() => { this.setState({visible: false}) }}
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