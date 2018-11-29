import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsStoneBleDebug", key)(a,b,c,d,e);
}
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
import {Util} from "../../../util/Util";
import {NativeBus} from "../../../native/libInterface/NativeBus";
import {Scheduler} from "../../../logic/Scheduler";

const triggerId = "SettingsStoneBleDebug";

export class SettingsStoneBleDebug extends LiveComponent<any, any> {
  unsubscribeNative : any[] = [];
  _crownstoneId : number;
  _ibeaconUuid : string;
  _major  : string;
  _minor  : string;
  _handle : string;

  constructor(props) {
    super(props);
    const store = props.store;
    let state = store.getState();
    let sphere = state.spheres[props.sphereId];
    let stone = sphere.stones[props.stoneId];

    this._ibeaconUuid  = sphere.config.iBeaconUUID;
    this._crownstoneId = stone ? stone.config.crownstoneId : null;
    this._major        = stone ? stone.config.iBeaconMajor : null;
    this._minor        = stone ? stone.config.iBeaconMinor : null;
    this._handle       = stone ? stone.config.handle       : null;

    this.state = {
      advertisementPayload: '',
      directAdvertisementPayload: '',
      advertisementStateExternal: false,
      directAdvertisementStateExternal: false,
      advertisementTimestamp: null,
      directAdvertisementTimestamp: null,
      ibeaconPayload: '',
      ibeaconTimestamp: null
    };
  }

  componentDidMount() {
    this.unsubscribeNative.push(NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => { this._parseIBeacon(data) }));
    this.unsubscribeNative.push(NativeBus.on(NativeBus.topics.advertisement, (data) => { this._parseAdvertisement(data) }));
    Scheduler.setRepeatingTrigger(triggerId, {repeatEveryNSeconds : 1});
    Scheduler.loadCallback(triggerId, () => { this.forceUpdate(); })
  }

  _parseIBeacon(data : ibeaconPackage[]) {
    data.forEach((ibeacon) => {
      if (ibeacon.uuid.toLowerCase() !== this._ibeaconUuid.toLowerCase() ) { return; }
      if (this._major && ibeacon.major !== this._major)                    { return; }
      if (this._minor && ibeacon.minor !== this._minor)                    { return; }

      this.setState({ibeaconPayload: JSON.stringify(ibeacon, undefined, 2), ibeaconTimestamp: new Date().valueOf()});
    })
  }

  _parseAdvertisement(data : crownstoneAdvertisement) {
    if (!data.serviceData) { return; }

    let newData : any = {};
    let changes = false;

    if (data.serviceData.crownstoneId === this._crownstoneId || !this._crownstoneId) {
      newData['advertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["advertisementPayload"] = JSON.stringify(data, undefined, 2);
      newData["advertisementTimestamp"] = new Date().valueOf();
      changes = true;
    }

    if (data.handle === this._handle || !this._handle) {
      newData['directAdvertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["directAdvertisementPayload"] = JSON.stringify(data, undefined, 2);
      newData["directAdvertisementTimestamp"] = new Date().valueOf();
      changes = true;
    }

    if (changes) {
      this.setState(newData);
    }
  }

  componentWillUnmount() {
    Scheduler.removeTrigger(triggerId);
    this.unsubscribeNative.forEach((unsubscribe) => { unsubscribe() });
  }

  _getItems() {
    let items = [];

    const store = this.props.store;
    let state = store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stone = sphere.stones[this.props.stoneId];


    let largeLabel = 'Examining Sphere';
    if (stone) {
      let element = Util.data.getElement(this.props.store, this.props.sphereId, this.props.stoneId, stone);

      largeLabel = "Examining \"" + stone.config.name + "\"\nMAC address: \"" + stone.config.macAddress;
      if (stone.config.applianceId) {
        largeLabel += "\nConnected device: " + element.config.name
      }
    }

    items.push({label: largeLabel, type: 'largeExplanation'});
    items.push({label: lang("iBeacon_UUID___niBeacon_M",this._ibeaconUuid.toUpperCase(),this._major,this._minor), type: 'explanation', style: { paddingTop:0, paddingBottom:0 } });
    items.push({label: lang("Latest_iBeacon_data_"), type: 'largeExplanation', style:{paddingTop:0}});
    items.push({__item:
      <View style={{backgroundColor: colors.white.hex, minHeight: 100}}>
        <Text style={{padding:15, color: new Date().valueOf() - this.state.ibeaconTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{ lang("No_Data",this.state.ibeaconPayload) }</Text>
      </View>
    });
    items.push({label: lang("Time_received__no_data",this.state.ibeaconTimestamp,new Date(this.state.ibeaconTimestamp)), type: 'explanation', below: true});

    items.push({label: lang("Green_Background_means_ex"), type: 'largeExplanation'});

    items.push({label: lang("Latest_Direct_Advertiseme"), type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.directAdvertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.directAdvertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{ lang("No_Data",this.state.directAdvertisementPayload) }</Text>
        </View>
    });
    items.push({label: lang("Time_received__no_data",this.state.directAdvertisementTimestamp,new Date(this.state.directAdvertisementTimestamp)), type: 'explanation', below: true});


    items.push({label: lang("Latest_Applied_Advertisem"), type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.advertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.advertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>{ lang("No_Data",this.state.advertisementPayload) }</Text>
        </View>
    });
    items.push({label: lang("Time_received__no_data",this.state.advertisementTimestamp,new Date(this.state.advertisementTimestamp)), type: 'explanation', below: true});

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
