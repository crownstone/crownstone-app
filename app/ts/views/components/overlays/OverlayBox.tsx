
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayBox", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  Text,
  View, ScrollView
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
export class OverlayBox extends Component<overlayBoxProps, any> {

  _getExtraContent(size, padding) {
    if (this.props.getDesignElement) {
      let left = 10;
      let innerSize = size - 2 * padding;

      return (
        <View style={{
          position: 'absolute',
          top: -35,
          left: left,
          flexDirection:"row",
        }}>
          <View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.white.rgba(0.5)
          }}>
            <View style={{
              position: 'absolute',
              top: padding,
              left: padding,
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.white.rgba(1)
            }}>
              {this.props.getDesignElement(innerSize)}
            </View>
          </View>
          { this.props.title ? <View style={{flex:1, paddingLeft:padding, justifyContent:'center'}}>
            <Text style={{fontSize: 20, fontWeight:'bold'}}>{this.props.title}</Text>
            { this.props.subTitle ? <Text style={{fontSize: 15, fontWeight:'bold', paddingTop:10}}>{this.props.subTitle}</Text> : undefined }
          </View>  : undefined }
        </View>
      );
    }
  }

  _getTitle() {
    if (!this.props.getDesignElement && this.props.title) {
      return (
        <View style={{...styles.centered, padding: 10, paddingTop:20}}>
          <Text style={{fontSize: 20, fontWeight:'bold', textAlign:'center'}}>{this.props.title}</Text>
        </View>
      )
    }
  }

  _getFooterComponent(padding, closeIconSize) {
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
    let padding = 0.03*screenWidth;

    let innerPaddingTop = this.props.getDesignElement ? 0.7*designElementSize - 2*topPadding - 30: padding;

    let innerChildrenArea = (
      <View style={{ flexGrow: 1}}>
        {this.props.getDesignElement ? <View style={{height:55}} /> : undefined}
        {this.props.children}
      </View>
    );

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
        duration={200}
        maxOpacity={this.props.maxOpacity}
        visible={this.props.visible}
      >
        <View style={{flex:1}} />
        <View style={{flex:this.props.vFlex ?? 4}}>
          <View style={{flex:1, flexDirection:'row'}}>
            <View style={{flex:1}} />
            <View style={{flex:this.props.hFlex ?? 7, backgroundColor:colors.white.rgba(0.5), borderRadius: 25, padding: topPadding}}>
              <View style={[
                {
                  backgroundColor:'#fff',
                  flex:1,
                  overflow:"hidden",
                  borderRadius: 18,
                  paddingLeft:  padding,
                  paddingRight: padding,
                  paddingTop: innerPaddingTop
                },
                {...this.props.style}
              ]}>
                { this._getTitle() }
                { this.props.scrollable ?
                  <ScrollView contentContainerStyle={{flexGrow:1}}>{innerChildrenArea}</ScrollView> : innerChildrenArea
                }
              </View>
              { this._getCloseIcon(closeIconSize) }
            </View>
            { this._getExtraContent(designElementSize, padding) }
            <View style={{flex:1}} />

          </View>
          { this._getFooterComponent(padding, closeIconSize) }
        </View>
        <View style={{flex:1.25}} />


      </HiddenFadeInBlur>
    );
  }
}