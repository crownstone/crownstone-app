import * as React from 'react'; import { Component } from 'react';
import {
  TextInput,
  Text,
  View
} from 'react-native';
import { Icon } from '../Icon';
import { styles, colors } from '../../styles'
import { TextEditInput } from './TextEditInput'
import { emailChecker, characterChecker, numberChecker } from '../../../util/Util'

export class TextBlob extends Component<any, any> {
  refName : string;
  refNameVerification : string;

  constructor() {
    super();
    this.state = {validation: undefined};

    this.refName = (Math.random() * 1e9).toString(36);
    this.refNameVerification = (Math.random() * 1e9).toString(36);
  }

  // the alwaysShowState prop forces the validationState to be checked and updated
  componentWillReceiveProps(newProps) {
    if (newProps.alwaysShowState === true && this.state.validation === undefined) {
      // we set the timeout to ensure it has been drawn once. It needs to be rendered for the refs to work.
    }
  }

  render() {
    return (
      <View style={[styles.listView, {height:this.props.barHeight}]}>
        <Text style={styles.listText}>{this.props.label}</Text>
        <TextEditInput
          ref={this.refName}
          {...this.props}
          autoCorrect={true}

          placeholder={this.props.placeholder || this.props.label}
          value={this.props.value}
        />
      </View>
    );

  }
}
