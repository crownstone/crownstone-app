import * as React from 'react';
import { View } from 'react-native';
import { Component } from 'react';

import Ionicon from 'react-native-vector-icons/dist/Ionicons';
import EvilIcons from 'react-native-vector-icons/dist/EvilIcons';
import {CustomIcon, CustomIcon2, CustomIcon3} from '../../fonts/customIcons'

import { iconCorrections } from '../../fonts/iconCorrections'

export class Icon extends Component<any, any> {
  render() {
    let offsetStyle = {};

    // guard against missing icon names
    if (!this.props.name) {
      return <Ionicon {...this.props} name="ios-leaf" style={[{backgroundColor:'transparent'}, this.props.style]} />;
    }

    let prefix = this.props.name.substr(0,3);



    if (this.props.name === undefined) {
      let correction = iconCorrections.ionicons['ios-document'];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicon {...this.props} name="ios-document" style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    if (prefix == 'c1-') {
      let correction = iconCorrections.c1[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix == 'c2-') {
      let correction = iconCorrections.c2[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon2 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix == 'c3-') {
      let correction = iconCorrections.c3[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon3 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix == 'ei-') {
      let correction = iconCorrections.evilIcons[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      let correctedName = this.props.name.substr(3);
      return <EvilIcons {...this.props} name={correctedName} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else {
      let correction = iconCorrections.ionicons[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicon {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
  }
}