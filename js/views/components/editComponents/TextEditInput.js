import React, { Component } from 'react'
import {
  
  TextInput,
} from 'react-native';

import { eventBus } from '../../../util/eventBus'

export class TextEditInput extends Component {
  constructor(props) {
    super();
    this.state = {value: props.value};
    this.refName = (Math.random() * 1e9).toString(36);
  }
  
  // this methods makes sure the internal optimization is still subject to new prop values coming from the parent class
  componentWillReceiveProps(newProps) {
    if (newProps.value !== this.state.value) {
      this.setState({value: newProps.value})
    }
  }

  // avoid refresh of every view while typing
  _updateValue(newValue) {
    this.setState({value:newValue});
  }

  focus() {
    this.refs[this.refName].measure((fx, fy, width, height, px, py) => {
      if (this.props.setActiveElement)
        this.props.setActiveElement();
      eventBus.emit("focus", py);
    })
  }

  blur() {
    this.props.callback(this.state.value);
    eventBus.emit("blur");
  }

  render() {
    return (
      <TextInput
        ref={this.refName}
        onFocus={() => this.focus()}
        style={[{flex:1}, this.props.style]}
        value={this.props.optimization === false ? this.props.value : this.state.value}
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        secureTextEntry={this.props.secureTextEntry}
        onChangeText={(newValue) => {this._updateValue(newValue)}}
        keyboardType={this.props.keyboardType}
        onSubmitEditing={this.props.onSubmitEditing ? () => {this.blur(); this.props.onSubmitEditing();} : () => {this.blur();}}
        onEndEditing={() => {this.blur();}}
      />
    );
  }
}
