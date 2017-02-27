import React, { Component } from 'react'
import { View } from 'react-native';
import { Icon } from './Icon'
import { styles, colors} from '../styles'

/**

 */
export class IconButton extends Component {
  render() {
    return <View style={[{width:30, height:30, borderRadius: this.props.radius || 6, padding:0, margin:0, backgroundColor:'#f00'}, styles.centered, this.props.buttonStyle]}>
      <Icon {...this.props} />
    </View>
  }
}