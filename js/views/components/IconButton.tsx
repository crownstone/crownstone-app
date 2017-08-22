import * as React from 'react'; import { Component } from 'react';
import { View } from 'react-native';
import { Icon } from './Icon'
import { styles, colors} from '../styles'

/**

 */
export class IconButton extends Component<any, any> {
  render() {
    return <View style={[{
      width: this.props.buttonSize || 30,
      height: this.props.buttonSize || 30,
      borderRadius: this.props.radius || (this.props.buttonSize || 30)/5,
      padding:0,
      margin:0,
      backgroundColor:'#f00'
    }, styles.centered, this.props.buttonStyle]}>
      <Icon {...this.props} />
    </View>
  }
}