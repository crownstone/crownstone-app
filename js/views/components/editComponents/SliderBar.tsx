import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';

import { styles, colors } from '../../styles'


export class SliderBar extends Component<any, any> {
  constructor() {
    super();
  }

  render() {
    // return (
    //   <View style={[styles.listView, {height:this.props.barHeight}]}>
    //     {this.props.label !== undefined ? <View><Text style={styles.listText}>{this.props.label}</Text></View> : undefined}
    //     <View style={{
    //       flex: 1,
    //       marginLeft: 10,
    //       marginRight: 10,
    //       alignItems: 'stretch',
    //       justifyContent: 'center',
    //     }} >
    //       <Slider
    //         value={this.props.value}
    //         onSlidingComplete={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
    //       />
    //     </View>
    //   </View>
    // );
    return <View />
  }
}
