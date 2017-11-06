import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Icon } from "../Icon";
import {styles, colors, screenHeight, screenWidth, availableScreenHeight} from '../../styles'

export class OverlayContent extends Component<any, any> {
  getEyeCatcher() {
    if (this.props.icon) {
      let iconSize = this.props.iconSize || 0.40 * screenWidth;
      return (
        <View style={{
          width: 1.1*iconSize,
          height: 1.1*iconSize,
          margin: 0.2*iconSize,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Icon
          name={this.props.icon}
          size={iconSize}
          color={colors.csBlue.hex}
          style={{position: 'relative', top: 0, left: 0, backgroundColor: 'transparent'}}
        />
        </View>
      );
    }
    else if (this.props.image) {
      return (
        <Image
          source={this.props.image}
          style={{width:0.45*screenWidth, height:0.45*screenWidth, margin:0.025*screenHeight}}
        />
      );
    }
    else if (this.props.eyeCatcher) {
      return this.props.eyeCatcher;
    }
  }

  getButton() {
    if (this.props.buttonCallback) {
      return <TouchableOpacity onPress={() => {
        this.props.buttonCallback();
      }} style={[styles.centered, {
          width: 0.4 * screenWidth,
          height: 36,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: colors.blue.rgba(0.5),
      }]}>
      <Text style={{fontSize: 14, color: colors.blue.hex}}>{this.props.buttonLabel}</Text>
      </TouchableOpacity>
    }
  }

  getContent() {
    if (this.props.text) {
      return <Text style={{fontSize: 12, color: colors.csBlue.hex, textAlign:'center', paddingLeft:10, paddingRight:10}}>{this.props.text}</Text>
    }
    else {
      return this.props.children;
    }
  }

  getHeader() {
    if (this.props.header) {
      return <Text style={{
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.csBlue.hex,
        textAlign:'center',
        padding:15,
        paddingTop:0,
        paddingBottom: this.props.scrollable ? 15 : 0
      }}>{this.props.header}</Text>
    }
  }

  getContentSpacer() {
    // only do this if there is content
    if (this.props.text || this.props.header) {
      return <View style={{flex: 1}}/>
    }
  }
  getButtonSpacer() {
    // only do this if there is a button
    if (this.props.buttonCallback || this.props.text) {
      if (this.props.text || !this.props.header)
        return <View style={{flex: 1}} />
    }
  }

  render() {
    if (this.props.scrollable) {
      return (
        <View style={{flex:1, height: 0.9*availableScreenHeight, alignItems:'center'}}>
          <ScrollView>
            <View style={{alignItems:'center'}}>
              <Text style={{fontSize: 20, fontWeight: 'bold', textAlign:'center', color: colors.csBlue.hex, padding:15}}>{this.props.title}</Text>
              { this.getEyeCatcher() }
              { this.getHeader() }
              { this.getContentSpacer() }
              { this.getContent() }
              { this.getButtonSpacer() }
              { this.getButton() }
            </View>
          </ScrollView>
        </View>
      );
    }
    else {
      return (
        <View style={{flex:1, height: 0.9*availableScreenHeight, alignItems:'center'}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', textAlign:'center', color: colors.csBlue.hex, padding:15}}>{this.props.title}</Text>
          { this.getEyeCatcher() }
          { this.getHeader() }
          { this.getContentSpacer() }
          { this.getContent() }
          { this.getButtonSpacer() }
          { this.getButton() }
        </View>
      );
    }
  }
}