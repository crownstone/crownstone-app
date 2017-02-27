import { Component } from 'react'
import {
  Keyboard,
  TextInput,
} from 'react-native';

import { eventBus } from '../../../util/eventBus'

export class TextEditInput extends Component<any, any> {

  blurred : boolean;
  isInFocus : boolean;
  refName : string;
  blurListener : any;
  unsubscribe : any;


  constructor(props) {
    super();
    this.state = {value: props.value};
    this.blurred = false;
    this.isInFocus = false;
    this.refName = (Math.random() * 1e9).toString(36);

    // make sure we submit the data if the keyboard is hidden.
    this.blurListener = Keyboard.addListener('keyboardDidHide', () => { this.blur();  });
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
    this.blurListener.remove();
  }

  componentDidMount() {
    if (this.props.textFieldRegistration) {
      this.props.textFieldRegistration(this.refName, this.refs[this.refName]);
    }
    this.unsubscribe = eventBus.on("blurAll", () => { this.blur();})
  }

  focus() {
    if (this.props.currentFocus) {
      this.props.currentFocus(this.refName);
    }

    this.isInFocus = true;
    this.blurred = false;
    (this.refs[this.refName] as any).measure((fx, fy, width, height, px, py) => {
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
        autoCapitalize={this.props.secureTextEntry ? undefined : this.props.autoCapitalize || 'words'}
        value={this.props.optimization === false ? this.props.value : this.state.value}
        placeholder={this.props.placeholder || this.props.label}
        placeholderTextColor={this.props.placeholderTextColor}
        secureTextEntry={this.props.secureTextEntry}
        onChangeText={(newValue) => {this.setState({value:newValue})}}
        keyboardType={this.props.keyboardType || 'default'}
        onEndEditing={() => {this.blur();}}
        onSubmitEditing={() => {this.blur(); if (this.props.nextFunction) { this.props.nextFunction(); }}}
      />
    );
  }
}
