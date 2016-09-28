import React, { Component } from 'react'
import {
  
  TextInput,
} from 'react-native';

import { eventBus } from '../../../util/eventBus'

export class TextEditInput extends Component {
  constructor(props) {
    super();
    this.state = {value: props.value};
    this.blurred = false;
    this.isInFocus = false;
    this.refName = (Math.random() * 1e9).toString(36);
  }
  
  componentWillReceiveProps(newProps) {
    if (newProps.value !== this.state.value) {
      this.setState({value: newProps.value})
    }
  }

  componentWillUnmount() {
    if (this.isInFocus === true) {
      this.blur();
    }
    this.unsubscribe();
  }

  componentDidMount() {
    if (this.props.textFieldRegistration) {
      this.props.textFieldRegistration(this.refName, this.refs[this.refName]);
    }
    this.unsubscribe = eventBus.on("blurAll", () => { console.log("CALLING VLUR"); this.blur();})
  }

  focus() {
    if (this.props.currentFocus) {
      this.props.currentFocus(this.refName);
    }

    this.isInFocus = true;
    this.blurred = false;
    this.refs[this.refName].measure((fx, fy, width, height, px, py) => {
      if (this.props.setActiveElement)
        this.props.setActiveElement();
      eventBus.emit("focus", py);
    })
  }

  blur() {
    if (this.blurred === false) {
      this.isInFocus = false;
      this.blurred = true;
      if (this.props.__validate) {
        this.props.__validate(this.state.value);
      }
      this.props.callback(this.state.value);

      eventBus.emit("blur");
    }
  }

  render() {
    return (
      <TextInput
        ref={this.refName}
        autoCorrect={this.props.autoCorrect || false}
        onFocus={this.props.onFocus ? () => {this.focus(); this.props.onFocus();} : () => {this.focus();}}
        style={[{flex:1, position:'relative', top:1}, this.props.style]}
        autoCapitalize={this.props.autoCapitalize || 'words'}
        value={this.props.optimization === false ? this.props.value : this.state.value}
        placeholder={this.props.placeholder}
        placeholderTextColor={this.props.placeholderTextColor}
        secureTextEntry={this.props.secureTextEntry}
        onChangeText={(newValue) => {this.setState({value:newValue})}}
        keyboardType={this.props.keyboardType}
        onEndEditing={() => {this.blur();}}
        onSubmitEditing={() => {this.blur(); if (this.props.nextFunction) { this.props.nextFunction(); }}}
      />
    );
  }
}
