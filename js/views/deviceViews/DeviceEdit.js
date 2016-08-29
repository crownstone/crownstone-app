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

import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { FadeInView } from '../components/animated/FadeInView'



export class DeviceEdit extends Component {
  constructor() {
    super();
    this.state = {showStone:false};
    this.showStone = false;
  }

  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  constructStoneOptions(store, stone) {
    let requiredData = {
      groupId: this.props.groupId,
      stoneId: this.props.stoneId,
    };
    let items = [];

    let toBehaviour = () => { Actions.deviceBehaviourEdit(requiredData) };

      items.push({label:'CROWNSTONE', type: 'explanation',  below:false});
      items.push({
        label: 'Name', type: 'textEdit', value: stone.config.name, callback: (newText) => {
          store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {name: newText}});
        }
      });

      items.push({label:'PLUGGED IN DEVICE', type: 'explanation',  below:false});
      items.push({
        label: 'Select...', type: 'navigation', labelStyle: {color: colors.blue.hex}, callback: () => {
          Actions.applianceSelection({
            groupId: this.props.groupId,
            callback: (applianceId) => {
              this.showStone = false;
              store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {applianceId: applianceId}});
            }
          });
        }
      });
      items.push({label:'A Device has it\'s own configuration so you can set up once and quickly apply it to a Crownstone.', type: 'explanation',  below:true});

    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:toBehaviour});

    items.push({label: 'Customize how this Crownstone reacts to your presence.', type: 'explanation', below: true});

    return items;
  }


  constructApplianceOptions(store, appliance, applianceId) {
    let requiredData = {
      groupId: this.props.groupId,
      stoneId: this.props.stoneId,
      applianceId: applianceId
    };
    let items = [];

    let toBehaviour = () => { Actions.deviceBehaviourEdit(requiredData) };
    // let toSchedule  = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};
    // let toLinkedDevices = () => { Alert.alert("Ehh.. Hello!","This feature is not part of the demo, sorry!", [{text:'I understand!'}])};

    items.push({label:'PLUGGED IN DEVICE', type: 'explanation',  below:false});
    items.push({
      label: 'Device Name', type: 'textEdit', value: appliance.config.name, callback: (newText) => {
        store.dispatch({...requiredData, type: 'UPDATE_APPLIANCE_CONFIG', data: {name: newText}});
      }
    });

    // icon picker
    items.push({label:'Icon', type: 'icon', value: appliance.config.icon, callback: () => {
      Actions.deviceIconSelection({applianceId: applianceId, icon: appliance.config.icon, groupId: this.props.groupId})
    }});

    // unplug device
    items.push({
      label: 'Unplug Device from Crownstone', type: 'button', style: {color: colors.blue.hex}, callback: () => {
        this.showStone = true;
        setTimeout(() => {store.dispatch({...requiredData, type: 'UPDATE_STONE_CONFIG', data: {applianceId: null}});},300);
      }
    });
    items.push({label:'Unplugging will revert the behaviour back to the empty Crownstone configuration.', type: 'explanation',  below:true});

    // // dimmable
    // items.push({label:'Dimmable', type: 'switch', value:device.config.dimmable, callback: (newValue) => {
    //     store.dispatch({...requiredData, type:'UPDATE_STONE_CONFIG', data:{dimmable:newValue}});
    // }});

    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:toBehaviour});

    // behaviour explanation
    items.push({label: 'Customize how this Device reacts to your presence.', type: 'explanation', below: true});

    // // schedule link
    // items.push({label:'Schedule', type: 'navigation', callback:toSchedule});
    //
    // // schedule explanation
    // items.push({label:'Schedule when Crownstone should turn your device on or off.' +
    // ' You can choose if this schedule will overrule the behaviour based on your presence', type: 'explanation',  below:true});
    //
    // // linked devices link
    // items.push({label:'Linked Devices', type: 'navigation', callback:toLinkedDevices});
    //
    // // linked devices explanation
    // items.push({label:'Let other Crownstones react when this device turns on or off by manual input.' +
    // ' Manual input here is either through the app or by turning the device physically off. ' +
    // 'Switching based on presence is not used for this.', type: 'explanation',  below:true});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const stone   = state.groups[this.props.groupId].stones[this.props.stoneId];

    let applianceOptions = [];
    let stoneOptions = this.constructStoneOptions(store, stone);
    if (stone.config.applianceId) {
      let appliance = state.groups[this.props.groupId].appliances[stone.config.applianceId];
      applianceOptions = this.constructApplianceOptions(store, appliance, stone.config.applianceId);
    }

    return (
      <Background>
        <ScrollView>
          <FadeInView visible={!this.showStone} style={{position:'absolute', top:0, left:0, width: screenWidth}} duration={300}>
            <ListEditableItems items={applianceOptions} separatorIndent={true}/>
          </FadeInView>
          <FadeInView visible={this.showStone || applianceOptions.length == 0} style={{position:'absolute', top:0, left:0, width:screenWidth}} duration={200}>
            <ListEditableItems items={stoneOptions} separatorIndent={false}/>
          </FadeInView>
        </ScrollView>
      </Background>
    )
  }
}
