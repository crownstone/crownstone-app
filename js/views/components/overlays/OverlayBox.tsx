import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  BackHandler,
  Image,
  Platform,
  Text,
  TouchableOpacity,
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
  wrapperStyle?:       any
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

  render() {
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
        visible={this.props.visible}>
        <View style={{backgroundColor:colors.white.rgba(0.5), width: this.props.width || 0.85*screenWidth, height: this.props.height || Math.min(500,0.9*availableScreenHeight), borderRadius: 25, padding: 12}}>
          <View style={[
            styles.centered,
            {backgroundColor:'#fff', flex:1, borderRadius: 25-0.02*screenWidth, padding: 0.03*screenWidth, overflow:'hidden'},
            {...this.props.style}
          ]}>
            {this.props.children}
          </View>
          { this.props.canClose === true ?
            <TouchableOpacity onPress={this.props.closeCallback} style={{position:'absolute', top:0, right:0, width:40, height:40, backgroundColor: colors.csBlue.hex, borderRadius:20, borderWidth:3, borderColor:'#fff', alignItems:'center', justifyContent:'center'}}>
              <Icon name="md-close" size={30} color="#fff" style={{position:'relative', top:1, right:0}}/>
            </TouchableOpacity> : undefined}
        </View>
      </HiddenFadeInView>
    );
  }
}