import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView } from "react-native";

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import {colors, } from '../../styles'
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
import Share from "react-native-share";

const querystring = require('qs');
const RNFS = require('react-native-fs');

type emailDataType = "allBuffers" | "switchCraftBuffers" | "measurementBuffers" | "logs"
interface iEmailData { [key: string]: emailDataType }

const EMAIL_DATA_TYPE = {
  allBuffers:           'allBuffers',
  switchCraftBuffers:   'switchCraftBuffers',
  measurementBuffers:   'measurementBuffers',
  logs:                 'logs',
}

export class SettingsLogging extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Logging"});
  }


  unsubscribe;
  constructor(props) {
    super(props);

    this.state = {showSharingSettings: false, sharingDataType: 'logs'}
  }

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
      log_promiseManager: { label: "PromiseManager",  explanation: ''},
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
      log_bch:            { label: "Batch C Handler", explanation: ''},
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

    items.push({
      type:'explanation',
      label: "SHARE DATA WITH LOVELY DEVELOPERS"
    });

    if (this.state.showSharingSettings) {
      items.push({
        type:'dropdown',
        value: this.state.sharingDataType,
        label: 'Share Data:',
        items:[{label: EMAIL_DATA_TYPE.logs}, {label: EMAIL_DATA_TYPE.allBuffers}, {label: EMAIL_DATA_TYPE.switchCraftBuffers}, {label: EMAIL_DATA_TYPE.measurementBuffers}],
        callback: (data) => { this.setState({sharingDataType: data})}
      })

      if (this.state.sharingDataType !== null) {
        items.push({
          label: "Share data now!",
          type: 'button',
          style: {color: colors.blue.hex},
          icon: <IconButton name="ios-mail" size={22}  color="#fff" buttonStyle={{backgroundColor:colors.blue.hex}} />,
          callback:(newValue) => {
            let shareDataType = this.state.sharingDataType;
            let storagePath = FileUtil.getPath();
            let options = {};
            if (shareDataType === 'logs') {
              let filename = getLoggingFilename(new Date().valueOf(), LOG_PREFIX);
              options = {urls:[
                "file://" + storagePath + filename,
              ]}
            }
            else if (shareDataType === 'allBuffers') {
              options = {urls:[
                "file://" + storagePath + '/power-samples-switchcraft-false-positive.log',
                "file://" + storagePath + '/power-samples-switchcraft-true-positive.log',
                "file://" + storagePath + '/power-samples-switchcraft-false-negative.log',
                "file://" + storagePath + '/power-samples-switchcraft-true-negative.log',
                "file://" + storagePath + '/power-samples-filteredData.log',
                "file://" + storagePath + '/power-samples-unfilteredData.log',
              ]}
            }
            else if (shareDataType === 'switchCraftBuffers') {
              options = {urls:[
                "file://" + storagePath + '/power-samples-switchcraft-false-positive.log',
                "file://" + storagePath + '/power-samples-switchcraft-true-positive.log',
                "file://" + storagePath + '/power-samples-switchcraft-false-negative.log',
                "file://" + storagePath + '/power-samples-switchcraft-true-negative.log',
              ]}
            }
            else if (shareDataType === "measurementBuffers") {
              options = {urls:[
                "file://" + storagePath + '/power-samples-filteredData.log',
                "file://" + storagePath + '/power-samples-unfilteredData.log',
              ]}
            }

            Share.open(options)
              .then((res) => { console.log(res) })
              .catch((err) => { err && console.log(err); });
        }});
      }
    }
    else {
      items.push({
        label: "Share Data",
        type: 'button',
        style: { color: colors.blue.hex },
        icon: <IconButton name="ios-mail" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.blue.hex }}/>,
        callback: () => {
          this.setState({ showSharingSettings: true })
        }
      });
    }

    items.push({
      label: "Delete collected data",
      type: 'button',
      icon: <IconButton name="ios-trash" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.red.hex }}/>,
      callback: () => {
        Alert.alert("Sure about that?","This will delete all collected power curves.",[{text:'no'},{text:"yes", onPress: () => {
          let storagePath = FileUtil.getPath();
          FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-false-positive.log')
          FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-true-positive.log')
          FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-false-negative.log')
          FileUtil.safeDeleteFile(storagePath + '/power-samples-switchcraft-true-negative.log')
          FileUtil.safeDeleteFile(storagePath + '/power-samples-filteredData.log')
          FileUtil.safeDeleteFile(storagePath + '/power-samples-unfilteredData.log')
        }}])
      }
    });


    items.push({ type:'spacer' });
    items.push({ type:'spacer' });

    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu} >
        <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "position" : "height"}>
          <ScrollView keyboardShouldPersistTaps="always">
            <ListEditableItems items={this._getItems()} separatorIndent={true} />
          </ScrollView>
        </KeyboardAvoidingView>
      </BackgroundNoNotification>
    );
  }
}

function getLogs(type : emailDataType) : Promise<string> {
  let storagePath = FileUtil.getPath();
  if (type === 'logs') {
    let filename = getLoggingFilename(new Date().valueOf(), LOG_PREFIX);
    let timestamp = new Date().valueOf() - 5*60*1000; // 15 mins
    return RNFS.readFile(storagePath + '/' + filename)
      .then((data) => {
        let lines = data.split("\n");

        let string = '';
        for (let i = lines.length-1; i > 0; i--) {
          let parts = lines[i].split(" - ");
          let time = Number(parts[0]);

          if (time > 0 && time < timestamp) {
            break;
          }

          string += lines[i] + "\n";
        }

        return string;
      })
      .catch((err) => { console.log("CANT",err) })
  }
  else {
    let data = '';
    if (type === 'allBuffers') {
      return RNFS.readFile(storagePath + '/power-samples-switchcraft-false-positive.log').catch(() => {})
        .then((d) => {
          data += "\n\n###FalsePositive:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-true-positive.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###TruePositive:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-false-negative.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###FalseNegative:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-true-negative.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###TrueNegative:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-filteredData.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###FilteredData:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-unfilteredData.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###UnfilteredData:\n"
          data += d;
          return data;
        }).catch(() => {})
    }
    else if (type === 'switchCraftBuffers') {
      return RNFS.readFile(storagePath + '/power-samples-switchcraft-false-positive.log').catch(() => {})
        .then((d) => {
          data += "\n\n###FalsePositive:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-true-positive.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###TruePositive:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-false-negative.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###FalseNegative:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-switchcraft-true-negative.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###TrueNegative:\n"
          data += d;
          return data;
        }).catch(() => {})
    }
    else if (type === "measurementBuffers") {
      return RNFS.readFile(storagePath + '/power-samples-filteredData.log').catch(() => {})
        .then((d) => {
          data += "\n\n###FilteredData:\n"
          data += d;
          return RNFS.readFile(storagePath + '/power-samples-unfilteredData.log').catch(() => {})
        })
        .then((d) => {
          data += "\n\n###UnfilteredData:\n"
          data += d;
          return data;
        }).catch(() => {})
    }
  }

}
