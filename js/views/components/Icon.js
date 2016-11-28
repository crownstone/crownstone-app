import React, { Component } from 'react'

const Ionicon = require('react-native-vector-icons/Ionicons');
import { CustomIcon,CustomIcon2 } from '../../fonts/customIcons'
import { styles, colors} from '../styles'

/**

 */
export class Icon extends Component {
  render() {
    if (this.props.name === undefined) {
      {/*return <CustomIcon {...this.props} name="c1-Crownstone"/>*/}
      return <Ionicon {...this.props} name="ios-document" style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    let prefix = this.props.name.substr(0,3);
    if (prefix == 'c1-') {
      return <CustomIcon {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    else if (prefix == 'c2-') {
      return <CustomIcon2 {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    else {
      return <Ionicon {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
  }
}