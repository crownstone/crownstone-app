import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereCrownstoneOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';
import { background, colors } from "../../styles";
import {Util} from "../../../util/Util";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {DeviceEntry} from "../../components/deviceEntries/DeviceEntry";
import {Icon} from "../../components/Icon";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../Core";
import { NavigationUtil } from "../../../util/navigation/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";
import { STONE_TYPES } from "../../../Enums";
import {SettingsBackground} from "../../components/SettingsBackground";



export class SphereCrownstoneOverview extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let sphere = state.spheres[props.sphereId] ;
    return TopBarUtil.getOptions({title: lang("Crownstones_in_",sphere.config.name)});
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

  _pushCrownstoneItem(items, sphereId, stone, stoneId) {
    items.push({
      __item: <DeviceEntry
        stoneId={stoneId}
        sphereId={sphereId}
        allowSwitchView={false}
        allowDeviceOverview={false}
        viewingRemotely={false}
        hideExplanation={true}
      />
    });
  }
  
  _getItems() {
    let items = [];

    const store = core.store;
    let state = store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;

    let stoneIds = Object.keys(stones);

    if (stoneIds.length > 0) {
      let rooms = state.spheres[this.props.sphereId].locations;
      let roomIds = Object.keys(rooms);
      roomIds.sort((a, b) => {
        return rooms[a].config.name > rooms[b].config.name ? 1 : -1
      });

      let renderStonesInRoom = (roomId) => {
        let stonesInRoom = Util.data.getStonesInLocation(state, this.props.sphereId, roomId);
        let stoneIdsInRoom = Object.keys(stonesInRoom);
        if (stoneIdsInRoom.length > 0) {
          let label = "CROWNSTONES NOT IN A ROOM";
          if (roomId !== null) {
            label = lang("CROWNSTONES_IN_", rooms[roomId].config.name.toUpperCase());
          }

          items.push({label: label, type: 'explanation', below: false});
          stoneIdsInRoom.sort((a, b) => {
            return stonesInRoom[a].config.name > stonesInRoom[b].config.name ? 1 : -1
          });

          stoneIdsInRoom.forEach((stoneId) => {
            let stone = stonesInRoom[stoneId];
            if (stone.config.type !== STONE_TYPES.crownstoneUSB && stone.config.type !== STONE_TYPES.hub) {
              this._pushCrownstoneItem(items, this.props.sphereId, stone, stoneId);
            }
          })
        }
      };

      roomIds.forEach((roomId) => {
        renderStonesInRoom(roomId)
      });

      renderStonesInRoom(null);

      items.push({label: lang("This_is_an_overview_of_al"), type: 'explanation', below: true});

    }
    else {
      items.push({label: lang("There_are_no_Crownstones_"),  type:'largeExplanation', below:false});
    }

    items.push({
      label: lang("Add_a_Crownstone"),
      largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
      style: {color: colors.blue.hex, fontWeight: 'bold'},
      testID: 'AddCrownstone_button',
      type: 'button',
      callback: () => {
        if (Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
          NavigationUtil.launchModal("AddCrownstone", {sphereId: this.props.sphereId});
        }
        else {
          Alert.alert(
            lang("_Ask_your_Sphere_Admin__A_header"),
            lang("_Ask_your_Sphere_Admin__A_body"),
            [{text:lang("_Ask_your_Sphere_Admin__A_left")}]);
        }
      }
    });

    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  render() {
    return (
      <SettingsBackground testID={"SphereCrownstoneOverview"}>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </SettingsBackground>
    );
  }
}
