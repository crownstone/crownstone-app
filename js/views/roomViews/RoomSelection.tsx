import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("RoomSelection", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  Dimensions,
  TouchableHighlight,
  PixelRatio,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { Util } from '../../util/Util'
const Actions = require('react-native-router-flux').Actions;
import Toast from 'react-native-same-toast';
import { styles, colors } from './../styles'
import { RoomList } from '../components/RoomList';
import { Icon } from '../components/Icon';
import {BackAction} from "../../util/Back";

export class RoomSelection extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    return {
      title: lang("Move_where_"),
    }
  };

  unsubscribe : any;

  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (change.removeSphere && change["removeSphere"].sphereIds[this.props.sphereId]) {
        return BackAction();
      }

      if (change.changeLocations && change["changeLocations"].sphereIds[this.props.sphereId]) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _moveCrownstone(roomId) {
    BackAction();
    this.props.store.dispatch({type: "UPDATE_STONE_LOCATION", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data: {locationId: roomId}});
    Toast.showWithGravity(' Moved Crownstone! ', Toast.SHORT, Toast.CENTER);
  }

  _getRoomItem(state, roomId, room) {
    return (
      <TouchableHighlight key={roomId + '_entry'} onPress={() => {
        this._moveCrownstone( roomId );
      }}>
        <View style={[styles.listView, {paddingRight:5}]}>
          <RoomList
            icon={room.config.icon}
            name={room.config.name}
            stoneCount={Object.keys(Util.data.getStonesInLocation(state, this.props.sphereId, roomId)).length}
            navigation={true}
          />
        </View>
      </TouchableHighlight>
    )
  }

  _getItems() {
    let items = [];
    const state = this.props.store.getState();

    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    roomIds.sort((a,b) => { return rooms[a].config.name > rooms[b].config.name ? 1 : -1 })
    items.push({label: lang("ROOMS_IN_CURRENT_SPHERE"),  type:'explanation', below:false});
    roomIds.forEach((roomId) => {
      let room = rooms[roomId];
      items.push({__item: this._getRoomItem(state, roomId, room)});
    });

    items.push({
      label: lang("Add_a_room"),
      largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex, fontWeight:'bold'},
      type: 'navigation',
      callback: () => {
        Actions.roomAdd({sphereId: this.props.sphereId, movingCrownstone: this.props.stoneId, fromMovingView: true, returnToRoute: this.props.returnToRoute})
      }
    });

    items.push({label: lang("DECOUPLE_THIS_CROWNSTONE"),  type:'explanation', below: false});
    items.push({
      label: lang("Not_in_a_specific_room"),
      largeIcon: <Icon name="md-cube" size={50} color={colors.green.hex} style={{position:'relative', top:2}} />,
      style: {color:colors.blue.hex, fontWeight:'bold'},
      type: 'navigation',
      callback: () => {
        this._moveCrownstone( null );
      }
    });
    items.push({label: lang("If_you_do_not_add_the_Cro"),  type:'explanation', below: true});

    return items;
  }

  render() {
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);
    return (
      <Background image={backgroundImage} hasNavBar={false} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
