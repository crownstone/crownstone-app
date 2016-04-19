import React, {
  Component,
  TouchableHighlight,
  Text,
  View
} from 'react-native';

var Icon = require('react-native-vector-icons/Ionicons');
import { stylesIOS, colors } from '../../styles'
let styles = stylesIOS;

export class CheckBar extends Component {
  render() {
    return (
      <TouchableHighlight onPress={() => {this.props.setActiveElement(); this.props.callback()}}>
        <View style={[styles.listView, {height:this.props.barHeight}]}>
          <Text style={styles.listTextLarge}>{this.props.label}</Text>
          <View style={{flex:1}} />
          {
            this.props.value === true ?
              <View style={{paddingTop:3}}>
                <Icon name="ios-checkmark-empty" size={30} color={colors.iosBlue.h} />
              </View>
              : undefined
          }
        </View>
      </TouchableHighlight>
    );
  }
}
