import { Languages } from "../../../Languages"
import * as React from 'react'; import { Component } from 'react';
import {
  TextInput,
  Text,
  View
} from 'react-native';
import {styles, screenWidth} from '../../styles'
import { TextEditInput } from './TextEditInput'

export class TextBlob extends Component<any, any> {
  refName : string;

  constructor(props) {
    super(props);
    this.state = {validation: undefined};
    this.refName = (Math.random() * 1e9).toString(36);
  }

  componentDidMount() {
    // setTimeout(() => {
    //   (this.refs[this.refName] as any).focus()
    // },400);
  }

  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight, paddingTop:5}]}>
        <TextEditInput
          submitOnEnter={true}
          blurOnSubmit={true}
          autoFocus={true}
          ref={this.refName}
          {...this.props}
          autoCorrect={true}
          returnKeyType={"done"}
          autoCapitalize={'sentences'}
          multiline={true}
          maxLength={this.props.maxLength}
          style={{width:screenWidth, height:this.props.barHeight - 10}}
          placeholder={this.props.placeholder || this.props.label}
          value={this.props.value}
        />
      </View>
    );

  }
}
