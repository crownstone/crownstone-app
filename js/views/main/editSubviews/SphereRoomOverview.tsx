import { LiveComponent }          from "../../LiveComponent";

import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SphereRoomOverview", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  TouchableHighlight,
  ScrollView,
  View
} from 'react-native';
import { colors, styles } from "../../styles";
import {RoomList} from "../../components/RoomList";
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";

import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";
import { core } from "../../../core";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopBarUtil } from "../../../util/TopBarUtil";


export class SphereRoomOverview extends LiveComponent<any, any> {
  static options(props) {
    let state = core.store.getState();
    let sphere = state.spheres[props.sphereId] ;
    return TopBarUtil.getOptions({title: lang("Rooms_in_",sphere.config.name)});
  }

  unsubscribe : any;

  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.changeLocations && change["changeLocations"].sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getRoomItem(state, roomId, room) {
    return (
      <TouchableHighlight key={roomId + '_entry'} onPress={() => {
        NavigationUtil.dismissModal()
        NavigationUtil.navigate(
          "RoomOverview",
        {
          sphereId: this.props.sphereId,
          locationId: roomId,
          title: room.config.name,
        });
      }}>
      <View style={[styles.listView, {paddingRight:5}]}>
        <RoomList
          icon={room.config.icon}
          name={room.config.name}
          stoneCount={Object.keys(Util.data.getStonesInLocation(state, this.props.sphereId, roomId)).length}
          showNavigationIcon={true}
        />
      </View>
      </TouchableHighlight>
    )
  }

  _getRearrangeItem() {
    return (
      <TouchableHighlight key={'rearrangeItem_entry'} onPress={() => {
        NavigationUtil.navigate( "SphereRoomArranger", {sphereId: this.props.sphereId});
      }}>
        <View style={[styles.listView, {paddingRight:5}]}>
          <RoomList
            icon={"md-cube"}
            name={ lang("Rearrange_Rooms_")}
            hideSubtitle={true}
            iconSizeOverride={40}
            backgroundColor={colors.menuTextSelected.hex}
            showNavigationIcon={true}
          />
        </View>
      </TouchableHighlight>
    )
  }

  _getItems() {
    let items = [];
    const state = core.store.getState();

    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    roomIds.sort((a,b) => { return rooms[a].config.name > rooms[b].config.name ? 1 : -1 });

    if (roomIds.length > 0) {
      items.push({ label: lang("CUSTOMIZE_LAYOUT"), type: 'explanation', below: false });
      items.push({ __item: this._getRearrangeItem() });
    }


    items.push({label: lang("ROOMS_IN_SPHERE"),  type:'explanation', below:false});
    roomIds.forEach((roomId) => {
      let room = rooms[roomId];
      items.push({__item: this._getRoomItem(state, roomId, room)});
    });

    if (Permissions.inSphere(this.props.sphereId).addRoom) {
      items.push({
        label: lang("Add_a_room"),
        largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
        style: {color: colors.menuTextSelected.hex, fontWeight: 'bold'},
        type: 'navigation',
        callback: () => {
          NavigationUtil.launchModal( "RoomAdd", {sphereId: this.props.sphereId, isModal:true});
        }
      });
    }

    items.push({type:'spacer'});
    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  render() {
    let backgroundImage = core.background.menu;
    return (
      <Background image={backgroundImage} hasNavBar={false} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
