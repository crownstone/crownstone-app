import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  Image,
  PixelRatio,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { Icon } from './Icon';

import { styles, colors} from '../styles'

/**
 * props: {
 *   icon            : String   // icon name (ionicons only without the ion- prefix)
 *   size            : Number   // size of the iconCircle
 *   color           : String   // change the color of the icon, default menu dark blue
 *   borderColor     : String   // change the color of the background, default same as icon
 *   backgroundColor : String   // change the color of the background, default white
 *   showAdd         : Bool     // show an add icon in the corner
 *   showEdit        : Bool     // show an edit icon in the corner
 * }
 */
export class IconCircle extends Component<any, any> {
  render() {
    let size = this.props.size || 60;
    return (
      <View style={{width:size, height:size}}>
        <View style={[{
          width:size,
          height:size,
          borderRadius:size * 0.5,
          backgroundColor: this.props.backgroundColor || '#ffffff',
          borderColor: this.props.borderColor || this.props.color || colors.menuBackground.hex,
          borderWidth: 2
          }, styles.centered]}>
          <Icon name={this.props.icon} size={size*0.6} color={this.props.color || colors.menuBackground.hex} />
        </View>
        {this.props.showEdit === true ?
          <View style={[{
            marginTop:-size,
            marginLeft:size*2/3,
            width:size/3,
            height:size/3,
            borderRadius:size/6,
            backgroundColor: colors.green.hex,
            borderColor: '#ffffff',
            borderWidth: 2
          }, styles.centered]}>
            <Icon name={'md-create'} size={size/5} color={'#ffffff'} />
          </View> : undefined}
        {this.props.showAdd === true ?
          <View style={[{
            marginTop:-size,
            marginLeft:size*2/3,
            width:size/3,
            height:size/3,
            borderRadius:size/6,
            backgroundColor: colors.green.hex,
            borderColor: '#ffffff',
            borderWidth: 2
          }, styles.centered]}>
            <Icon name={'md-add'} size={size/5} color={'#ffffff'} />
          </View> : undefined}
      </View>
    );
  }
}