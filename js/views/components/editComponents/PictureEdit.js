import React, { Component } from 'react'
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
import { styles, colors} from '../../styles'

export class PictureEdit extends Component {
  render() {
      return (
        <View style={{flex:1}}>
          <View style={[styles.listView, {paddingTop:10, alignItems:'flex-start', height:this.props.barHeightLarge}]}>
            <Text style={styles.listText}>{this.props.label}</Text>
            <PictureCircle {...this.props} />
          </View>
        </View>
      );
  }
}
