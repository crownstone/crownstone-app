import React, { Component } from 'react' 
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Actions } from 'react-native-router-flux';
import { IconButton } from './../components/IconButton'
import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG, clearLogs } from '../../logging/Log'
import { styles, colors, width } from './../styles'
import RNFS from 'react-native-fs'


export class SettingsDeveloper extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (this.renderState && this.renderState.user != state.user) {
        // LOG("Force Update Profile", this.renderState.user, state.user)
        this.forceUpdate();
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  
  _getItems(user) {
    const store = this.props.store;
    let items = [];

    items.push({label: "LOGGING", type: 'explanation', below: false});
    items.push({
      label:"Enable Logging",
      value: user.logging,
      type: 'switch',
      icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
      if (newValue === false) {
        clearLogs();
      }
      store.dispatch({
        type: 'SET_LOGGING',
        data: {logging: newValue}
      });
    }});
    items.push({label: "Logging will keep a history of what the app is doing for the last 3 days.", type: 'explanation', below: true});

    items.push({
      label:"Clear Logs",
      type: 'button',
      style: {color: colors.blue.hex},
      icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
      callback:(newValue) => {
        clearLogs();
        Alert.alert("Logs Cleared", undefined, [{text:'OK'}])
      }});
    items.push({label: "Clear all logs that have been stored so far.", type: 'explanation', below: true});

    items.push({
      label:"Disable Developer Mode",
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:(newValue) => {
      store.dispatch({
        type: 'SET_DEVELOPER_MODE',
        data: {developer: false}
      });
      clearLogs();
      Actions.pop();
    }});
    items.push({label: "Revert back to the normal user state.", type: 'explanation', below: true});

    return items;
  }


  requestPasswordResetEmail(email) {
    this.props.eventBus.emit('showLoading', 'Requesting password reset email...');
    CLOUD.requestPasswordResetEmail({email: email.toLowerCase()})
      .then(() => {
        Alert.alert(
          'Reset email has been sent',
          'You will now be logged out. Follow the instructions on the email and log in with your new password.',
          [{text: 'OK', onPress: () => {
            this.props.eventBus.emit('hideLoading');
            logOut();
          }}]
        )
      })
      .catch((reply) => {
        Alert.alert("Cannot Send Email", reply.data, [{text: 'OK', onPress: () => {this.props.eventBus.emit('hideLoading')}}]);
      });
  }


  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;
    this.renderState = state; // important for performance check

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView keyboardShouldPersistTaps={true}>
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
