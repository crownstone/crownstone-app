import React, {
  Component,
  TextInput,
} from 'react-native';


export class TextEditInput extends Component {
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
    if (this.props.setActiveElement)
      this.props.setActiveElement();
  }

  render() {
    return (
      <TextInput
        style={[{flex:1}, this.props.style]}
        value={this.state.value}
        placeholder={this.props.placeholder}
        secureTextEntry={this.props.secureTextEntry}
        onChangeText={(newValue) => {this._updateValue(newValue)}}
        keyboardType={this.props.keyboardType}
      />
    );
  }
}
