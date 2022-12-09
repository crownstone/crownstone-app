
import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("CloudChoice", key)(a,b,c,d,e);
}

import * as React from 'react'; import { Component } from 'react';
import {
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Text,
  View, Alert, ScrollView, Linking
} from "react-native";

import { setupStyle, CancelButton } from '../settingsViews/SetupShared'


import { Background } from '../components/Background'
import { styles, colors} from '../styles'
import { Icon } from '../components/Icon';
import { SettingsBackground, SettingsNavbarBackground } from "../components/SettingsBackground";
import { TopBarUtil } from "../../util/TopBarUtil";
import { LiveComponent } from "../LiveComponent";
import { ListEditableItems } from "../components/ListEditableItems";
import { CloudAddresses } from "../../backgroundProcesses/indirections/CloudAddresses";
import { cloudHi } from "../../cloud/sections/hi";
import { CLOUD } from "../../cloud/cloudAPI";
import { CLOUD_ADDRESS, CLOUD_V2_ADDRESS, SSE_ADDRESS } from "../../ExternalConfig";
import { NavigationUtil } from "../../util/navigation/NavigationUtil";
import { urlChecker } from "../../util/Util";
import { core } from "../../Core";
import { StoreManager } from "../../database/storeManager";
import { SettingsScrollView } from "../components/SettingsScrollView";



export class CloudChoice extends LiveComponent<any, {
  cloudV1Address: string,
  cloudV2Address: string,
  sseAddress: string,
}> {
  static options(props) {
    let options = TopBarUtil.getOptions({title: lang("Cloud_choice"), closeModal: true});
    return options;
  }

  cloudV1Address : string;
  cloudV2Address : string;
  sseAddress : string;


  constructor(props) {
    super(props);

    this.state = {
      cloudV1Address: CloudAddresses.cloud_v1,
      cloudV2Address: CloudAddresses.cloud_v2,
      sseAddress:     CloudAddresses.sse,
    }

    this.cloudV1Address = CloudAddresses.cloud_v1;
    this.cloudV2Address = CloudAddresses.cloud_v2;
    this.sseAddress     = CloudAddresses.sse;
  }

  componentWillUnmount() {
    // if the address are not changed, notify the user.
    if (this.state.cloudV1Address !== CloudAddresses.cloud_v1 || this.state.cloudV2Address !== CloudAddresses.cloud_v2 || this.state.sseAddress !== CloudAddresses.sse) {
      Alert.alert(
lang("_The_changes_are_not_stor_header"),
lang("_The_changes_are_not_stor_body"),
[{text: lang("_The_changes_are_not_stor_left")}]);
    }
  }

  async validate() {
    core.eventBus.emit("showLoading", "Validating...");
    this.cloudV1Address = this.state.cloudV1Address; // 'https://cloud.crownstone.rocks/api/';
    this.cloudV2Address = this.state.cloudV2Address; // 'https://next.crownstone.rocks/api/';
    this.sseAddress     = this.state.sseAddress;     // 'https://events.crownstone.rocks/sse/';

    if (!urlChecker(this.cloudV1Address)) {
      Alert.alert(
lang("_Invalid_URL_for_Cloud_V__header"),
lang("_Invalid_URL_for_Cloud_V__body"),
[{text: lang("_Invalid_URL_for_Cloud_V__left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.cloudV1Address.endsWith('/')) {
        this.cloudV1Address += '/';
      }
      let baseURL = this.cloudV1Address.split("/api/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'v1')) {
        Alert.alert(
lang("_Could_not_verify_Cloud_V_header"),
lang("_Could_not_verify_Cloud_V_body"),
[{text: lang("_Could_not_verify_Cloud_V_left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }



    if (!urlChecker(this.cloudV2Address)) {
      Alert.alert(
lang("_Invalid_URL_for_Cloud_V___header"),
lang("_Invalid_URL_for_Cloud_V___body"),
[{text: lang("_Invalid_URL_for_Cloud_V___left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.cloudV2Address.endsWith('/')) {
        this.cloudV2Address += '/';
      }
      let baseURL = this.cloudV2Address.split("/api/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'v2')) {
        Alert.alert(
lang("_Could_not_verify_Cloud_V__header"),
lang("_Could_not_verify_Cloud_V__body"),
[{text: lang("_Could_not_verify_Cloud_V__left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }


    if (!urlChecker(this.sseAddress)) {
      Alert.alert(
lang("_Invalid_URL_for_SSE_serv_header"),
lang("_Invalid_URL_for_SSE_serv_body"),
[{text: lang("_Invalid_URL_for_SSE_serv_left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.sseAddress.endsWith('/')) {
        this.sseAddress += '/';
      }
      let baseURL = this.sseAddress.split("/sse/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'sse')) {
        Alert.alert(
lang("_Could_not_verify_SSE_ser_header"),
lang("_Could_not_verify_SSE_ser_body"),
[{text: lang("_Could_not_verify_SSE_ser_left"), onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }

    return true;
  }

  storeAndClose() {
    Alert.alert(
lang("_Stored_new_cloud_endpoin_header"),
lang("_Stored_new_cloud_endpoin_body"),
[{text: lang("_Stored_new_cloud_endpoin_left"), onPress:() => {
      CloudAddresses.cloud_v1 = this.cloudV1Address;
      CloudAddresses.cloud_v2 = this.cloudV2Address;
      CloudAddresses.sse      = this.sseAddress;
      StoreManager.persistCloudAddresses();
      NavigationUtil.dismissModal();
    }}], {cancelable: false});
  }

  _getItems() {
    let items = [];
    items.push({type:'explanation', label: lang("Address_of_custom_cloud__")});
    items.push({
      label: null,
      type: 'textEdit',
      validation: 'url', validationMethod:'icons',
      value: this.state.cloudV1Address,
      callback: (newText) => {
        this.setState({cloudV1Address: newText});
      },
    });
    items.push({type:'explanation', label: lang("Address_of_custom_cloud__v")});
    items.push({
      label: null,
      type: 'textEdit',
      validation: 'url', validationMethod:'icons',
      value: this.state.cloudV2Address,
      callback: (newText) => {
        this.setState({cloudV2Address: newText});
      },
    });
    items.push({type:'explanation', label: lang("Address_of_custom_sse_ser")});
    items.push({
      label: null,
      type: 'textEdit',
      validation: 'url', validationMethod:'icons',
      value: this.state.sseAddress,
      callback: (newText) => {
        this.setState({sseAddress: newText});
      },
    });
    items.push({type:'spacer'});
    items.push({
      label: lang("Revert_to_defaults"),
      type: 'button',
      callback: (newText) => {
        this.setState({
          cloudV1Address: CLOUD_ADDRESS,
          cloudV2Address: CLOUD_V2_ADDRESS,
          sseAddress: SSE_ADDRESS,
        });
      },
    });
    items.push({type:'spacer'});
    items.push({
      label: lang("Validate_and_save_"),
      type: 'button',
      style: {color: colors.blue.hex},
      callback: async (newText) => {
        try {
          let validationResult = await this.validate();
          if (validationResult) {
            core.eventBus.emit("hideLoading");
            this.storeAndClose();
          }
        }
        catch (err) {
          Alert.alert(
lang("_Could_not_validate__Plea_header"),
lang("_Could_not_validate__Plea_body"),
[{text: lang("_Could_not_validate__Plea_left"), onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable: false});
          return;
        }
      },
    });
    return items;

  }

  render() {
    return (
      <SettingsBackground>
        <SettingsScrollView>
          <TouchableOpacity onPress={() => {
            Linking.openURL("https://github.com/crownstone-community/cloud-installer").catch(err => {})
          }}>
            <Text style={{padding:10, color: colors.blue.hex, fontWeight:'bold'}}>{lang("Instructions_for_hosting_y")}</Text>
          </TouchableOpacity>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </SettingsScrollView>
      </SettingsBackground>
    )
  }
}
