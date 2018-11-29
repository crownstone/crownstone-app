
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SliderBar", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Text,
  View
} from 'react-native';


export class SliderBar extends Component<any, any> {
  constructor(props) {
    super(props);
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
