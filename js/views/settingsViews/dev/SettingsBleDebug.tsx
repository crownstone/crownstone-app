import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SettingsBleDebug", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { Background } from '../../components/Background'
import { ListEditableItems } from '../../components/ListEditableItems'
import {colors, } from '../../styles'
import {Util} from "../../../util/Util";
import {IconCircle} from "../../components/IconCircle";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";


export class SettingsBleDebug extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("BLE_Debug"),
    }
  };

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
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
    if (stone && stone.state.state > 0 && StoneAvailabilityTracker.isDisabled(stoneId) === false) {
      backgroundColor = colors.green.hex
    }
    else if (StoneAvailabilityTracker.isDisabled(stoneId)) {
      backgroundColor = colors.gray.hex;
    }

    let rssiData = StoneAvailabilityTracker.getRssi(this.props.stoneId) > -1000 ? (StoneAvailabilityTracker.getRssi(this.props.stoneId) + " in ") : '';

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
        NavigationUtil.navigate( "SettingsStoneBleDebug",{sphereId: sphereId, stoneId: stoneId});
      },
    });
  }
  
  _getItems() {
    let items = [];

    const store = core.store;
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

    this._pushCrownstoneItem(items, sphereId, null, null, null, null, colors.csOrange.hex);


    return items;
  }

  render() {
    return (
      <Background image={core.background.menu} >
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </Background>
    );
  }
}
