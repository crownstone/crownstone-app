import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsLogging", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import {colors, } from '../../styles'
import {LOG_LEVEL} from "../../../logging/LogLevels";
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {IconButton} from "../../components/IconButton";
import {clearLogs} from "../../../logging/LogUtil";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";

export class SettingsLogging extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Logging")});
  }


  unsubscribe;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
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

    const store = core.store;
    let state = store.getState();

    items.push({
      type:'explanation',
      label: lang("SET_LOGGING_LEVELS"),
    });

    let logLevelsData = {
      log_info:           { label: lang("General"),         explanation: ''},
      log_promiseManager: { label: lang("PromiseManager"),  explanation: ''},
      log_native:         { label: lang("Native"),          explanation: ''},
      log_nav:            { label: lang("Navigation"),      explanation: ''},
      log_behaviour:      { label: lang("Behaviour"),       explanation: ''},
      log_mesh:           { label: lang("Mesh"),            explanation: ''},
      log_broadcast:      { label: lang("Broadcast"),       explanation: ''},
      log_notifications:  { label: lang("Notifications"),   explanation: ''},
      log_scheduler:      { label: lang("Scheduler"),       explanation: ''},
      log_ble:            { label: lang("BLE"),             explanation: ''},
      log_dfu:            { label: lang("DFU"),             explanation: ''},
      log_bch:            { label: lang("Batch_C_Handler"), explanation: ''},
      log_events:         { label: lang("Events"),          explanation: ''},
      log_store:          { label: lang("Store"),           explanation: ''},
      log_cloud:          { label: lang("Cloud"),           explanation: ''},
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
      {label: lang("disabled"), value: LOG_LEVEL.none},
      {label: lang("error"),    value: LOG_LEVEL.error},
      {label: lang("warning"),  value: LOG_LEVEL.warning},
      {label: lang("info"),     value: LOG_LEVEL.info},
      {label: lang("debug"),    value: LOG_LEVEL.debug},
      {label: lang("verbose"),  value: LOG_LEVEL.verbose},
    ];

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
          core.store.dispatch({type: "DEFINE_LOGGING_DETAILS", data: data})
        }
      })
    });


    items.push({
      type:'explanation',
      label: lang("NATIVE_EXTENDED_LOGGING"),
    });

    items.push({
      label: lang("Native_Extended_Logging"),
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
      label: lang("Basic_native_logging_is_a"),
      below:true,
    });

    items.push({
      type:'explanation',
      label: lang("DISABLE_LOGGING"),
      alreadyPadded: true
    });

    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({
      label: lang("Disable_Logging"),
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22} button={true} color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'SET_LOGGING',
          data: {logging_enabled: false}
        });

        clearAllLogs();
        Bluenet.enableLoggingToFile(false);

        NavigationUtil.back();
      }
    });

    items.push({ type:'spacer' });
    items.push({ type:'spacer' });
    items.push({ type:'spacer' });

    return items;
  }

  render() {
    return (
      <Background image={core.background.menu} >
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
