
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
  View, Alert, ScrollView
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



export class CloudChoice extends LiveComponent<any, {
  cloudV1Address: string,
  cloudV2Address: string,
  sseAddress: string,
}> {
  static options(props) {
    let options = TopBarUtil.getOptions({title: 'Cloud choice', closeModal: true});
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
      Alert.alert("The changes are not stored.","Make sure you hit the validate and save button to store the changes.", [{text: 'Right...'}]);
    }
  }

  async validate() {
    core.eventBus.emit("showLoading", "Validating...");
    this.cloudV1Address = this.state.cloudV1Address; // 'https://cloud.crownstone.rocks/api/';
    this.cloudV2Address = this.state.cloudV2Address; // 'https://next.crownstone.rocks/api/';
    this.sseAddress     = this.state.sseAddress;     // 'https://events.crownstone.rocks/sse/';

    if (!urlChecker(this.cloudV1Address)) {
      Alert.alert("Invalid URL for Cloud V1", "Please enter a valid url for the cloud V1", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.cloudV1Address.endsWith('/')) {
        this.cloudV1Address += '/';
      }
      let baseURL = this.cloudV1Address.split("/api/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'v1')) {
        Alert.alert("Could not verify Cloud V1", "Please double check the URL.", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }



    if (!urlChecker(this.cloudV2Address)) {
      Alert.alert("Invalid URL for Cloud V2", "Please enter a valid url for the cloud V2.", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.cloudV2Address.endsWith('/')) {
        this.cloudV2Address += '/';
      }
      let baseURL = this.cloudV2Address.split("/api/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'v2')) {
        Alert.alert("Could not verify Cloud V2", "Please double check the URL.", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }


    if (!urlChecker(this.sseAddress)) {
      Alert.alert("Invalid URL for SSE server", "Please enter a valid url for the SSE server.", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
      return false;
    }
    else {
      if (!this.sseAddress.endsWith('/')) {
        this.sseAddress += '/';
      }
      let baseURL = this.sseAddress.split("/sse/")[0];
      let result = await CLOUD.hi(baseURL);
      if (!(result?.hi === 'sse')) {
        Alert.alert("Could not verify SSE server", "Please double check the URL.", [{text: "OK", onPress: ()=>{core.eventBus.emit("hideLoading")}}], {cancelable: false});
        return false;
      }
    }

    return true;
  }

  storeAndClose() {
    Alert.alert("Stored new cloud endpoints!", "These are persisted until the app is removed and reinstalled.", [{text: "OK", onPress:() => {
      CloudAddresses.cloud_v1 = this.cloudV1Address;
      CloudAddresses.cloud_v2 = this.cloudV2Address;
      CloudAddresses.sse      = this.sseAddress;
      StoreManager.persistCloudAddresses();
      NavigationUtil.dismissModal();
    }}], {cancelable: false});
  }

  _getItems() {
    let items = [];
    items.push({type:'explanation', label: "Address of custom cloud, v1"});
    items.push({
      label: null,
      type: 'textEdit',
      validation: 'url', validationMethod:'icons',
      value: this.state.cloudV1Address,
      callback: (newText) => {
        this.setState({cloudV1Address: newText});
      },
    });
    items.push({type:'explanation', label: "Address of custom cloud, v2"});
    items.push({
      label: null,
      type: 'textEdit',
      validation: 'url', validationMethod:'icons',
      value: this.state.cloudV2Address,
      callback: (newText) => {
        this.setState({cloudV2Address: newText});
      },
    });
    items.push({type:'explanation', label: "Address of custom sse server"});
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
      label: "Revert to defaults",
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
      label: "Validate and save!",
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
          Alert.alert("Could not validate", "Please double check the URLs.", [{text: "OK", onPress: () => { core.eventBus.emit("hideLoading"); }}], {cancelable: false});
          return;
        }
      },
    });
    return items;

  }

  render() {
    return (
      <SettingsBackground>
        <ScrollView style={{flex:1}}>
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </SettingsBackground>
    )
  }
}
