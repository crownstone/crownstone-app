import React, { Component } from 'react' 
import {
  
  Dimensions,
  View
} from 'react-native';

import { styles, colors } from '../styles'


export class Separator extends Component {
  render() {
    let width = Dimensions.get('window').width;
    if (this.props.fullLength === true)
      return <View style={styles.separator} key={this.props.key}/>
    else {
      return (
        <View style={{backgroundColor:'#ffffff'}} key={this.props.key}>
          <View style={[styles.separator, {width:width-15, alignSelf:'flex-end'}]}/>
        </View>
      );
    }
  }
}
