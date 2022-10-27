
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LibMessages", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { IconButton }         from '../components/IconButton'
import {colors, screenHeight, screenWidth, styles} from '../styles'
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { Icon } from "../components/Icon";
import { SimpleOverlayBox } from "../components/overlays/SimpleOverlayBox";

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
      <SimpleOverlayBox visible={this.state.visible} overrideBackButton={false} canClose={true} closeCallback={() => {  NavigationUtil.closeOverlay(this.props.componentId); }}>
        <View style={{flex:1, alignItems:'center'}}>
          <View style={{flex:1}} />
          <Icon
            name="ios-bluetooth"
            size={0.15*screenHeight}
            color={colors.blue3.hex}
          />
          <View style={{flex:1}} />
          <Text style={{fontSize: 18, fontWeight: 'bold', color: colors.blue3.hex, padding:15, }}>{this.state.header}</Text>
          <Text style={{fontSize: 12, color: colors.blue3.hex, padding:15, textAlign:'center'}}>
            {this.state.body}
          </Text>
          <View style={{flex:1}} />
        </View>
      </SimpleOverlayBox>
    );
  }
}
