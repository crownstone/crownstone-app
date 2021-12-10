import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsApp", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { ListEditableItems } from '../components/ListEditableItems'
import { background } from "../styles";
import { TopBarUtil } from "../../util/TopBarUtil";
import { CloudAddresses } from "../../backgroundProcesses/CloudAddresses";

const RNFS = require('react-native-fs');

export class TestConfigurationCloud extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Cloud configuration", closeModal: true});
  }

  _getItems() {
    let items = [];

    items.push({ label: "CUSTOM CLOUD ENDPOINTS", type: 'largeExplanation'});

    items.push({label: "Base cloud", type: 'explanation', below: false});
    items.push({
      label: null,
      value: CloudAddresses.cloud_v1,
      type: 'textEdit',
      testID: 'cloudV1Input',
      callback:(newValue) => {
        CloudAddresses.cloud_v1 = newValue;
    }});

    items.push({label: "Next cloud", type: 'explanation', below: false});
    items.push({
      label: null,
      value: CloudAddresses.cloud_v2,
      type: 'textEdit',
      testID: 'cloudV2Input',
      callback:(newValue) => {
        CloudAddresses.cloud_v2 = newValue;
    }});


    return items;
  }

  componentWillUnmount() {
    CloudAddresses.persist().then(() => { console.log("Persisted!")})
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} hasNavBar={false} testID={"TestConfigurationCloud"}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
