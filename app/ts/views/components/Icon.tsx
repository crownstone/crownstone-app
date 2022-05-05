import * as React from 'react';
import { Component } from 'react';

import EvilIcons from 'react-native-vector-icons/dist/EvilIcons';
import Entypo from 'react-native-vector-icons/dist/Entypo';
import FontAwesome5 from 'react-native-vector-icons/dist/FontAwesome5';
import Ionicons  from 'react-native-vector-icons/dist/Ionicons';
import {CustomIcon, CustomIcon2, CustomIcon3} from '../../fonts/customIcons'

import { iconCorrections } from '../../fonts/iconCorrections'
import { Ionicons3 } from "../../fonts/ionicons3";
import { FlatIconCustom1, FlatIconEssentials, FlatIconHousehold } from "../../fonts/customIcons_flaticon";

export class Icon extends Component<any, any> {
  render() {
    let offsetStyle = {};

    // guard against missing icon names
    if (!this.props.name || typeof this.props.name !== 'string') {
      return <Ionicons3 {...this.props} name="ios-leaf" style={[{backgroundColor:'transparent'}, this.props.style]} />;
    }


    let prefix3 = this.props.name.substr(0,3);
    let prefix4 = this.props.name.substr(0,4);
    let prefix5 = this.props.name.substr(0,5);

    if (this.props.name === undefined) {
      let correction = iconCorrections.ionicons['ios-document'];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicons3 {...this.props} name="ios-document" style={[{backgroundColor:'transparent'}, this.props.style]} />
    }
    if (prefix3 == 'c1-') {
      let correction = iconCorrections.c1[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix3 == 'c2-') {
      let correction = iconCorrections.c2[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon2 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix3 == 'c3-') {
      let correction = iconCorrections.c3[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <CustomIcon3 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix3 == 'ei-') {
      let correction = iconCorrections.evilIcons[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      let correctedName = this.props.name.substr(3);
      return <EvilIcons {...this.props} name={correctedName} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix5 == 'fiCS1') {
      let correction = iconCorrections.fiCS1[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      return <FlatIconCustom1 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix4 == 'fiHS') {
      let correction = iconCorrections.fiHS[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      return <FlatIconHousehold {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix3 == 'fiE') {
      let correction = iconCorrections.fiE[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      return <FlatIconEssentials {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix5 == 'ion5-') {
      let correction = iconCorrections.ionicons5[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      let correctedName = this.props.name.substr(5);
      return <Ionicons {...this.props} name={correctedName} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix5 == 'enty-') {
      let correction = iconCorrections.entypo[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      let correctedName = this.props.name.substr(5);
      return <Entypo {...this.props} name={correctedName} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else if (prefix4 == 'fa5-') {
      let correction = iconCorrections.fontAwesome5[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }

      let correctedName = this.props.name.substr(4);
      return <FontAwesome5 {...this.props} name={correctedName} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
    else {
      let correction = iconCorrections.ionicons[this.props.name];
      if (correction && correction.change === true && this.props.ignoreCorrection !== true) {
        offsetStyle = {position:'relative', top: this.props.size*correction.top, left: this.props.size*correction.left}
      }
      return <Ionicons3 {...this.props} style={[{backgroundColor:'transparent'}, offsetStyle, this.props.style]} />
    }
  }
}
