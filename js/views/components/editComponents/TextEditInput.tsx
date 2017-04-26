import * as React from 'react'; import { Component } from 'react';
import {
  Keyboard,
  TextInput,
} from 'react-native';

import { eventBus } from '../../../util/EventBus'

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
    this.unsubscribe = eventBus.on("inputComplete", () => { this.blur(); })
  }

  componentWillUnmount() {
    if (this.isInFocus === true) {
      this.blur();
    }
    this.unsubscribe();
    this.blurListener.remove();
  }

  componentDidMount() { }

  focus() {
    this.isInFocus = true;
    this.blurred = false;
    (this.refs[this.refName] as any).measure((fx, fy, width, height, px, py) => {
      eventBus.emit("focus", py);
    })
  }

  blur() {
    if (this.blurred === false) {
      this.blurred = true;
      this.isInFocus = false;
      if (this.props.__validate) {
        this.props.__validate(this.props.optimization !== true ? this.props.value : this.state.value);
      }
      if (this.props.optimization === true) {
        this.props.callback(this.state.value);
      }
      eventBus.emit('blur');
    }
  }

  render() {
    return (
      <TextInput
        ref={this.refName}
        autoCorrect={this.props.autoCorrect || false}
        onFocus={() => {this.focus();}}
        style={[{flex:1, position:'relative', top:1}, this.props.style]}
        autoCapitalize={this.props.secureTextEntry ? undefined : this.props.autoCapitalize || 'words'}
        value={this.props.optimization !== true ? this.props.value : this.state.value}
        placeholder={this.props.placeholder || this.props.label}
        placeholderTextColor={this.props.placeholderTextColor}
        secureTextEntry={this.props.secureTextEntry}
        onChangeText={(newValue) => {
          if (this.props.optimization !== true) {
            this.props.callback(newValue);
          }
          else {
            this.setState({value: newValue});
          }
        }}
        keyboardType={ this.props.keyboardType || 'default'}
        onEndEditing={() => {
          this.blur();
        }}
      />
    );
  }
}
