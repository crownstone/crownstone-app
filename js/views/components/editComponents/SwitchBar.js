import React, {
  Component,
  Switch,
  Text,
  View
} from 'react-native';

import { stylesIOS, colors } from '../../styles'
let styles = stylesIOS;

export class SwitchBar extends Component {
  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight}]}>
        <Text style={styles.listTextLarge}>{this.props.label}</Text>
        <View style={{flex:1}} />
        <Switch
          value={this.props.value}
          onValueChange={(newValue) => {this.props.setActiveElement(); this.props.callback(newValue)}}
        />
      </View>
    );
  }
}
