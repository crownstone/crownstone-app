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
import { styles, colors } from '../styles'
import {Util} from "../../util/Util";
import {NativeBus} from "../../native/libInterface/NativeBus";
import {Scheduler} from "../../logic/Scheduler";

const triggerId = "SettingsStoneBleDebug"

export class SettingsStoneBleDebug extends Component<any, any> {
  unsubscribeNative : any[] = [];
  _crownstoneId : number;
  _ibeaconUuid : string;
  _major : string;
  _minor : string;

  constructor(props) {
    super(props);
    const store = props.store;
    let state = store.getState();
    let sphere = state.spheres[props.sphereId];
    let stone = sphere.stones[props.stoneId];

    this._crownstoneId = stone.config.crownstoneId;
    this._ibeaconUuid = sphere.config.iBeaconUUID;
    this._major = stone.config.iBeaconMajor;
    this._minor = stone.config.iBeaconMinor;

    this.state = {advertisementPayload: '', advertisementTimestamp: null, ibeaconPayload: '', ibeaconTimestamp: null}
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

    if (data.serviceData.crownstoneId === this._crownstoneId) {
      this.setState({advertisementPayload: JSON.stringify(data, undefined, 2), advertisementTimestamp: new Date().valueOf()});
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


    items.push({label: "Latest Advertisement data:", type: 'largeExplanation'});
    items.push({__item:
        <View style={{backgroundColor: colors.white.hex, minHeight: 100}}>
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
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
