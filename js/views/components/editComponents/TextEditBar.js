import React, {
  Component,
  TextInput,
  Text,
  View
} from 'react-native';

import { stylesIOS, colors } from '../../styles'
let styles = stylesIOS;

export class TextEditBar extends Component {
  constructor(props) {
    super();
    this.state = {value: props.value, lastEvent: 0};
    this.updateTimeout = undefined;
  }

  // avoid refresh of every view while typing
  componentWillUnmount() {
    if (this.updateTimeout)
      clearTimeout(this.updateTimeout);
    if (this.props.value !== this.state.value) {
      this.props.callback(this.state.value);
    }
  }

  // avoid refresh of every view while typing
  _updateValue(newValue) {
    this.setState({value:newValue, lastEvent:new Date().valueOf()});
    if (this.updateTimeout)
      clearTimeout(this.updateTimeout);
    this.updateTimeout = setTimeout(() => {this.props.callback(newValue)}, 300);
    this.props.setActiveElement();
  }

  render() {
    return (
      <View>
        <View style={[styles.listView, {height:this.props.barHeight}]}>
          <Text style={styles.listText}>{this.props.label}</Text>
          <TextInput
            style={{flex:1}}
            value={this.state.value}
            placeholder={this.props.placeholder}
            secureTextEntry={this.props.secure}
            onChangeText={(newValue) => {this._updateValue(newValue)}}
            keyboardType={this.props.keyboardType}
          />
          {this.props.state === 'error' ? <Icon name="ios-close" size={18} color={'#f03333'} /> : undefined}
          {this.props.state === 'valid' ? <Icon name="ios-checkmark" size={18} color={colors.green.h} /> : undefined}
        </View>
      </View>
    );
  }
}
