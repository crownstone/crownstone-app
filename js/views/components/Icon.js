import React, { Component } from 'react'

var Ionicon = require('react-native-vector-icons/Ionicons');
import { CustomIcon } from '../../fonts/customIcons'
import { styles, colors} from '../styles'

/**

 */
export class Icon extends Component {
  render() {
    if (this.props.name === undefined) {
      return <CustomIcon {...this.props} name="c1-Crownstone"/>
      /*return <Ionicon {...this.props} name="ios-document" />*/
    }

    if (this.props.name.substr(0,3) == 'c1-') {
      return <CustomIcon {...this.props} />
    }
    else {
      return <Ionicon {...this.props} />
    }
  }
}