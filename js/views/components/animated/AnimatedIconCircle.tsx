import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
import {Icon} from "../Icon";
import {colors, styles} from "../../styles";



/**
 * props: {
 *   icon            : String   // icon name (ionicons only without the ion- prefix)
 *   size            : Number   // size of the iconCircle
 *   iconSize        : Number   // size of the iconCircle
 *   color           : String   // change the color of the icon, default menu dark blue
 *   borderColor     : String   // change the color of the background, default same as icon
 *   backgroundColor : String   // change the color of the background, default white
 *   showAdd         : Bool     // show an add icon in the corner
 *   showEdit        : Bool     // show an edit icon in the corner
 * }
 */
export class AnimatedIconCircle extends Component<any, any> {
  _getEditIcon(size) {
    if (this.props.showEdit === true) {
      return (
        <View style={[{
          marginTop:-size,
          marginLeft:size*2/3,
          width:size/3,
          height:size/3,
          borderRadius:size/6,
          backgroundColor: colors.green.hex,
          borderColor: '#ffffff',
          borderWidth: this.props.borderWidth || 2
        }, styles.centered]}>
          <Icon name={'md-create'} size={size/5} color={'#ffffff'} />
        </View>
      );
    }
  }

  _getAddIcon(size) {
    if (this.props.showAdd === true) {
      return (
        <View style={[{
          marginTop:-size,
          marginLeft:size*2/3,
          width:size/3,
          height:size/3,
          borderRadius:size/6,
          backgroundColor: colors.green.hex,
          borderColor: '#ffffff',
          borderWidth: this.props.borderWidth || 2
        }, styles.centered]}>
          <Icon name={'md-add'} size={size/5} color={'#ffffff'} />
        </View>
      );
    }
  }
  _getMainIcon(size) {
    return (
      <Animated.View style={[{
        width:size,
        height:size,
        borderRadius:size * 0.5,
        backgroundColor: this.props.backgroundColor || colors.white.hex,
      }, styles.centered]}>
        <Icon name={this.props.icon} size={this.props.iconSize || size*0.6} color={this.props.color || colors.menuBackground.hex} />
      </Animated.View>
    )
  }

  render() {
    let size = this.props.size || 60;
    let borderWidth = this.props.borderWidth || 2;
    let borderColor = this.props.borderColor || this.props.color || colors.menuBackground.hex;
    if (borderWidth > 0) {
      let innerSize = size - 2* borderWidth;
      return (
        <View style={[this.props.style, {width:size, height:size}]}>
          <Animated.View style={[{
            width:size,
            height:size,
            borderRadius:size * 0.5,
            backgroundColor: borderColor,
          }, styles.centered]}>
            { this._getMainIcon(innerSize) }
          </Animated.View>
          { this._getEditIcon(size) }
          { this._getAddIcon(size) }
        </View>
      );
    }
    else {
      return (
        <View style={[this.props.style, {width:size, height:size}]}>
          { this._getMainIcon(size) }
          { this._getEditIcon(size) }
          { this._getAddIcon(size) }
        </View>
      );
    }
  }
}