
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("LockOverlay", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  View,
} from "react-native";

import { OverlayBox }           from '../components/overlays/OverlayBox'
import { styles, colors, screenWidth, screenHeight } from "../styles";
import { core } from "../../core";

export class SimpleOverlay extends Component<any, any> {
  unsubscribe : any;
  customContent : Component;
  callback : any;
  selection : string[];
  getItems : () => any[]

  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
    this.unsubscribe = [];

    this.customContent = null;
  }

  componentDidMount() {
    this.unsubscribe.push(core.eventBus.on("showCustomOverlay", (data) => {
      this.customContent = data.content || null;
      this.setState({
        visible: true,
      });
    }));
    this.unsubscribe.push(core.eventBus.on("hideCustomOverlay", () => {
      this.close();
    }));
  }

  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }



  close() {
    this.customContent = null;
    this.setState({ visible:false });
  }

  render() {
    let idealAspectRatio = 1.75;
    let width = 0.85*screenWidth;
    let height = Math.min(width*idealAspectRatio, 0.9 * screenHeight);

    return (
      <OverlayBox
        visible={this.state.visible}
        height={height} width={width}
        overrideBackButton={false}
        canClose={true}
        scrollable={true}
        closeCallback={() => { this.close(); }}
        // backgroundColor={colors.white.rgba(0.2)}
        title={this.state.title}
      >
        { this.customContent }
        <View style={{height:50}} />
      </OverlayBox>
    );
  }
}



