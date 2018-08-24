import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import {colors, OrangeLine} from '../../styles'
import {LOG_LEVEL} from "../../../logging/LogLevels";
import {BackAction} from "../../../util/Back";
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {IconButton} from "../../components/IconButton";
import {clearLogs} from "../../../logging/LogUtil";

export class SettingsLogging extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "Logging",
    }
  };
  unsubscribe;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.changeDeveloperData) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  _getItems() {
    let items = [];

    const store = this.props.store;
    let state = store.getState();

    items.push({
      type:'explanation',
      label:"SET LOGGING LEVELS",
    })

    let logLevelsData = {
      log_info:          { label: 'General',         explanation: ''},
      log_native:        { label: 'Native',          explanation: ''},
      log_mesh:          { label: 'Mesh',            explanation: ''},
      log_notifications: { label: 'Notifications',   explanation: ''},
      log_scheduler:     { label: 'Scheduler',       explanation: ''},
      log_ble:           { label: 'BLE',             explanation: ''},
      log_bch:           { label: 'Batch C Handler', explanation: ''},
      log_events:        { label: 'Events',          explanation: ''},
      log_store:         { label: 'Store',           explanation: ''},
      log_cloud:         { label: 'Cloud',           explanation: ''},
    };

    let logLevels = Object.keys(logLevelsData);

    let levels = {};
    levels[LOG_LEVEL.verbose] = "verbose";
    levels[LOG_LEVEL.debug] = "debug";
    levels[LOG_LEVEL.info] = "info";
    levels[LOG_LEVEL.warning] = "warning";
    levels[LOG_LEVEL.error] = "error";
    levels[LOG_LEVEL.none] = "none";

    let values = [
      {label: 'disabled', value: LOG_LEVEL.none},
      {label: 'error',    value: LOG_LEVEL.error},
      {label: 'warning',  value: LOG_LEVEL.warning},
      {label: 'info',     value: LOG_LEVEL.info},
      {label: 'debug',    value: LOG_LEVEL.debug},
      {label: 'verbose',  value: LOG_LEVEL.verbose},
    ]

    logLevels.forEach((level) => {
      items.push({
        type: 'dropdown',
        label: logLevelsData[level].label,
        labelStyle: { paddingLeft: 15 },
        dropdownHeight: 130,
        valueRight: true,
        buttons: true,
        valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
        value: state.development[level],
        valueLabel: levels[state.development[level]],
        items: values,
        callback: (newValue) => {
          let data = {};
          data[level] = newValue;
          this.props.store.dispatch({type: "DEFINE_LOGGING_DETAILS", data: data})
        }
      })
    })


    items.push({
      type:'explanation',
      label:"NATIVE EXTENDED LOGGING",
    });

    items.push({
      label: "Native Extended Logging",
      value: state.development.nativeExtendedLogging,
      type: 'switch',
      icon: <IconButton name="ios-create" size={22} button={true} color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
      callback: (newValue) => {
        store.dispatch({
          type: 'DEFINE_LOGGING_DETAILS',
          data: {nativeExtendedLogging: newValue}
        });

        Bluenet.enableExtendedLogging(newValue);
      }
    });
    items.push({
      type:'explanation',
      label:"Basic native logging is already enabled when logging is enabled in the developer menu.",
      below:true,
    });

    items.push({
      type:'explanation',
      label:"DISABLE LOGGING",
      alreadyPadded: true
    });

    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({
      label:"Disable Logging",
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'SET_LOGGING',
          data: {logging_enabled: false}
        });

        clearAllLogs();
        Bluenet.enableLoggingToFile(false);

        BackAction();
      }
    });

    items.push({ type:'spacer' });
    items.push({ type:'spacer' });
    items.push({ type:'spacer' });

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <OrangeLine/>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
