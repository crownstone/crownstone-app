
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("IconCircle", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  View
} from 'react-native';

import { Icon } from './Icon';

import { styles, colors} from '../styles'

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
export class IconCircleEdit extends Component<{icon, size?, iconSize?, color?, borderColor?, outerBorderWidth?, borderWidth?, backgroundColor?, showAdd?, showEdit?, style?}, any> {
  _getEditIcon(parentSize) {
    if (this.props.showEdit === true) {
      let size = parentSize/3;

      let borderWidth = this.props.borderWidth || size / 10;


      return (
        <View style={[{
          position:'absolute', top:-0.5*size, right:-0.5*size,
          width:size,
          height:size,
          borderRadius:size,
          backgroundColor: colors.green.hex,
          borderColor: '#ffffff',
          borderWidth: borderWidth
        }, styles.centered]}>
          <Icon name={'md-create'} size={parentSize/5} color={'#ffffff'} />
        </View>
      );
    }
  }

  _getAddIcon(parentSize) {
    if (this.props.showAdd === true) {
      let size = parentSize/3;

      let borderWidth = this.props.borderWidth || size / 10;


      return (
        <View style={[{
          position:'absolute', top:-0.5*size, right:-0.5*size,
          width:size,
          height:size,
          borderRadius:size,
          backgroundColor: colors.green.hex,
          borderColor: '#ffffff',
          borderWidth: borderWidth
        }, styles.centered]}>
          <Icon name={'md-add'} size={parentSize/5} color={'#ffffff'} />
        </View>
      );
    }
  }


  _getMainIcon(size) {
    return (
      <Icon name={this.props.icon} size={this.props.iconSize || size*0.6} color={this.props.color || colors.menuBackground.hex} />
    )
  }

  render() {
    let size = this.props.size || 80;
    return (
      <View style={this.props.style}>
        { this._getMainIcon(size) }
        { this._getEditIcon(size) }
        { this._getAddIcon(size) }
      </View>
    );
  }
}