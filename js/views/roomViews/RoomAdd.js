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
import { ListEditableItems } from './../components/ListEditableItems'
import { getLocationNamesInSphere } from './../../util/dataUtil'
import { CLOUD } from './../../cloud/cloudAPI'
import { LOGError } from './../../logging/Log'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'




export class RoomAdd extends Component {
  constructor(props) {
    super();
    this.state = {name:'', icon: 'c1-bookshelf'};
    this.refName = "listItems";
  }

  _getItems() {
    let items = [];
    items.push({label:'ADD ROOM TO ', type:'explanation', below:false});
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

    items.push({type:'spacer'});

    items.push({
      label: 'Create Room',
      type: 'button',
      style: {color: colors.iosBlue.hex},
      callback: () => { this.createRoom(); }
    });
    return items;
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
            store.dispatch({type:'ADD_LOCATION', sphereId: this.props.sphereId, locationId: reply.id, data:{name: this.state.name, icon: this.state.icon}});
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
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    if (this.props.sphereId === null) {
      Actions.pop();
      return <View />
    }

    return (
      <Background hideInterface={true} image={backgroundImage} >
        <TopBar
          notBack={false}
          leftAction={ Actions.pop }
          title="Create Room"/>
        <ScrollView>
          <ListEditableItems ref={this.refName} focusOnLoad={true} items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
