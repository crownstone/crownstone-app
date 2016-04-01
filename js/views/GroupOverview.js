import React, {
  Component,
  Dimensions,
  Image,
  NativeModules,
  TouchableHighlight,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;


import { Background } from './components/Background'
import { RoomCircle } from './components/RoomCircle'

import {stylesIOS, colors} from './styles'
let styles = stylesIOS;

export class GroupOverview extends Component {
  constructor() {
    super();
  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _renderRoom(roomId, room) {
    let width = Dimensions.get('window').width;
    let radius = 0.35*0.5*width;

    // TODO: get color, get position on screen.
    //() => this.props.goto("RoomOverview", {roomId, roomIndex})
    //r:255,g:60,b:0


    // get the current usage.
    let usage = 0;
    Object.keys(room.stones).forEach((stoneId) => {
      usage += room.stones[stoneId].state.currentUsage;
    });

    return (
      <TouchableHighlight onPress={() => Actions.roomOverview({
        roomId:roomId,
        title:room.config.name,
      })} key={roomId}>
        <View>
          <RoomCircle
            backgroundImage={room.picture.squareURI}
            radius={radius}
            color={{r:160,g:235,b:88}}
            icon={room.config.icon}
            content={{value:usage, unit:'W'}}
            pos={{x:200,y:100}}
          /></View>
      </TouchableHighlight>
    );
  }

  getRooms() {
    const { store } = this.props;
    const state = store.getState();

    let roomNodes = [];
    let activeGroup = state.app.activeGroup;
    let rooms = state.groups[activeGroup].locations;
    Object.keys(rooms).sort().forEach((roomId) => {
      roomNodes.push(this._renderRoom(roomId, rooms[roomId]))
    });
    return roomNodes;
  }

  render() {
    return (
      <Background>{this.getRooms()}</Background>
    )
  }
}
