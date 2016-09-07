import React, { Component } from 'react'
import {
  TextInput,
  Text,
  View
} from 'react-native';
import { Icon } from '../Icon';
import { styles, colors } from '../../styles'
import { TextEditInput } from './TextEditInput'
import { Separator } from '../Separator'
import { emailChecker, characterChecker, numberChecker } from '../../../util/util'

export class TextEditBar extends Component {
  constructor() {
    super();
    this.state = {validation: undefined};

    this.verificationContent = '';
    this.refName = (Math.random() * 1e9).toString(36);
    this.refNameVerification = (Math.random() * 1e9).toString(36);
  }

  // the alwaysShowState prop forces the validationState to be checked and updated
  componentWillReceiveProps(newProps) {
    if (newProps.alwaysShowState === true && this.state.validation === undefined) {
      // we set the timeout to ensure it has been drawn once. It needs to be rendered for the refs to work.
      setTimeout(() => {
        if (newProps.validation !== undefined) {
          this.validate(this.refs[this.refName].state.value)
        }
      }, 10);
    }
  }

  validateCustom(value, customRules = this.props.validation) {
    // check length
    if (customRules.minLength  !== undefined && value.length < customRules.minLength)
      return 'errorTooShort';
    if (customRules.maxLength  !== undefined && value.length > customRules.maxLength)
      return 'errorTooLong';

    // check content
    if (customRules.numbers    !== undefined && customRules.numbers.allowed === false && numberChecker(value) === true)
      return 'errorNumber';
    if (customRules.numbers    !== undefined && customRules.numbers.mandatory === true && numberChecker(value) === false)
      return 'errorNoNumber';
    if (customRules.characters !== undefined && customRules.characters.allowed === false && characterChecker(value) === true)
      return 'errorCharacter';
    if (customRules.characters !== undefined && customRules.characters.mandatory === true && characterChecker(value) === false)
      return 'errorNoCharacter';

    // check if the verification matches the
    if (this.props.verification === true && this.verificationContent !== this.refs[this.refName].state.value)
      return 'errorNoMatch';

    return 'valid'
  }

  validateInput(value) {
    switch(this.props.validation) {
      case 'email':
        return emailChecker(value) ? 'valid' : 'errorInvalid';
      case 'password':
        return this.validateCustom(value, {minLength: 1});
      default:
        if (typeof this.props.validation === 'object') {
           return this.validateCustom(value)
        }
        return 'valid'
    }
  }

  validate(value) {
    // copy the content of the validation textarea to this.verificationContent to ensure it is persisted across redraws.
    if (this.props.verification)
      this.verificationContent = this.refs[this.refNameVerification].state.value;

    // if we need to do validation, validate the input.
    if (this.props.validation !== undefined || this.props.verification) {
      let result = this.validateInput(value);
      this.setState({validation:result});
      if (this.props.validationCallback) {
        this.props.validationCallback(result);
      }
    }
  }

  getValidationIcons() {
    if (this.props.validationMethod === 'icons') {
      if (this.state.validation === 'valid')
        return <Icon name="ios-checkmark-circle" size={18} color={colors.green.hex} style={{paddingLeft:3}}/>
      else if (this.state.validation === undefined)
        return undefined;
      else // we can have many different types of errors
        return <Icon name="ios-close-circle" size={18} color={'#f03333'} style={{paddingLeft:3}}/>;
    }
    return undefined;
  }

  getTextBlock(verification) {
    return (
        <View style={[styles.listView, {height:this.props.barHeight}]}>
          <Text style={styles.listText}>{this.props.label}</Text>
          <TextEditInput
            ref={verification ? this.refNameVerification : this.refName}
            __validate={(value) => {this.validate(value)}}
            {...this.props}
            placeholder={verification ? 'Verification' : this.props.placeholder || this.props.label}
            value={verification ? this.verificationContent : this.props.value}
          />
          {this.getValidationIcons()}
        </View>
    );
  }

  render() {
    if (this.props.verification === true) {
      return <View>{this.getTextBlock(false)}<Separator />{this.getTextBlock(true)}</View>;
    }
    else {
      return this.getTextBlock();
    }

  }
}
