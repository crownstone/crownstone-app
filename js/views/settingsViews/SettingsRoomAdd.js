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

import { Background } from './../components/Background'
import { ListEditableItems } from './../components/ListEditableItems'
import { getRoomNames } from './../../util/dataUtil'
import { CLOUD } from './../../cloud/cloudAPI'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors } from './../styles'




export class SettingsRoomAdd extends Component {
  constructor() {
    super();
    this.state = {name:'', icon: 'ios-document'};

  }

  _getItems() {
    const store = this.props.store;
    const state = store.getState();
    const room  = state.groups[this.props.groupId].locations[this.props.locationId];

    let items = [];
    items.push({type:'spacer'});
    items.push({label:'Room Name', type: 'textEdit', placeholder:'My New Room', value: this.state.name, callback: (newText) => {
      this.setState({name:newText});
    }});
    items.push({label:'Icon', type: 'icon', value: this.state.icon,
      callback: () => {
        Actions.roomIconSelection({
          icon: this.state.icon,
          groupId: this.props.groupId,
          selectCallback: (newIcon) => {Actions.pop(); this.setState({icon:newIcon});}
        }
      )}
    });

    items.push({type:'spacer'});
    items.push({
      label: 'Next',
      type:  'button',
      style: {color:colors.blue.hex},
      callback: () => {
        if (this.state.name.length < 3) {
          Alert.alert(
            'Room name must be at least 3 characters long.',
            'Please change the name and try again.',
            [{text:'OK'}]
          )
        }
        else {
          // check if the room name is unique.
          let existingLocations = getRoomNames(state, this.props.groupId);
          if (existingLocations[this.state.name] === undefined) {
            Alert.alert(
              'Do you want add a room called \'' + this.state.name + '\'?',
              'You can rename and remove rooms after the setup phase.',
              [{text:'Cancel', onPress:() => {}}, {text:'Yes', onPress:() => {
                this.props.eventBus.emit('showLoading', 'Creating room...');
                CLOUD.forGroup(this.props.groupId).createLocation(this.state.name)
                  .then((reply) => {
                    this.props.eventBus.emit('hideLoading');
                    store.dispatch({type:'ADD_LOCATION', groupId: this.props.groupId, locationId: reply.id, data:{name: this.state.name, icon: this.state.icon}});
                    Actions.pop();
                    Actions.settingsRoom({groupId: this.props.groupId, locationId: reply.id});
                  }).catch((err) => {Alert.alert("Whoops!", "Something went wrong, please try again later!",[{text:"OK", onPress: () => {this.props.eventBus.emit('hideLoading');}}])})
              }}]
            );
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
    });

    items.push({label:"On clicking next the room will be created in the cloud and you can start fingerprinting it.",  type:'explanation', below:true});

    return items;
  }

  render() {
    return (
      <Background image={this.props.backgrounds.menu} >
        <ScrollView>
          <ListEditableItems items={this._getItems()} />
        </ScrollView>
      </Background>
    );
  }
}
