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
import {IconCircle} from "../components/IconCircle";
const Actions = require('react-native-router-flux').Actions;

export class SettingsBleDebug extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: "BLE Debug",
    }
  };

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if  (change.stoneRssiUpdated) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _pushCrownstoneItem(items, sphereId, element, stone, stoneId, subtext = '', locationColor = colors.gray.hex) {
    let backgroundColor = colors.menuBackground.hex;
    if (stone.state.state > 0 && stone.config.disabled === false) {
      backgroundColor = colors.green.hex
    }
    else if (stone.config.disabled) {
      backgroundColor = colors.gray.hex;
    }
    items.push({
      mediumIcon: <IconCircle
        icon={element.config.icon}
        size={52}
        backgroundColor={backgroundColor}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: element.config.name,
      subtext: subtext,
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
    let sphereId = Util.data.getPresentSphereId(state);
    if (!sphereId) { return [{label: "You have to be in a sphere in order to debug BLE", type: 'largeExplanation'}]; }
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = colors.gray.hex;
      let locationTitle = 'Floating...';
      if (location) {
        locationTitle = location.config.name;
        locationColor = colors.iosBlue.hex;
      }
      let element = Util.data.getElement(sphere, stone);

      this._pushCrownstoneItem(items, sphereId, element, stone, stoneId, locationTitle, locationColor)
    })



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
