
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("OverlayBox", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  BackHandler,
  Platform,
  TouchableOpacity,
  Text,
  View,
} from 'react-native';

import { HiddenFadeInView }   from '../animated/FadeInView'
import { Icon }         from '../Icon'
import {styles, colors, screenHeight, screenWidth, availableScreenHeight} from '../../styles'

interface overlayBoxProps {
  overrideBackButton?: any,
  visible:             boolean,
  backgroundColor?:    any,
  maxOpacity?:         number,
  height?:             number,
  width?:              number,
  canClose?:           boolean,
  closeCallback?:      any,
  style?:              any
  wrapperStyle?:       any,
  getDesignElement?:   (innerSize: number) => JSX.Element
  title?:              string
  footerComponent?:  JSX.Element
}

// Set prop "overrideBackButton" to override the (android) back button when the overlay box is visible.
//    true: disable the back button
//    function: execute that function when the back button is pressed
export class OverlayBox extends Component<overlayBoxProps, any> {
  backButtonFunction : any = null;

  componentDidMount() {
    if (Platform.OS === 'android' && this.props.overrideBackButton && this.props.visible === true) {
      this.overRideBackButton();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (Platform.OS === 'android' && this.props.overrideBackButton && nextProps.visible !== this.props.visible) {
      if (nextProps.visible === true && this.backButtonFunction === null) {
        this.overRideBackButton();
      }
      else if (this.backButtonFunction !== null) {
        this.cleanupBackButton();
      }
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android' && this.backButtonFunction !== null) {
      this.cleanupBackButton();
    }
  }

  overRideBackButton() {
    // Execute callback function and return true to override.
    this.backButtonFunction = () => {
      if (typeof this.props.overrideBackButton === 'function') {
        this.props.overrideBackButton();
      }
      return true;
    };
    BackHandler.addEventListener('hardwareBackPress', this.backButtonFunction);
  }

  cleanupBackButton() {
    BackHandler.removeEventListener('hardwareBackPress', this.backButtonFunction);
    this.backButtonFunction = null;
  }

  _getExtraContent(width, height, size, border) {
    if (this.props.getDesignElement) {
      let top = (screenHeight - height) / 4;
      let left = 10;
      let innerSize = size - 2 * border;

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
            top: border,
            left: border,
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
            backgroundColor: colors.white.rgba(1)
          }}>
            {this.props.getDesignElement(innerSize)}
          </View>
          { this.props.title ? <View style={{
            position: 'absolute',
            top: 0.5*size-border,
            left: border + size,
            width: width-size,
            height: 0.5*size+border,
          }}>
            <Text style={{fontSize: 20, fontWeight:'bold'}}>{this.props.title}</Text>
          </View> : undefined }
        </View>
      );
    }
  }

  _getFooterComponent(width, height, border, closeIconSize) {
    if (this.props.footerComponent) {
      let top = (screenHeight - height) / 4;

      return (
        <View style={{
          position: 'absolute',
          top: top+height+border-5,
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
      let size = 40;

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

    let top = (screenHeight - height) / 4;
    let size = 0.38 * screenWidth;
    let closeIconSize = 40
    let border = 10;

    return (
      <HiddenFadeInView
        style={[
          styles.fullscreen,
          {backgroundColor: this.props.backgroundColor || colors.csBlue.rgba(0.2), justifyContent:'center', alignItems:'center', overflow:'hidden'},
          this.props.wrapperStyle
        ]}
        height={screenHeight}
        duration={200}
        maxOpacity={this.props.maxOpacity}
        visible={this.props.visible}
      >

        <View style={{backgroundColor:colors.white.rgba(0.5), width: width, height: height, borderRadius: 25, padding: 12}}>
          <View style={[
            styles.centered,
            {backgroundColor:'#fff', flex:1, borderRadius: 25-0.02*screenWidth, padding: 0.03*screenWidth, paddingTop: this.props.getDesignElement ? 0.5*size+top-30 : 0.03*screenWidth,
              overflow:'hidden'},
            {...this.props.style}
          ]}>
            {this.props.children}
          </View>
        </View>
        { this._getExtraContent(width, height, size, border) }
        { this._getFooterComponent(width, height, border, closeIconSize)     }
        { this._getCloseIcon(width, height, closeIconSize)     }
      </HiddenFadeInView>
    );
  }
}