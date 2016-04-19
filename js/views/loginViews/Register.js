import React, {
  Alert,
  Component,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { TopBar } from './../components/Topbar'
import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { EditSpacer } from './../components/editComponents/EditSpacer'
var Actions = require('react-native-router-flux').Actions;
import { stylesIOS, colors } from './../styles'
let styles = stylesIOS;

export class Register extends Component {
  constructor() {
    super();
    this.state = {
      email:{value:'', state:''},
      password:{value:'', state:''},
      passwordVerification:{value:'', state:''},
      firstName:{value:'', state:''},
      lastName:{value:'', state:''},
      picture: undefined
    };
  }

  _getItems() {
    let getEmailState = (email) => {
      return 'valid';
    };
    let getPasswordState = (password,index) => {
      return 'valid';
    };
    let getNameState = (name) => {
      return 'valid';
    };

    return [
      {
        label: 'ACCOUNT INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'Email',
        type: 'textEdit',
        keyboardType: 'email-address',
        value: this.state.firstName.value,
        state: this.state.firstName.state,
        callback: (newValue) => {this.setState({firstName: {value:newValue, state: getEmailState(newValue)}})}
      },
      {
        label: 'Password',
        type: 'textEdit',
        secure: true,
        value: this.state.password.value,
        state: this.state.password.state,
        callback: (newValue) => {this.setState({value:newValue, state: getPasswordState(newValue,1)})}
      },
      {
        label: 'Password',
        type: 'textEdit',
        secure: true,
        placeholder: 'Verification',
        value: this.state.passwordVerification.value,
        state: this.state.passwordVerification.state,
        callback: (newValue) => {this.setState({value:newValue, state: getPasswordState(newValue,2)})}
      },
      {
        label: 'Your password must be at least 8 characters long, one of which being a number.',
        style: {paddingBottom: 0},
        type: 'explanation',
        below: true
      },
      {
        label: 'PROFILE INFORMATION', type: 'explanation', below: false
      },
      {
        label: 'First Name',
        type: 'textEdit',
        value: this.state.firstName.value,
        state: this.state.firstName.state,
        callback: (newValue) => {this.setState({value:newValue, state: getNameState(newValue)})}
      },
      {
        label: 'Last Name',
        type: 'textEdit',
        placeholder: 'Optional',
        value: this.state.lastName.value,
        state: this.state.lastName.state,
        callback: (newValue) => {this.setState({value:newValue, state: getNameState(newValue)})}
      },
      {
        label: 'Picture',
        type: 'picture', value: this.state.picture,
        callback: (newValue) => {}
      },
      {
        label: 'Your picture is used so other people can see your face when you\'re in a room.',
        type: 'explanation',
        below: true
      },
      {
        label: 'Next',
        type: 'button',
        style: {color:colors.blue.h},
        callback: this.validateAndContinue.bind(this)
      },
      {
        label: 'By tapping Next, you agree to be awesome.',
        type: 'explanation',
        below: true
      },
    ]
  }

  validateAndContinue() {
    Actions.registerConclusion({type:'reset', email:this.state.email.value})
  }

  render() {
    return (
      <Background hideTabBar={true}>
        <ScrollView>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
