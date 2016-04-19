import React, {
  Component,
  Text,
  View
} from 'react-native';

import Slider               from 'react-native-slider'
import { stylesIOS, colors } from '../../styles'
let styles = stylesIOS;

export class SliderBar extends Component {
  constructor() {
    super();
  }

  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight}]}>
        {this.props.label !== undefined ? <View><Text style={styles.listText}>{this.props.label}</Text></View> : undefined}
        <View style={{
          flex: 1,
          marginLeft: 10,
          marginRight: 10,
          alignItems: 'stretch',
          justifyContent: 'center',
        }} >
          <Slider
            value={this.props.value}
            onSlidingComplete={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
          />
        </View>
      </View>
    );
  }
}
