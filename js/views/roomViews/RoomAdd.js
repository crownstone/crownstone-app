import React, { Component } from 'react'
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

import { TopBar } from './../components/Topbar'
import { Background } from './../components/Background'
import { IconCircle } from './../components/IconCircle'
import { ListEditableItems } from './../components/ListEditableItems'
import { getLocationNamesInSphere, getStonesAndAppliancesInLocation } from './../../util/dataUtil'
import { CLOUD } from './../../cloud/cloudAPI'
import { LOGError } from './../../logging/Log'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors, screenHeight, tabBarHeight, topBarHeight } from './../styles'




export class RoomAdd extends Component {
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

  _getItems(floatingStones) {
    let items = [];
    items.push({label:'ADD ROOM TO', type:'explanation', below:false});
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

    items.push({label:'PLACE FLOATING CROWNSTONE IN ROOM', type:'explanation', below:false});

    let floatingStoneIds = Object.keys(floatingStones);
    if (floatingStoneIds.length > 0) {
      let nearestId = this._getNearestStone(floatingStoneIds, floatingStones);
      floatingStoneIds.forEach((stoneId) => {
        let device = floatingStones[stoneId].device;
        let stone = floatingStones[stoneId].stone;
        let subtext = stone.config.disabled === false ?
          (nearestId === stoneId ? 'Nearest' : stone.config.rssi > -60 ? 'Very near' : stone.config.rssi > -70 ? 'Near' : undefined)
          : undefined;

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
      });
    }

    items.push({type:'spacer'});

    items.push({
      label: 'Create Room',
      type: 'button',
      style: {color: colors.iosBlue.hex},
      callback: () => { this.createRoom(); }
    });
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
    // make sure all textfields are blurred
    this.props.eventBus.emit("blurAll");
    setTimeout(() => { this._createRoom(); }, 20);
  }

  _createRoom() {
    const store = this.props.store;
    const state = store.getState();

    if (this.state.name.length < 3) {
      Alert.alert(
        'Room name must be at least 3 characters long.',
        'Please change the name and try again.',
        [{text:'OK'}]
      )
    }
    else {
      // check if the room name is unique.
      let existingLocations = getLocationNamesInSphere(state, this.props.sphereId);
      if (existingLocations[this.state.name] === undefined) {
        this.props.eventBus.emit('showLoading', 'Creating room...');
        CLOUD.forSphere(this.props.sphereId).createLocation(this.state.name, this.state.icon)
          .then((reply) => {
            this.props.eventBus.emit('hideLoading');
            let actions =  [];

            actions.push({type:'ADD_LOCATION', sphereId: this.props.sphereId, locationId: reply.id, data:{name: this.state.name, icon: this.state.icon}});

            // move the selected stones into the location.
            let floatingStoneIds = Object.keys(this.state.selectedStones);
            floatingStoneIds.forEach((floatingStoneId) => {
              if (this.state.selectedStones[floatingStoneId] === true) {
                actions.push({sphereId: this.props.sphereId, locationId: floatingStoneId, type: "UPDATE_STONE_LOCATION", data: {locationId: reply.id}});
              }
            });

            store.batchDispatch(actions);

            Actions.pop();
            Actions.roomOverview({sphereId: this.props.sphereId, locationId: reply.id, title:this.state.name, store: store, seeStoneInSetupMode: false});
          }).catch((err) => {
          LOGError("Something went wrong with creation of rooms", err);
          Alert.alert("Whoops!", "Something went wrong, please try again later!",[{text:"OK", onPress: () => {this.props.eventBus.emit('hideLoading');}}])})
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
          notBack={false}
          leftAction={ Actions.pop }
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
