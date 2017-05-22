import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Actions } from 'react-native-router-flux';
import { IconButton } from '../components/IconButton'
import { Background } from '../components/Background'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG, clearLogs } from '../../logging/Log'
import { styles, colors } from '../styles'
const RNFS = require('react-native-fs');


export class SettingsDeveloper extends Component<any, any> {
  unsubscribe : any;
  renderState : any;

  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (this.renderState && this.renderState.user != state.user) {
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
    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({label: "LOGGING", type: 'explanation', below: false});
    items.push({
      label:"Enable Logging",
      value: user.logging,
      type: 'switch',
      icon: <IconButton name="ios-bug" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.green2.hex}} />,
      callback:(newValue) => {
      if (newValue === false) {
        clearAllLogs();
      }
      store.dispatch({
        type: 'SET_LOGGING',
        data: {logging: newValue}
      });
      Bluenet.enableLoggingToFile(newValue);
    }});
    items.push({label: "Logging will keep a history of what the app is doing for the last 3 days.", type: 'explanation', below: true});

    items.push({
      label:"Clear Logs",
      type: 'button',
      style: {color: colors.blue.hex},
      icon: <IconButton name="ios-cut" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
      callback:(newValue) => {
        clearAllLogs();
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

        clearAllLogs();
        Bluenet.enableLoggingToFile(false);

        Actions.pop();
    }});
    items.push({label: "Revert back to the normal user state.", type: 'explanation', below: true});

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let user = state.user;
    this.renderState = state; // important for performance check

    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems(user)} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
