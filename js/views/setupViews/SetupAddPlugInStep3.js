import React, { Component } from 'react'
import {
  Alert,
  Image,
  StyleSheet,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { CLOUD } from '../../cloud/cloudAPI'
import { NativeEventsBridge } from '../../native/NativeEventsBridge'
import { BLEutil } from '../../native/BLEutil'
import { BleActions, NativeEvents } from '../../native/Proxy'
import { Icon } from '../components/Icon'
import { Background } from '../components/Background'
import { getRoomNames } from '../../util/dataUtil'
import { setupStyle, CancelButton, NextButton } from './SetupShared'
import { TextEditInput } from '../components/editComponents/TextEditInput'
import { styles, colors, screenWidth, screenHeight } from './../styles'


export class SetupAddPlugInStep3 extends Component {
  constructor(props) {
    super();
    this.state = {selectedRoom:undefined, roomName:'', addRoomEditing: false};

    // turn on the Crownstone.
    this.unsubscribeGroupEnter = null;
    let state = props.store.getState();
    if (state.app.activeGroup === undefined && state.app.activeGroup == this.props.groupId) {
      this.unsubscribeGroupEnter = NativeEventsBridge.locationEvents.on(NativeEvents.location.enterGroup,
        (groupId) => {
          if (groupId === this.props.groupId) {
            BLEutil.getProxy(props.BLEhandle).perform(BleActions.setSwitchState, 1).catch(() => {});
            this.unsubscribeGroupEnter();
            this.unsubscribeGroupEnter = null;
          }
        });
    }
    else {
      BLEutil.getProxy(props.BLEhandle).perform(BleActions.setSwitchState, 1).catch(() => {});
    }

  }

  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
    if (this.unsubscribeGroupEnter !== null) {
      this.unsubscribeGroupEnter();
    }
  }

  storeAndPickLocation(roomName) {
    this.props.eventBus.emit('showLoading', 'Creating room...');
    const { store } = this.props;
    const state = store.getState();
    CLOUD.forGroup(this.props.groupId).createLocation(roomName)
      .then((reply) => {
        this.props.eventBus.emit('hideLoading');
        this.setState({roomName:''});
        store.dispatch({type:'ADD_LOCATION', groupId: this.props.groupId, locationId: reply.id, data:{name: roomName}});
        this.setState({selectedRoom:reply.id, roomName:''});
      }).done()
  }

  getAddRoomBar() {
    const { store } = this.props;
    const state = store.getState();

    let onSubmitEditing = (roomName) => {
      if (roomName.length < 3) {
        Alert.alert(
          'Room name must be at least 3 characters long.',
          'Please change the name and try again.',
          [{text:'OK'}]
        )
      }
      else {
        // check if the room name is unique.
        let existingLocations = getRoomNames(state, this.props.groupId);
        if (existingLocations[roomName] === undefined) {
          Alert.alert(
            'Do you want add a room called \'' + roomName + '\'?',
            'You can rename and remove rooms after the setup phase.',
            [{text:'Cancel', onPress:() => {this.setState({roomName:''});}},
              {text:'Yes', onPress:() => {this.storeAndPickLocation(roomName);}}]
          );
        }
        else {
          Alert.alert(
            'Room already exists.',
            'There is already a room with this name.',
            [{text:'OK'}]
          );
        }
      }
    };

    return (
      <View style={setupStyle.roomBar}>
        <View style={setupStyle.roomBarInner}>
          {
            this.state.addRoomEditing === false ?
              <Icon name="ios-add-circle" size={28} color="white" style={{position:'relative', top:1}}/> :
              <View style={{height:30}} />
          }
          <TextEditInput
            onFocus={() => {this.setState({addRoomEditing: true})}}
            style={{flex:1, paddingLeft: this.state.addRoomEditing === false ? 10 : 0, color:'white'}}
            placeholder='Add Room'
            placeholderTextColor='#ddd'
            value={this.state.roomName}
            callback={(newValue) => {this.setState({roomName:newValue,addRoomEditing: false}); onSubmitEditing(newValue);}}
          />
        </View>
      </View>
    )
  }

  getRoomElements() {
    const { store } = this.props;
    const state = store.getState();
    let rooms = state.groups[this.props.groupId].locations;
    let roomIds = Object.keys(rooms).sort();

    let roomElements = [];
    roomIds.forEach((id) => {
      let room = rooms[id];
      roomElements.push(
        <TouchableOpacity key={'roomBar_'+id} style={setupStyle.roomBar} onPress={() => {this.setState({selectedRoom:id, roomName:''})}}>
          <View style={setupStyle.roomBarInner}>
            {this.state.selectedRoom === id ? <Icon name="ios-checkmark-circle" size={30} color={colors.green.hex} style={{position:'relative', top:2}} /> : undefined}
            <Text style={[setupStyle.information, {paddingLeft: this.state.selectedRoom === id ? 10 : 0}]}>{room.config.name}</Text>
          </View>
        </TouchableOpacity>
      );
    });

    return roomElements;
  }

  getRoomOverview() {
    return (
      <View style={{padding:20, paddingRight:0}}>
        <Text style={[setupStyle.information, {paddingLeft:0, fontWeight:'500'}]}>My Rooms:</Text>
        <ScrollView style={{height:screenHeight-440}}>
          {this.getRoomElements()}
          {this.getAddRoomBar()}
        </ScrollView>
      </View>
    );
  }


  _nextStep() {
    if (this.props.fromMainMenu === true) {
      Actions.tabBar();
    }
    else {
      Actions.setupAddPluginStep4({groupId: this.props.groupId})
    }
  }

  render() {
    const { store } = this.props;
    const state = store.getState();
    return (
      <Background hideInterface={true} image={this.props.backgrounds.setup}>
        <View style={styles.shadedStatusBar} />
        <View style={{height:30}} />
        <View style={{flex:1, flexDirection:'column'}}>
          <Text style={[setupStyle.h1, {paddingTop:0}]}>Setting up your Crownstone</Text>
          <Text style={setupStyle.text}>Great! This Crownstone has been added to your Group!</Text>
          <View style={setupStyle.lineDistance} />
          <Text style={setupStyle.information}>Where is this Crownstone located?</Text>
          {this.getRoomOverview()}
          <View style={{flex:1}} />
          <View style={setupStyle.buttonContainer}>
            <CancelButton onPress={() => {
              Alert.alert(
               "Are you sure?","You can always put Crownstones in rooms later through the Crownstone settings. " +
               "Crownstones that are not in rooms will not be used for the indoor localization, other from presence in the Group.",
               [{text:'No'},{text:'Yes, I\'m sure', onPress:()=>{
                 this._nextStep();
               }}]
              );
            }} />
            <View style={{flex:1}} />
            <NextButton onPress={() => {
              if (this.state.selectedRoom !== undefined) {
                store.dispatch({type:'UPDATE_STONE_CONFIG', groupId: this.props.groupId, stoneId: this.props.stoneId, data:{locationId: this.state.selectedRoom}});
                this._nextStep();
              }
              else {
               Alert.alert(
                  "Are you sure this Crownstone is not tied to a room?",
                  "Crownstones that are not in a room cannot be used for localization.",
                  [{text:'Cancel'}, {text:'OK', onPress: () => {
                    this._nextStep();
                  }}]
                );
              }
            }} />
        </View>
        </View>
      </Background>
    )
  }
}

