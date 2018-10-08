import { Languages } from "../../../Languages"
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
      title: Languages.title("SettingsLogging", "Logging")(),
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
      label: Languages.label("SettingsLogging", "SET_LOGGING_LEVELS")(),
    })

    let logLevelsData = {
      log_info:          { label: Languages.label("SettingsLogging", "General")(),         explanation: ''},
      log_native:        { label: Languages.label("SettingsLogging", "Native")(),          explanation: ''},
      log_mesh:          { label: Languages.label("SettingsLogging", "Mesh")(),            explanation: ''},
      log_notifications: { label: Languages.label("SettingsLogging", "Notifications")(),   explanation: ''},
      log_scheduler:     { label: Languages.label("SettingsLogging", "Scheduler")(),       explanation: ''},
      log_ble:           { label: Languages.label("SettingsLogging", "BLE")(),             explanation: ''},
      log_bch:           { label: Languages.label("SettingsLogging", "Batch_C_Handler")(), explanation: ''},
      log_events:        { label: Languages.label("SettingsLogging", "Events")(),          explanation: ''},
      log_store:         { label: Languages.label("SettingsLogging", "Store")(),           explanation: ''},
      log_cloud:         { label: Languages.label("SettingsLogging", "Cloud")(),           explanation: ''},
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
      {label: Languages.label("SettingsLogging", "disabled")(), value: LOG_LEVEL.none},
      {label: Languages.label("SettingsLogging", "error")(),    value: LOG_LEVEL.error},
      {label: Languages.label("SettingsLogging", "warning")(),  value: LOG_LEVEL.warning},
      {label: Languages.label("SettingsLogging", "info")(),     value: LOG_LEVEL.info},
      {label: Languages.label("SettingsLogging", "debug")(),    value: LOG_LEVEL.debug},
      {label: Languages.label("SettingsLogging", "verbose")(),  value: LOG_LEVEL.verbose},
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
      label: Languages.label("SettingsLogging", "NATIVE_EXTENDED_LOGGING")(),
    });

    items.push({
      label: Languages.label("SettingsLogging", "Native_Extended_Logging")(),
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
      label: Languages.label("SettingsLogging", "Basic_native_logging_is_a")(),
      below:true,
    });

    items.push({
      type:'explanation',
      label: Languages.label("SettingsLogging", "DISABLE_LOGGING")(),
      alreadyPadded: true
    });

    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({
      label: Languages.label("SettingsLogging", "Disable_Logging")(),
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
