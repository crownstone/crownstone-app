import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView} from "react-native";

import { ListEditableItems } from '../../components/ListEditableItems'
import { background, colors } from "../../styles";
import {LOG_LEVEL} from "../../../logging/LogLevels";
import {Bluenet} from "../../../native/libInterface/Bluenet";
import {IconButton} from "../../components/IconButton";
import {clearLogs, getAppLogFileData} from "../../../logging/LogUtil";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import {FileUtil} from "../../../util/FileUtil";
import Share from "react-native-share";
import {LOGw} from "../../../logging/Log";
import { SettingsNavbarBackground } from "../../components/SettingsBackground";
import { SettingsScrollView } from "../../components/SettingsScrollView";


export class SettingsLogging extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "Logging"});
  }

  mounted = false;
  unsubscribe;


  constructor(props) {
    super(props);

    this.state = {
      logInformation: [],
      logsLoaded: false
    };

    this.getLogs();
  }

  async getLogs() {
    if (this.mounted) { this.setState({logsLoaded: false}); }
    else              {
      // @ts-ignore
      this.state.logsLoaded = false;
    }
    let results = await getAppLogFileData();

    if (this.mounted) { this.setState({logInformation: results, logsLoaded: true});; }
    else              {
      // @ts-ignore
      this.state.logsLoaded     = true;
      // @ts-ignore
      this.state.logInformation = results;
    }
  }


  componentDidMount() {
    this.mounted = true;
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
      label: `ACTIVE LOG PRESET:`,
    });
    items.push({
      label: `${getProfile() ?? "custom"}`,
      type: 'button',
      style: {color: colors.iosBlue.hex},
      callback:() => {
        let presets = [];
        // presets
        for (let profileId in LOGGING_PROFILES) {
          presets.push({
            text: profileId,
            callback:() => {
              store.dispatch({type: 'DEFINE_LOGGING_DETAILS', data: LOGGING_PROFILES[profileId]});
              Alert.alert("Preset loaded")
            }
          });
        }

        core.eventBus.emit("showPopup", { tite: 'Load Preset', buttons: presets})
      }
    })

    // sizes of log files (app only, in MBs)
      // press --> pop up, share, delete
    items.push({ type:'explanation', label: "CURRENT APP LOG FILES" });
    if (this.state.logsLoaded === false) {
      items.push({ type:'info', label: "Loading..." });
    }
    else if (this.state.logInformation.length === 0) {
      items.push({ type:'button', label: "No logs yet...", callback:() => { this.getLogs() }});
    }
    else {
      for (let file of this.state.logInformation) {
        let name = file.filename.replace(".log","");
        items.push({
          label: `${name} - ${Math.round(file.size/1024/1024)}MB`,
          type: 'button',
          style: {color: colors.iosBlue.hex},
          callback:() => {
            core.eventBus.emit("showPopup", {
              tite: name,
              buttons: [
                {text: "Share", testID:"Share", callback: async () => {
                    try {
                      let url = `file://${file.path}`;
                      console.log("Sharing this:", url)
                      await Share.open({ urls: [url] });
                    }
                    catch (err : any) {
                      LOGw.info("Something went wrong while sharing data:",err)
                    }
                }},
                {text: "Delete", testID:"Delete", callback: () => {
                  Alert.alert(`Are you sure you want to delete ${name}?`, "This cannot be undone.", [{text:"Cancel"},{text:"Yes", style:'destructive', onPress: async () => {
                    await FileUtil.safeDeleteFile(file.path);
                    await this.getLogs();
                  }}])
                }},
            ]})
          }
        });
      }
    }
    items.push({type:'explanation', label: "CUSTOMIZE LOG LEVELS"});
    items.push({
      label: "Manage all logs",
      type: 'navigation',
      icon: <IconButton name="ios-document" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.csBlue.hex }}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsLogOverview");
      }
    });



    items.push({type:'explanation', label: "CUSTOMIZE LOG LEVELS"});
    items.push({
      label: "Logging Configuration",
      type: 'navigation',
      icon: <IconButton name="ios-options" size={22} color="#fff" buttonStyle={{ backgroundColor: colors.iosBlue.hex }}/>,
      callback: () => {
        NavigationUtil.navigate("SettingsLogLevelConfig");
      }
    });

    // config --> SettingsLogLevelConfig

    items.push({type:'explanation',label: "NATIVE EXTENDED LOGGING"});
    items.push({
      label: "Native Extended Logging",
      value: state.development.nativeExtendedLogging,
      type: 'switch',
      icon: <IconButton name="ios-create" size={22}  color="#fff" buttonStyle={{backgroundColor: colors.green.hex}}/>,
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
      <SettingsNavbarBackground>
        <SettingsScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </SettingsScrollView>
      </SettingsNavbarBackground>
    );
  }
}

function getProfile() {
  let state = core.store.getState();
  let development = state.development;
  for (let profileId in LOGGING_PROFILES) {
    if (isProfile(development, LOGGING_PROFILES[profileId])) {
      return profileId;
    }
  }
  return null;
}

function isProfile(development, profile) {
  for (let item in profile) {
    if (development[item] !== profile[item]) {
      return false;
    }
  }
  return true;
}


const LOGGING_PROFILES = {
  DEFAULT: {
    log_info:           LOG_LEVEL.info,
    log_constellation:  LOG_LEVEL.info,
    log_native:         LOG_LEVEL.error,
    log_advertisements: LOG_LEVEL.error,
    log_notifications:  LOG_LEVEL.info,
    log_scheduler:      LOG_LEVEL.error,
    log_ble:            LOG_LEVEL.error,
    log_dfu:            LOG_LEVEL.info,
    log_events:         LOG_LEVEL.info,
    log_store:          LOG_LEVEL.info,
    log_cloud:          LOG_LEVEL.info,
    log_nav:            LOG_LEVEL.info,
  },
  "INFO STORE AND CLOUD": {
    log_info:           LOG_LEVEL.info,
    log_constellation:  LOG_LEVEL.error,
    log_native:         LOG_LEVEL.error,
    log_advertisements: LOG_LEVEL.error,
    log_notifications:  LOG_LEVEL.error,
    log_scheduler:      LOG_LEVEL.error,
    log_ble:            LOG_LEVEL.error,
    log_dfu:            LOG_LEVEL.error,
    log_events:         LOG_LEVEL.error,
    log_store:          LOG_LEVEL.info,
    log_cloud:          LOG_LEVEL.info,
    log_nav:            LOG_LEVEL.error,
  },
  "CONSTELLATION ONLY": {
    log_info:           LOG_LEVEL.error,
    log_constellation:  LOG_LEVEL.info,
    log_native:         LOG_LEVEL.error,
    log_advertisements: LOG_LEVEL.error,
    log_notifications:  LOG_LEVEL.error,
    log_scheduler:      LOG_LEVEL.error,
    log_ble:            LOG_LEVEL.error,
    log_dfu:            LOG_LEVEL.error,
    log_events:         LOG_LEVEL.error,
    log_store:          LOG_LEVEL.error,
    log_cloud:          LOG_LEVEL.error,
    log_nav:            LOG_LEVEL.error,
  },
  "ERRORS ONLY": {
    log_info:           LOG_LEVEL.error,
    log_constellation:  LOG_LEVEL.error,
    log_native:         LOG_LEVEL.error,
    log_advertisements: LOG_LEVEL.error,
    log_notifications:  LOG_LEVEL.error,
    log_scheduler:      LOG_LEVEL.error,
    log_ble:            LOG_LEVEL.error,
    log_dfu:            LOG_LEVEL.error,
    log_events:         LOG_LEVEL.error,
    log_store:          LOG_LEVEL.error,
    log_cloud:          LOG_LEVEL.error,
    log_nav:            LOG_LEVEL.error,
  }
}


