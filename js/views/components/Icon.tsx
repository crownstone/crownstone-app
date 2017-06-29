import * as React from 'react'; import { Component } from 'react';

import Ionicon from 'react-native-vector-icons/Ionicons';
import { CustomIcon, CustomIcon2 } from '../../fonts/customIcons'
import { styles, colors} from '../styles'

import { iconCorrections } from '../../fonts/iconCorrections'

export class Icon extends Component<any, any> {
  render() {
    let offsetStyle = {};

    if (this.props.name === undefined) {
      let correction = iconCorrections.ionicons['ios-document'];
      if (correction && correction.change === true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicon {...this.props} name="ios-document" style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    let prefix = this.props.name.substr(0,3);
    if (prefix == 'c1-') {
      let correction = iconCorrections.c1[this.props.name];
      if (correction && correction.change === true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix == 'c2-') {
      let correction = iconCorrections.c2[this.props.name];
      if (correction && correction.change === true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon2 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else {
      let correction = iconCorrections.ionicons[this.props.name];
      if (correction && correction.change === true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicon {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
  }
}