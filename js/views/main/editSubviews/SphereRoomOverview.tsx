import { Languages } from "../../../Languages"
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
import {BackAction} from "../../../util/Back";
import {colors, styles} from "../../styles";
import {RoomList} from "../../components/RoomList";
import {Util} from "../../../util/Util";
import {Icon} from "../../components/Icon";
import {Actions} from "react-native-router-flux";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";


export class SphereRoomOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: Languages.title("SphereRoomOverview", "Rooms_in_")(sphere.config.name),
    }
  };

  unsubscribe : any;

  componentDidMount() {
    // tell the component exactly when it should redraw
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
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
        Actions.popTo("sphereOverview")
        Actions.roomOverview({sphereId: this.props.sphereId, locationId: roomId, title: room.config.name, seeStoneInSetupMode: false});
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

  _getRearrangeItem() {
    return (
      <TouchableHighlight key={'rearrangeItem_entry'} onPress={() => {
        Actions.sphereRoomArranger({sphereId: this.props.sphereId});
      }}>
        <View style={[styles.listView, {paddingRight:5}]}>
          <RoomList
            icon={"md-cube"}
            name={ Languages.label("SphereRoomOverview", "Rearrange_Rooms_")()}
            hideSubtitle={true}
            iconSizeOverride={40}
            backgroundColor={colors.menuTextSelected.hex}
            navigation={true}
          />
        </View>
      </TouchableHighlight>
    )
  }

  _getItems() {
    let items = [];
    const state = this.props.store.getState();

    items.push({label: Languages.label("SphereRoomOverview", "CUSTOMIZE_LAYOUT")(),  type:'explanation', below:false});
    items.push({__item: this._getRearrangeItem()});


    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    roomIds.sort((a,b) => { return rooms[a].config.name > rooms[b].config.name ? 1 : -1 })

    items.push({label: Languages.label("SphereRoomOverview", "ROOMS_IN_SPHERE")(),  type:'explanation', below:false});
    roomIds.forEach((roomId) => {
      let room = rooms[roomId];
      items.push({__item: this._getRoomItem(state, roomId, room)});
    });

    if (Permissions.inSphere(this.props.sphereId).addRoom) {
      items.push({
        label: Languages.label("SphereRoomOverview", "Add_a_room")(),
        largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
        style: {color: colors.menuTextSelected.hex, fontWeight: 'bold'},
        type: 'navigation',
        callback: () => {
          Actions.roomAdd({sphereId: this.props.sphereId, fromMovingView: true, returnToRoute: 'sphereRoomOverview'})
        }
      });
    }

    items.push({type:'spacer'})
    items.push({type:'spacer'})
    items.push({type:'spacer'})

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
