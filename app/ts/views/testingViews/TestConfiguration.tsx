import { LiveComponent }          from "../LiveComponent";
import * as React from 'react';
import { ScrollView }               from 'react-native';
import { BackgroundNoNotification } from '../components/BackgroundNoNotification'
import { ListEditableItems }        from '../components/ListEditableItems'
import { background }               from "../styles";
import { TopBarUtil }               from "../../util/TopBarUtil";
import { CloudAddresses }           from "../../backgroundProcesses/indirections/CloudAddresses";
import { TestingFramework }         from "../../backgroundProcesses/testing/TestingFramework";
import { CameraLibrarySettings }    from "../../backgroundProcesses/indirections/CameraLibraryInterface";
import {BluenetConfig} from "../../native/libInterface/BluenetConfig";


export class TestConfiguration extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title: "Cloud configuration", closeModal: true});
  }

  _getItems() {
    let items = [];
    items.push({ label: "TESTING OVERRIDES", type: 'largeExplanation'});

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
    items.push({label: "Bridge mock url", type: 'explanation', below: false});
    items.push({
      label: null,
      placeholder: 'none',
      value: BluenetConfig.mockBridgeUrl,
      type: 'textEdit',
      testID: 'mockBluenetUrl',
      callback:(newValue) => {
        BluenetConfig.mockBridgeUrl = newValue;
    }});

    items.push({label: "MOCKS", type: 'explanation', below: false});
    items.push({
      label: "Mock photo library",
      value: CameraLibrarySettings.mockImageLibrary,
      type: 'switch',
      testID: 'mockImageLibrary',
      callback:(newValue) => {
        CameraLibrarySettings.mockImageLibrary = newValue;
        this.forceUpdate();
    }});
    items.push({
      label: "Mock BluenetPromise",
      value: BluenetConfig.mockBluenet,
      type: 'switch',
      testID: 'mockBluenetPromise',
      callback:(newValue) => {
        BluenetConfig.mockBluenet = newValue;
        this.forceUpdate();
    }});

    return items;
  }

  componentWillUnmount() {
    TestingFramework.persist().then(() => { console.log("Persisted!")})
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} hasNavBar={false} testID={"TestConfiguration"}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
