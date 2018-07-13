import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  TouchableHighlight,
  ScrollView,
  Switch,
  Text,
  View
} from 'react-native';
import {colors, OrangeLine} from "../../styles";
import {IconCircle} from "../../components/IconCircle";
import {Util} from "../../../util/Util";
import {Background} from "../../components/Background";
import {ListEditableItems} from "../../components/ListEditableItems";
import {DeviceEntry} from "../../components/deviceEntries/DeviceEntry";
import {addCrownstoneExplanationAlert} from "../AddItemsToSphere";
import {Icon} from "../../components/Icon";
import {IconButton} from "../../components/IconButton";
import {Permissions} from "../../../backgroundProcesses/PermissionManager";

const Actions = require('react-native-router-flux').Actions;

export class SphereCrownstoneOverview extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let state = params.store.getState();
    let sphere = state.spheres[params.sphereId] ;
    return {
      title: "Crownstones in " + sphere.config.name,
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

  _pushCrownstoneItem(items, sphereId, element, stone, stoneId) {

    items.push({
      __item: <DeviceEntry
        eventBus={this.props.eventBus}
        store={this.props.store}
        stoneId={stoneId}
        sphereId={sphereId}
        touchable={false}
        viewingRemotely={false}
      />
    });
  }
  
  _getItems() {
    let items = [];

    const store = this.props.store;
    let state = store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;

    let stoneIds = Object.keys(stones);

    if (stoneIds.length == 0) {
      items.push({label:"There are no Crownstones in this Sphere yet!",  type:'largeExplanation', below:false});
      return items;
    }

    let rooms = state.spheres[this.props.sphereId].locations;
    let roomIds = Object.keys(rooms);
    roomIds.sort((a,b) => { return rooms[a].config.name > rooms[b].config.name ? 1 : -1 })

    let renderStonesInRoom = (roomId) => {
      let stonesInRoom = Util.data.getStonesInLocation(state, this.props.sphereId, roomId);
      let stoneIdsInRoom = Object.keys(stonesInRoom);
      if (stoneIdsInRoom.length > 0) {
        let label = "CROWNSTONES NOT IN A ROOM";
        if (roomId !== null) {
          label = "CROWNSTONES IN " + rooms[roomId].config.name.toUpperCase();
        }

        items.push({label: label, type:'explanation', below:false});
        let elementIds = {}
        stoneIdsInRoom.forEach((stoneId) => {
          let stone = stones[stoneId];
          elementIds[stoneId] = Util.data.getElement(store, this.props.sphereId, stoneId, stone);
        })
        stoneIdsInRoom.sort((a,b) => { return elementIds[a].config.name > elementIds[b].config.name ? 1 : -1 })

        stoneIdsInRoom.forEach((stoneId) => {
          let stone = stones[stoneId];
          let element = elementIds[stoneId]
          this._pushCrownstoneItem(items, this.props.sphereId, element, stone, stoneId);
        })
      }
    }

    roomIds.forEach((roomId) => {
      renderStonesInRoom(roomId)
    })

    renderStonesInRoom(null)

    items.push({label: "This is an overview of all your Crownstones. To access the settings of these Crownstones, go to their rooms and tap on them there.", type:'explanation', below:true});


    items.push({
      label: 'Add a Crownstone',
      largeIcon: <Icon name="c3-addRoundedfilled" size={60} color={colors.green.hex} style={{position: 'relative', top: 2}}/>,
      style: {color: colors.menuTextSelected.hex, fontWeight: 'bold'},
      type: 'button',
      callback: () => {
        if (Permissions.inSphere(this.props.sphereId).canSetupCrownstone) {
          addCrownstoneExplanationAlert()
        }
        else {
          Alert.alert("Ask your Sphere Admin","Admins can add new Crownstones to Spheres. If you have a new Crownstone you'd like to add, ask the sphere Admin.",[{text:"OK"}]);
        }
      }
    });



    items.push({type:'spacer'});
    items.push({type:'spacer'});

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} hasNavBar={false}>
        <OrangeLine/>
        <ScrollView keyboardShouldPersistTaps="always">
          <ListEditableItems items={this._getItems()} separatorIndent={false} />
        </ScrollView>
      </Background>
    );
  }
}
