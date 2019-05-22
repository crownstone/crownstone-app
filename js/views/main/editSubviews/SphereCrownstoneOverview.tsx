import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereCrownstoneOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView} from 'react-native';
import {colors, } from "../../styles";
import {Util} from "../../../util/Util";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {DeviceEntry} from "../../components/deviceEntries/DeviceEntry";
import {addCrownstoneExplanationAlert} from "../AddItemsToSphere";
import {Icon} from "../../components/Icon";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";



export class SphereCrownstoneOverview extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = core.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: lang("Crownstones_in_",sphere.config.name),
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

  _pushCrownstoneItem(items, sphereId, element, stone, stoneId) {
    items.push({
      __item: <DeviceEntry
        stoneId={stoneId}
        sphereId={sphereId}
        touchable={false}
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

    if (stoneIds.length == 0) {
      items.push({label: lang("There_are_no_Crownstones_"),  type:'largeExplanation', below:false});
      return items;
    }

    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    roomIds.sort((a,b) => { return rooms[a].config.name > rooms[b].config.name ? 1 : -1 });

    let renderStonesInRoom = (roomId) => {
      let stonesInRoom = Util.data.getStonesInLocation(state, this.props.sphereId, roomId);
      let stoneIdsInRoom = Object.keys(stonesInRoom);
      if (stoneIdsInRoom.length > 0) {
        let label = "CROWNSTONES NOT IN A ROOM";
        if (roomId !== null) {
          label =  lang("CROWNSTONES_IN_",rooms[roomId].config.name.toUpperCase());
        }

        items.push({label: label, type:'explanation', below:false});
        let elementIds = {};
        stoneIdsInRoom.forEach((stoneId) => {
          let stone = stones[stoneId];
          elementIds[stoneId] = Util.data.getElement(store, this.props.sphereId, stoneId, stone);
        });
        stoneIdsInRoom.sort((a,b) => { return elementIds[a].config.name > elementIds[b].config.name ? 1 : -1 });

        stoneIdsInRoom.forEach((stoneId) => {
          let stone = stones[stoneId];
          let element = elementIds[stoneId];
          this._pushCrownstoneItem(items, this.props.sphereId, element, stone, stoneId);
        })
      }
    };

    roomIds.forEach((roomId) => {
      renderStonesInRoom(roomId)
    });

    renderStonesInRoom(null);

    items.push({label: lang("This_is_an_overview_of_al"), type:'explanation', below:true});


    items.push({
      label: lang("Add_a_Crownstone"),
      largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
      style: {color: colors.menuTextSelected.hex, fontWeight: 'bold'},
      type: 'button',
      callback: () => {
        if (Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
          addCrownstoneExplanationAlert(() => {
            NavigationUtil.reset("AppNavigator");
          });
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
      <Background image={core.background.menu} hasNavBar={false}>
                <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
