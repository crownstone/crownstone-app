import React, {
  Component,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

import { stylesIOS, colors } from '../../styles'
let styles = stylesIOS;

export class ButtonBar extends Component {
  render() {
    return (
      <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height:this.props.barHeight}]}>
          <Text style={[styles.listTextLarge, {color:'#e00'}, this.props.style]}>{this.props.label}</Text>
        </View>
      </TouchableHighlight>
    );
  }
}
