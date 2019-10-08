
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

import { HiddenFadeInBlur, HiddenFadeInView } from "../animated/FadeInView";
import { Icon }         from '../Icon'
import {styles, colors, screenHeight, screenWidth, availableScreenHeight} from '../../styles'

interface overlayBoxProps {
  overrideBackButton?: any,
  visible:             boolean,
  backgroundColor?:    any,
  maxOpacity?:         number,
  scrollable?:         boolean,
  height?:             number,
  width?:              number,
  canClose?:           boolean,
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
  _getExtraContent(width, height, size, padding, top) {
    if (this.props.getDesignElement) {
      let left = 10;
      let innerSize = size - 2 * padding;

      return (
        <View style={{
          position: 'absolute',
          top: top,
          left: left,
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
          { this.props.title ? <View style={{
            position: 'absolute',
            top: 0.5*size,
            left: padding + size,
            width: width-size,
            height: 0.5*size+padding,
          }}>
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

  _getFooterComponent(width, height, padding, closeIconSize, top) {
    if (this.props.footerComponent) {
      return (
        <View style={{
          position: 'absolute',
          top: top+height+padding-5,
          left: 0,
          width: screenWidth - 0.25*closeIconSize,
          height: 60,
        }}>
          {this.props.footerComponent}
        </View>
      );
    }
  }

  _getCloseIcon(width, height, size) {
    if (this.props.canClose === true) {
      let top   = ((screenHeight - height) / 2) - 0.25*size;
      let right = ((screenWidth - width)   / 2) - 0.25*size;
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
    let width = this.props.width || 0.85*screenWidth;
    let height = this.props.height || Math.min(500,0.9*availableScreenHeight);

    let topPositionOfOverlay = (screenHeight - height) / 2;
    let designElementSize = 0.38 * screenWidth;
    let topPositionOfDesignElements = topPositionOfOverlay - 0.3*designElementSize;
    let closeIconSize = 40;
    let topPadding = 12;
    let padding = 0.03*screenWidth;

    let innerPaddingTop = this.props.getDesignElement ? 0.7*designElementSize - 2*topPadding - 30: padding;



    let innerChildrenArea = (
      <View style={{ minHeight: height - innerPaddingTop - 2*topPadding}}>
        {this.props.getDesignElement ? <View style={{height:35}} /> : undefined}
        {this.props.children}
      </View>
    );

    return (
      <HiddenFadeInBlur
        style={[
          styles.fullscreen,
          {
            backgroundColor: this.props.backgroundColor || colors.csBlue.rgba(0.2),
            justifyContent:'center',
            alignItems:'center',
            overflow:"hidden",
          },
          this.props.wrapperStyle
        ]}
        height={screenHeight}
        duration={200}
        maxOpacity={this.props.maxOpacity}
        visible={this.props.visible}
      >
        <View style={{backgroundColor:colors.white.rgba(0.5), width: width, height: height, borderRadius: 25, padding: topPadding}}>
          <View style={[
            styles.centered,
            {
              backgroundColor:'#fff',
              flex:1,
              overflow:"hidden",
              borderRadius: 25-0.02*screenWidth,
              paddingLeft:  padding,
              paddingRight: padding,
              paddingTop: innerPaddingTop
             },
            {...this.props.style}
          ]}>
            { this._getTitle() }
            {this.props.scrollable ?
              <ScrollView style={{ width: width - 2*padding }}>{innerChildrenArea}</ScrollView> : this.props.children
            }
          </View>
        </View>
        { this._getExtraContent(width, height, designElementSize, padding, topPositionOfDesignElements) }
        { this._getFooterComponent(width, height, padding, closeIconSize, topPositionOfDesignElements) }
        { this._getCloseIcon(width, height, closeIconSize) }
      </HiddenFadeInBlur>
    );
  }
}