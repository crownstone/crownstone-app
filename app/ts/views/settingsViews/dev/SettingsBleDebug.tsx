import { LiveComponent }          from "../../LiveComponent";
import * as React from 'react';
import {
  ScrollView} from 'react-native';

import { BackgroundNoNotification } from '../../components/BackgroundNoNotification'
import { ListEditableItems } from '../../components/ListEditableItems'
import { background, colors } from "../../styles";
import {Util} from "../../../util/Util";
import {IconCircle} from "../../components/IconCircle";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { StoneAvailabilityTracker } from "../../../native/advertisements/StoneAvailabilityTracker";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class SettingsBleDebug extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  "BLE Debug"});
  }

  unsubscribe : any;

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (change.changeSpheres || change.updateActiveSphere) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _pushCrownstoneItem(items, sphereId, stone, stoneId, subtext = '', locationColor = colors.gray.hex) {
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
        icon={stone?.config?.icon || 'ios-analytics'}
        size={52}
        backgroundColor={backgroundColor}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: stone?.config?.name || "Any",
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
    if (!sphereId) { return [{label: "You have to be in a sphere in order to debug BLE", type: 'largeExplanation'}]; }
    let sphere = state.spheres[sphereId];
    let stones = sphere.stones;
    let stoneIds = Object.keys(stones);

    let stoneList = [];
    let sortData = {};
    stoneIds.forEach((stoneId) => {
      let stone = stones[stoneId];
      let location = Util.data.getLocationFromStone(sphere, stone);
      let locationColor = colors.gray.hex;
      let locationTitle =  "Floating...";
      if (location) {
        locationTitle = location.config.name;
        locationColor = colors.iosBlue.hex;
      }
      sortData[stoneId] = locationTitle;
      stoneList.push({locationName: locationTitle, data: { sphereId, stone, stoneId, locationTitle, locationColor }})
    });

    stoneList.sort((a,b) => { return a.locationName > b.locationName ? 1 : -1 })
    stoneList.forEach((item) => {
      this._pushCrownstoneItem(items, item.data.sphereId, item.data.stone, item.data.stoneId, item.data.locationTitle, item.data.locationColor);
    })

    this._pushCrownstoneItem(items, sphereId, null, null, null, colors.csOrange.hex);


    return items;
  }

  render() {
    return (
      <BackgroundNoNotification image={background.menu} >
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={true} />
        </ScrollView>
      </BackgroundNoNotification>
    );
  }
}
