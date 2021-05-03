import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView } from "react-native";

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import { background, colors } from "../../styles";
import {LOG_LEVEL} from "../../../logging/LogLevels";
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {IconButton} from "../../components/IconButton";
import { clearLogs, getLoggingFilename, LOG_PREFIX } from "../../../logging/LogUtil";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { FileUtil } from "../../../util/FileUtil";
import { UPTIME_LOG_PREFIX } from "../../../backgroundProcesses/UptimeMonitor";
import { LOGe } from "../../../logging/Log";





export class SettingsLogging extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Logging"});
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
      label: "SET LOGGING LEVELS",
    });

    let logLevelsData = {
      log_info:           { label: "General",         explanation: ''},
      log_constellation:  { label: "Constellation",   explanation: ''},
      log_native:         { label: "Native",          explanation: ''},
      log_nav:            { label: "Navigation",      explanation: ''},
      log_advertisements: { label: "Advertisements",  explanation: ''},
      log_behaviour:      { label: "Behaviour",       explanation: ''},
      log_mesh:           { label: "Mesh",            explanation: ''},
      log_broadcast:      { label: "Broadcast",       explanation: ''},
      log_notifications:  { label: "Notifications",   explanation: ''},
      log_scheduler:      { label: "Scheduler",       explanation: ''},
      log_ble:            { label: "BLE",             explanation: ''},
      log_dfu:            { label: "DFU",             explanation: ''},
      log_events:         { label: "Events",          explanation: ''},
      log_store:          { label: "Store",           explanation: ''},
      log_cloud:          { label: "Cloud",           explanation: ''},
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
      {label: "disabled", value: LOG_LEVEL.none},
      {label: "error",    value: LOG_LEVEL.error},
      {label: "warning",  value: LOG_LEVEL.warning},
      {label: "info",     value: LOG_LEVEL.info},
      {label: "debug",    value: LOG_LEVEL.debug},
      {label: "verbose",  value: LOG_LEVEL.verbose},
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
      label: "NATIVE EXTENDED LOGGING",
    });

    items.push({
      label: "Native Extended Logging",
      value: state.development.nativeExtendedLogging,
      type: 'switch',
      icon: <IconButton name="ios-create" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.green2.hex}}/>,
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
      label: "Basic native logging is already enabled when logging is enabled in the developer menu.",
      below:true,
    });

    items.push({
      type:'explanation',
      label: "DISABLE LOGGING",
      alreadyPadded: true
    });

    let clearAllLogs = () => { clearLogs(); Bluenet.clearLogs(); };

    items.push({
      label: "Disable Logging",
      type: 'button',
      icon: <IconButton name="md-close-circle" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.red.hex}} />,
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

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} >
        <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "position" : "height"}>
          <ScrollView keyboardShouldPersistTaps="always">
            <ListEditableItems items={this._getItems()} separatorIndent={true} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BackgroundNoNotification>
    );
  }
}
