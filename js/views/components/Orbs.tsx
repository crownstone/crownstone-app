import { Languages } from "../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  Text,
  View,
  StyleSheet,
} from 'react-native';

import { colors , screenWidth } from './../styles'

let radius = 8; // make sure this is not an odd number

export class Orbs extends Component<any, any> {
  unsubscribe : any;

  constructor(props) {
    super(props);
    this.state = {};
    this.unsubscribe = [];
  }


  componentWillUnmount() {
    this.unsubscribe.forEach((callback) => {callback()});
    this.unsubscribe = [];
  }

  getOrbs() {
    let orbs = [];
    for (let i = 0; i < this.props.amount; i++) {
      if (this.props.active == i) {
        orbs.push(<View key={"orb_" + i} style={orbStyle.selectedOrb} />);
      }
      else {
        orbs.push(<View key={"orb_" + i} style={orbStyle.orb}/>);
      }
    }

    return orbs;
  }

  render() {
    if (this.props.amount > 1) {
      return (
        <View style={{position: 'absolute', bottom: 5, flexDirection: 'row', width: screenWidth}}>
          <View style={{flex: 1}}/>
          {this.getOrbs()}
          <View style={{flex: 1}}/>
        </View>
      );
    }
    else {
      return <View />
    }
  }
}


const orbStyle = StyleSheet.create({
  selectedOrb:{
    width: radius,
    height: radius,
    borderRadius: 0.5 * radius,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth:1,
    borderColor:'rgba(' + colors.blue.rgb.r + ',' +colors.blue.rgb.g + ',' + colors.blue.rgb.b + ',0.5)',
    margin:2,
  },
  orb: {
    width: radius,
    height: radius,
    borderRadius: 0.5 * radius,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth:1,
    borderColor:'rgba(' + colors.blue.rgb.r + ',' +colors.blue.rgb.g + ',' + colors.blue.rgb.b + ',0.2)',
    margin:2,
  }
});
