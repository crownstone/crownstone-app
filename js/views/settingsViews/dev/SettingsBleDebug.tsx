
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleDebug", key)(a,b,c,d,e);
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
import {IconCircle} from "../../components/IconCircle";
const Actions = require('react-native-router-flux').Actions;

export class SettingsBleDebug extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("BLE_Debug"),
    }
  };

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.stoneRssiUpdated || change.changeSpheres || change.updateActiveSphere) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _pushCrownstoneItem(items, sphereId, element, stone, stoneId, subtext = '', locationColor = colors.gray.hex) {
    let backgroundColor = colors.menuBackground.hex;
    if (stone && stone.state.state > 0 && stone.reachability.disabled === false) {
      backgroundColor = colors.green.hex
    }
    else if (stone && stone.reachability.disabled) {
      backgroundColor = colors.gray.hex;
    }

    let rssiData = stone && stone.reachability.rssi > -1000 ? (stone.reachability.rssi + " in ") : '';

      items.push({
      mediumIcon: <IconCircle
        icon={element ? element.config.icon : 'ios-analytics'}
        size={52}
        backgroundColor={backgroundColor}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: lang("Any", element, element && element.config.name),
      subtext: rssiData + subtext,
      subtextStyle: {color:locationColor},
      type: 'navigation',
      callback: () => {
        Actions.settingsStoneBleDebug({sphereId: sphereId, stoneId: stoneId})
      },
    });
  }
  
  _getItems() {
    let items = [];

    const store = this.props.store;
    let state = store.getState();
    let sphereId = Util.data.getReferenceId(state);
    if (!sphereId) { return [{label: lang("You_have_to_be_in_a_spher"), type: 'largeExplanation'}]; }
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = colors.gray.hex;
      let locationTitle =  lang("Floating___");
      if (location) {
        locationTitle = location.config.name;
        locationColor = colors.iosBlue.hex;
      }
      let element = Util.data.getElement(store, sphereId, stoneId, stone);

      this._pushCrownstoneItem(items, sphereId, element, stone, stoneId, locationTitle, locationColor);
    });

    this._pushCrownstoneItem(items, sphereId, null, null, null, null, colors.csOrange.hex)


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
