import React, { Component } from 'react'
import {
  Alert,
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
var Actions = require('react-native-router-flux').Actions;

import { styles, colors } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditableItem } from '../components/EditableItem'
import { Explanation } from '../components/editComponents/Explanation'
import { EditSpacer } from '../components/editComponents/EditSpacer'
var Icon = require('react-native-vector-icons/Ionicons');



export class DeviceEdit extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }


  // TODO: make options for empty crownstones
  constructOptions(store, device, stone) {
    let requiredData = {
      groupId: this.props.groupId,
      locationId: this.props.locationId,
      stoneId: this.props.stoneId,
      applianceId: stone.config.applianceId
    };
    let items = [];

    let toBehaviour = () => { Actions.deviceBehaviourEdit(requiredData) };
    let toSchedule  = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};
    /*Actions.deviceScheduleEdit(requiredData) */
    let toLinkedDevices = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};
    // Crownstone Name:
    items.push({label:'Device Name', type: 'textEdit', value:device.config.name, callback: (newText) => {
      store.dispatch({...requiredData, type:'UPDATE_APPLIANCE_CONFIG', data:{name:newText}});
    }});

    // icon picker
    items.push({label:'Icon', type: 'icon', value: device.config.icon, callback: () => {}});

    // icon picker
    items.push({label:'Unplug Device', type: 'button', style: {color:colors.blue.h}, callback: () => {}});

    // // dimmable
    // items.push({label:'Dimmable', type: 'switch', value:device.config.dimmable, callback: (newValue) => {
    //     store.dispatch({...requiredData, type:'UPDATE_STONE_CONFIG', data:{dimmable:newValue}});
    // }});

    // unplugging explanation
    items.push({label:'Unplugging will revert the behaviour back to the empty Crownstone configuration.', type: 'explanation',  below:true});


    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:toBehaviour});

    // behaviour explanation
    items.push({label:'Customize how Crownstone reacts to your presence.', type: 'explanation',  below:true});

    // schedule link
    items.push({label:'Schedule', type: 'navigation', callback:toSchedule});

    // schedule explanation
    items.push({label:'Schedule when Crownstone should turn your device on or off.' +
    ' You can choose if this schedule will overrule the behaviour based on your presence', type: 'explanation',  below:true});

    // linked devices link
    items.push({label:'Linked Devices', type: 'navigation', callback:toLinkedDevices});

    // linked devices explanation
    items.push({label:'Let other Crownstones react when this device turns on or off by manual input.' +
    ' Manual input here is either through the app or by turning the device physically off. ' +
    'Switching based on presence is not used for this.', type: 'explanation',  below:true});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const stone  = state.groups[this.props.groupId].stones[this.props.stoneId];


    let options = [];
    if (stone.config.applianceId !== undefined) {
      let device = state.groups[this.props.groupId].appliances[stone.config.applianceId];
      options = this.constructOptions(store, device, stone);
    }
    else {
      options = this.constructOptions(store, stone, stone);
    }


    return (
      <Background>
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options.slice(0,3)} separatorIndent={true} />
          <ListEditableItems items={options.slice(3,options.length)}/>
        </ScrollView>
      </Background>
    )
  }
}
