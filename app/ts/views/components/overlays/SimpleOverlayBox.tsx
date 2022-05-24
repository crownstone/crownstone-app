
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayBox", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView, SafeAreaView
} from "react-native";

import { HiddenFadeInBlur} from "../animated/FadeInView";
import { Icon }         from '../Icon'
import { styles, colors, screenHeight, screenWidth, availableScreenHeight} from "../../styles";

interface overlayBoxProps {
  overrideBackButton?: any,
  visible:             boolean,
  backgroundColor?:    any,
  maxOpacity?:         number,
  scrollable?:         boolean,
  canClose?:           boolean,
  vFlex?: number,
  hFlex?: number,
  closeCallback?:      any,
  style?:              any
  wrapperStyle?:       any,
  getDesignElement?:   (innerSize: number) => JSX.Element
  title?:              string
  subTitle?:           string
  footerComponent?:  JSX.Element
}

// Set prop "overrideBackButton" to override the (android) back button when the overlay box is visible.
//    true: disable the back button
//    function: execute that function when the back button is pressed
export class SimpleOverlayBox extends Component<overlayBoxProps, any> {

  _getTitle() {
    if (!this.props.getDesignElement && this.props.title) {
      return (
          <Text style={{fontSize: 24, fontWeight:'bold', textAlign:'left'}}>{this.props.title}</Text>
      )
    }
  }

  _getFooterComponent(closeIconSize) {
    if (this.props.footerComponent) {
      return (
        <View style={{
          position: 'absolute',
          bottom: -30,
          left: 0,
          width: screenWidth - 0.25*closeIconSize,
          height: 60,
        }}>
          {this.props.footerComponent}
        </View>
      );
    }
  }

  _getCloseIcon(size) {
    if (this.props.canClose === true) {
      let top   = -0.25*size
      let right = -0.25*size
      return (
        <TouchableOpacity onPress={this.props.closeCallback} style={{
          position: 'absolute',
          top: top,
          right: right,
          width: size,
          height: size,
          backgroundColor: colors.csBlue.hex,
          borderRadius: size/2,
          borderWidth: 3,
          borderColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon name="md-close" size={size*0.75} color="#fff" style={{ position: 'relative', top: 1, right: 0 }}/>
        </TouchableOpacity>
      )
    }
  }

  render() {
    let designElementSize = Math.min(0.21*screenHeight,0.38 * screenWidth);
    let closeIconSize = 40;
    let topPadding = 12;


    return (
      <HiddenFadeInBlur
        style={[
          {
            flex:1,
            backgroundColor: this.props.backgroundColor || colors.csBlue.rgba(0.2),
            overflow:"hidden",
          },
          this.props.wrapperStyle
        ]}
        height={screenHeight}
        maxOpacity={this.props.maxOpacity}
        visible={this.props.visible}
      >
        <SafeAreaView style={{flex:1}}>
          <View style={{flex:1, padding:30}}>
            <View style={{flex:1, backgroundColor:colors.white.hex, paddingTop: 30, paddingLeft:30, borderRadius:10}}>
              { this._getTitle() }
              <ScrollView showsVerticalScrollIndicator={true} persistentScrollbar={true} contentContainerStyle={{paddingRight:30}}>{ this.props.children }</ScrollView>
              { this._getCloseIcon(closeIconSize) }
            </View>
          </View>
        </SafeAreaView>
      </HiddenFadeInBlur>
    );
  }
}
