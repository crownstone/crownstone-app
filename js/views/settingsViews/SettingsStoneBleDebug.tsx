import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import {styles, colors, screenWidth} from '../styles'
import {Util} from "../../util/Util";
import {NativeBus} from "../../native/libInterface/NativeBus";
import {Scheduler} from "../../logic/Scheduler";

const triggerId = "SettingsStoneBleDebug"

export class SettingsStoneBleDebug extends Component<any, any> {
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

    this._crownstoneId = stone.config.crownstoneId;
    this._ibeaconUuid  = sphere.config.iBeaconUUID;
    this._major        = stone.config.iBeaconMajor;
    this._minor        = stone.config.iBeaconMinor;
    this._handle       = stone.config.handle;

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
      if (ibeacon.major !== this._major)                                   { return; }
      if (ibeacon.minor !== this._minor)                                   { return; }

      this.setState({ibeaconPayload: JSON.stringify(ibeacon, undefined, 2), ibeaconTimestamp: new Date().valueOf()});
    })
  }

  _parseAdvertisement(data : crownstoneAdvertisement) {
    if (!data.serviceData) { return; }

    let newData : any = {}
    let changes = false;

    if (data.serviceData.crownstoneId === this._crownstoneId) {
      newData['advertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["advertisementPayload"] = JSON.stringify(data, undefined, 2)
      newData["advertisementTimestamp"] = new Date().valueOf();
      changes = true;
    }

    if (data.handle === this._handle) {
      newData['directAdvertisementStateExternal'] = data.serviceData.stateOfExternalCrownstone;
      newData["directAdvertisementPayload"] = JSON.stringify(data, undefined, 2)
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
    let element = Util.data.getElement(sphere, stone);

    let largeLabel = "Examining \"" + stone.config.name + "\"\nMAC address: \"" + stone.config.macAddress
    if (stone.config.applianceId) {
      largeLabel += "\nConnected device: " + element.config.name
    }
    items.push({label: largeLabel, type: 'largeExplanation'})
    items.push({label:
      "iBeacon UUID: " + this._ibeaconUuid.toUpperCase() + '\n' +
      "iBeacon Major: " + this._major + '\n' +
      "iBeacon Minor: " + this._minor + '\n'
    , type: 'explanation', style: { paddingTop:0, paddingBottom:0 } });
    items.push({label: "Latest iBeacon data:", type: 'largeExplanation', style:{paddingTop:0}});
    items.push({__item:
      <View style={{backgroundColor: colors.white.hex, minHeight: 100}}>
        <Text style={{padding:15, color: new Date().valueOf() - this.state.ibeaconTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>
          {this.state.ibeaconPayload || "No Data"}
        </Text>
      </View>
    });
    items.push({label: "Time received: " + (this.state.ibeaconTimestamp ? new Date(this.state.ibeaconTimestamp) : "no data"), type: 'explanation', below: true})

    items.push({label: "Green Background means external state.", type: 'largeExplanation'});

    items.push({label: "Latest Direct Advertisement data:", type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.directAdvertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.directAdvertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>
            {this.state.directAdvertisementPayload || "No Data"}
          </Text>
        </View>
    });
    items.push({label: "Time received: " + (this.state.directAdvertisementTimestamp ? new Date(this.state.directAdvertisementTimestamp) : "no data"), type: 'explanation', below: true})


    items.push({label: "Latest Applied Advertisement data:", type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: this.state.advertisementStateExternal ? colors.green.rgba(0.1) : colors.white.hex, minHeight: 100}}>
          <Text style={{padding:15, color: new Date().valueOf() - this.state.advertisementTimestamp > 10000 ? colors.gray.hex : colors.black.hex, fontSize:12}}>
            {this.state.advertisementPayload || "No Data"}
          </Text>
        </View>
    });
    items.push({label: "Time received: " + (this.state.advertisementTimestamp ? new Date(this.state.advertisementTimestamp) : "no data"), type: 'explanation', below: true})

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <View style={{backgroundColor:colors.csOrange.hex, height:1, width:screenWidth}} />
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
