import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  Image,
  StyleSheet,
  TouchableHighlight,
  TouchableOpacity,
  Text,
  View
} from 'react-native';
let Actions = require('react-native-router-flux').Actions;

import { PictureCircle }  from '../PictureCircle'
import { styles} from '../../styles'

export class PictureEdit extends Component<any, any> {
  render() {
      return (
        <View style={{flex:1}}>
          <View style={[styles.listView, { justifyContent:'flex-start', alignItems:'center', height:this.props.barHeightLarge}]}>
            <Text style={[styles.listText,{height:this.props.barHeightLarge - 20}]}>{this.props.label}</Text>
            <PictureCircle {...this.props} />
          </View>
        </View>
      );
  }
}
