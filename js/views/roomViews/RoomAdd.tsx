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

import { TopBar } from '../components/Topbar'
import { Background } from '../components/Background'
import { IconCircle } from '../components/IconCircle'
import { ListEditableItems } from '../components/ListEditableItems'
import { getLocationNamesInSphere, getStonesAndAppliancesInLocation } from '../../util/DataUtil'
import { CLOUD } from '../../cloud/cloudAPI'
import { LOG } from '../../logging/Log'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors, screenHeight, tabBarHeight, topBarHeight } from '../styles'



export class RoomAdd extends Component<any, any> {
  refName : string;

  constructor(props) {
    super();
    this.state = {name:'', icon: 'c1-bookshelf', selectedStones: {}};
    this.refName = "listItems";
  }

  componentWillMount() {
    if (this.props.movingCrownstone) {
      let selectedStones = {};
      selectedStones[this.props.movingCrownstone] = true;
      this.setState({selectedStones:selectedStones})
    }
  }

  _pushCrownstoneItem(items, device, stone, stoneId, subtext = '') {
    items.push({
      mediumIcon: <IconCircle
        icon={device.config.icon}
        size={52}
        backgroundColor={stone.state.state > 0 && stone.config.disabled === false ? colors.green.hex : colors.menuBackground.hex}
        color={colors.white.hex}
        style={{position:'relative', top:2}} />,
      label: device.config.name,
      subtext: subtext,
      type: 'checkbar',
      value: this.state.selectedStones[stoneId] === true,
      callback: () => {
        this.state.selectedStones[stoneId] = !this.state.selectedStones[stoneId] === true;
        this.setState({selectedStones: this.state.selectedStones})
      },
      style: {color: colors.iosBlue.hex},
    });
  }

  _getItems(floatingStones) {
    let items = [];
    items.push({label:'NEW ROOM', type:'explanation', below:false});
    items.push({label:'Room Name', type: 'textEdit', placeholder:'My New Room', value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label:'Icon', type: 'icon', value: this.state.icon,
      callback: () => {
        Actions.roomIconSelection({
          icon: this.state.icon,
          sphereId: this.props.sphereId,
          selectCallback: (newIcon) => {Actions.pop(); this.setState({icon:newIcon});}
        }
      )}
    });

    let floatingStoneIds = Object.keys(floatingStones);
    let shownMovingStone = false;
    if (floatingStoneIds.length > 0) {
      items.push({label:'FLOATING CROWNSTONES', type:'explanation', below:false});
      let nearestId = this._getNearestStone(floatingStoneIds, floatingStones);
      floatingStoneIds.forEach((stoneId) => {
        // check if we have already shown the moving stone
        shownMovingStone = this.props.movingCrownstone === stoneId ? true : shownMovingStone;

        let device = floatingStones[stoneId].device;
        let stone = floatingStones[stoneId].stone;
        let subtext = stone.config.disabled === false ?
          (nearestId === stoneId ? 'Nearest' : stone.config.rssi > -60 ? 'Very near' : stone.config.rssi > -70 ? 'Near' : undefined)
          : undefined;

        this._pushCrownstoneItem(items, device, stone, stoneId, subtext);
      });
      items.push({label:'You can select floating Crownstones to immediately add them to this new room!', type:'explanation', below: true, style:{paddingBottom:0}});
    }

    if (shownMovingStone === false && this.props.movingCrownstone !== undefined) {
      items.push({label:'CURRENTLY MOVING CROWNSTONE', type:'explanation', below:false});
      let stoneId = this.props.movingCrownstone;
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[stoneId];
      let device = stone;
      if (stone.config.applianceId) {
        device = state.spheres[this.props.sphereId].appliances[stone.config.applianceId]
      }

      this._pushCrownstoneItem(items, device, stone, stoneId);
    }

    return items;
  }

  _getNearestStone(floatingStoneIds, floatingStones) {
    let rssi = -1000;
    let id = undefined;
    for (let i = 0; i < floatingStoneIds.length; i++) {
      let stone = floatingStones[floatingStoneIds[i]].stone;
      if (stone.config.rssi && rssi < stone.config.rssi && stone.config.disabled === false) {
        rssi = stone.config.rssi;
        id = floatingStoneIds[i];
      }
    }
    return id;
  }

  createRoom() {
    // make sure all text fields are blurred
    this.props.eventBus.emit("inputComplete");
    setTimeout(() => { this._createRoom(); }, 20);
  }

  _createRoom() {
    const store = this.props.store;
    const state = store.getState();

    if (this.state.name.length === 0) {
      Alert.alert(
        'Room name must be at least 1 character long.',
        'Please change the name and try again.',
        [{text:'OK'}]
      )
    }
    else {
      // check if the room name is unique.
      let existingLocations = getLocationNamesInSphere(state, this.props.sphereId);
      if (existingLocations[this.state.name] === undefined) {
        this.props.eventBus.emit('showLoading', 'Creating room...');
        CLOUD.forSphere(this.props.sphereId).createLocation({name: this.state.name, icon: this.state.icon})
          .then((reply) => {
            if (this.props.fromMovingView === true) {
              // TODO: implemented this way because of broken pop structure in router-flux
              Actions.pop({popNum:2});
              Actions.pop();
            }
            else {
              Actions.pop();
            }

            this.props.eventBus.emit('hideLoading');
            let actions =  [];

            actions.push({type:'ADD_LOCATION', sphereId: this.props.sphereId, locationId: reply.id, data:{name: this.state.name, icon: this.state.icon}});

            // move the selected stones into the location.
            let floatingStoneIds = Object.keys(this.state.selectedStones);
            floatingStoneIds.forEach((floatingStoneId) => {
              if (this.state.selectedStones[floatingStoneId] === true) {
                actions.push({sphereId: this.props.sphereId, stoneId: floatingStoneId, type: "UPDATE_STONE_LOCATION", data: {locationId: reply.id}});
              }
            });

            store.batchDispatch(actions);

            setTimeout(() => {
              Actions.roomOverview({sphereId: this.props.sphereId, locationId: reply.id, title:this.state.name, store: store, seeStoneInSetupMode: false});
            }, 0);
          })
          .catch((err) => {
            LOG.error("RoomAdd: Something went wrong with creation of rooms", err);
            let defaultActions = () => {this.props.eventBus.emit('hideLoading');};
            Alert.alert("Whoops!", "Something went wrong, please try again later!",[{text:"OK", onPress: defaultActions}], { onDismiss: defaultActions })
          })
      }
      else {
        Alert.alert(
          'Room already exists.',
          'Please change the name and try again.',
          [{text:'OK'}]
        );
      }
    }
  }

  render() {
    let state = this.props.store.getState();
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    if (this.props.sphereId === null) {
      Actions.pop();
      return <View />
    }

    let floatingStones = getStonesAndAppliancesInLocation(state, this.props.sphereId, null);
    let amountOfFloatingStones = Object.keys(floatingStones).length;
    let items = this._getItems(floatingStones);

    let itemHeight = amountOfFloatingStones * 62 + (items.length - amountOfFloatingStones)*50 + 120;
    return (
      <Background hideInterface={true} image={backgroundImage} >
        <TopBar
          notBack={true}
          left={'Cancel'}
          leftStyle={{color:colors.white.hex, fontWeight: 'bold'}}
          leftAction={ Actions.pop }
          right={'Create'}
          rightStyle={{fontWeight: 'bold'}}
          rightAction={ () => { this.createRoom(); }}
          title="Create Room"/>
        <ScrollView>
          <View style={{height: itemHeight}}>
            <ListEditableItems ref={this.refName} focusOnLoad={true} items={items} />
          </View>
        </ScrollView>
      </Background>
    );
  }
}
