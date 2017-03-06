import * as React from 'react'; import { Component } from 'react';

import Ionicon from 'react-native-vector-icons/Ionicons';
import { CustomIcon, CustomIcon2 } from '../../fonts/customIcons'
import { styles, colors} from '../styles'

export class Icon extends Component<any, any> {
  render() {
    let x = undefined;
    if (this.props.name === undefined) {
      x =  <Ionicon {...this.props} name="ios-document" style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    let prefix = this.props.name.substr(0,3);
    if (prefix == 'c1-') {
      x =  <CustomIcon {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    else if (prefix == 'c2-') {
      x =  <CustomIcon2 {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    else {
      x =  <Ionicon {...this.props} style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    return x
  }
}