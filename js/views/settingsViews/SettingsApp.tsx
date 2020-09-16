import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsApp", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { IconButton } from '../components/IconButton'
import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { Bluenet } from '../../native/libInterface/Bluenet'
import { ListEditableItems } from '../components/ListEditableItems'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
import {colors, } from '../styles'
import {Util} from "../../util/Util";
import { core } from "../../core";
import { TopBarUtil } from "../../util/TopBarUtil";
import { SliderBar } from "../components/editComponents/SliderBar";
import { NavigationUtil } from "../../util/NavigationUtil";


export class SettingsApp extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: lang("App_Settings"), closeModal: props.modal});
  }

  unsubscribe : any;
  triggerTapToToggleCalibration = false;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeAppSettings) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getExplanation(rssiOffset) {
    if (!rssiOffset || rssiOffset === 0) {
      return lang("Tap_to_toggle_when_the_ph")
    }
    else if (rssiOffset > 0 && rssiOffset <= 5) {
      return lang("Tap_to_toggle_when_the_pho")
    }
    else if (rssiOffset > 5) {
      return lang("Tap_to_toggle_when_the_phon")
    }
    else if (rssiOffset < 0 && rssiOffset >= -5) {
      return lang("Tap_to_toggle_when_the_phone")
    }
    else if (rssiOffset < -5) {
      return lang("Tap_to_toggle_when_the_phone_")
    }
  }

  _getExplanationHeight(rssiOffset) {
    if (!rssiOffset || rssiOffset === 0) {
      return 40;
    }
    else if (rssiOffset > 0 && rssiOffset <= 5) {
      return 40;
    }
    else if (rssiOffset > 5) {
      return 40;
    }
    else if (rssiOffset < 0 && rssiOffset >= -5) {
      return 40;
    }
    else if (rssiOffset < -5) {
      return 60;
    }
  }

  _getItems() {
    const store = core.store;
    let state = store.getState();

    let items = [];

    items.push({ label: lang("LANGUAGE"), type: 'explanation', below: false });
    let dropDownItems = [];
    dropDownItems.push({ label: lang("English"),    value: 'en_us' });
    dropDownItems.push({ label: lang("Nederlands"), value: 'nl_nl' });
    items.push({
      type: 'dropdown',
      label: lang("Language"),
      buttons: false,
      mediumIcon: <IconButton name="md-globe" buttonSize={38} size={28} radius={8} color="#fff"
                              buttonStyle={{ backgroundColor: colors.green.hex }}/>,
      value: state.user.language || Languages.defaultLanguage,
      dropdownHeight: 130,
      items: dropDownItems,
      callback: (value) => {
        // store.dispatch({ type: 'UPDATE_APP_SETTINGS', data: { language: value } });
        store.dispatch({ type: 'USER_UPDATE', data: { language: value } });
        Languages.updateLocale();
        core.eventBus.emit("FORCE_RERENDER")
      }
    });


    items.push({label: lang("FEATURES"), type: 'explanation', below: false});
    items.push({
      label: lang("Use_Tap_To_Toggle"),
      value: state.app.tapToToggleEnabled,
      type: 'switch',
      mediumIcon: <IconButton name="md-color-wand" buttonSize={38} size={25} radius={8} color="#fff" buttonStyle={{backgroundColor:colors.purple.hex}} />,
      callback:(newValue) => {
        store.dispatch({
          type: 'UPDATE_APP_SETTINGS',
          data: { tapToToggleEnabled: newValue }
        });
    }});


    if (state.app.tapToToggleEnabled) {
      let deviceId = Util.data.getCurrentDeviceId(state);
      let device = state.devices[deviceId];
      items.push({
        __item: (
          <SliderBar
            label={ lang("Sensitivity")}
            sliderHidden={true}
            mediumIcon={<IconButton name="ios-options" buttonSize={38} size={25} radius={8} color="#fff" buttonStyle={{backgroundColor: colors.darkPurple.hex}} />}
            callback={(value) => {
              let deviceId = Util.data.getCurrentDeviceId(state);
              core.store.dispatch({ type: "SET_RSSI_OFFSET", deviceId: deviceId, data: {rssiOffset: -value}})
              this.forceUpdate();
            }}
            min={-16}
            max={16}
            value={-device.rssiOffset}
            explanation={this._getExplanation(-device.rssiOffset)}
            explanationHeight={this._getExplanationHeight(-device.rssiOffset)}
          />
        )});
    }

    if (state.app.indoorLocalizationEnabled) {
      items.push({label: lang("Tap_to_toggle_allows_you_"), type: 'explanation', below: true});
    }
    else {
      items.push({label: lang("If_indoor_localization_is"), type: 'explanation', below: true});
    }


    items.push({
      label: lang("Use_Indoor_localization"),
      value: state.app.indoorLocalizationEnabled,
      type: 'switch',
      mediumIcon: <IconButton name="c1-locationPin1" buttonSize={38} size={22} radius={8} color="#fff" buttonStyle={{backgroundColor: colors.blue.hex}}/>,
      callback: (newValue) => {
        store.dispatch({
          type: 'UPDATE_APP_SETTINGS',
          data: {indoorLocalizationEnabled: newValue}
        });

        LOG.info("BackgroundProcessHandler: Set background processes to", newValue);
        Bluenet.setBackgroundScanning(newValue);

        if (newValue === false) {
          // REMOVE USER FROM ALL SPHERES AND ALL LOCATIONS.
          let deviceId = Util.data.getCurrentDeviceId(state);
          if (deviceId) {
            CLOUD.forDevice(deviceId).exitSphere("*").catch(() => { });  // will also clear location
          }
        }
      }
    });
    items.push({
      label: lang("Indoor_localization_allow"),
      type: 'explanation',
      below: true
    });
    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={core.background.menu} hasNavBar={!this.props.modal}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
