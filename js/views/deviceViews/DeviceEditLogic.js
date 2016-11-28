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
const Actions = require('react-native-router-flux').Actions;

import { styles, colors, screenWidth, screenHeight } from '../styles'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { FadeInView } from '../components/animated/FadeInView'



export class DeviceEditLogic extends Component {
  constructor() {
    super();
    this.state = {showStone:false};
    this.showStone = false;
  }

  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      // guard against deletion of the stone
      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      if (stone)
        this.forceUpdate();
      else {
        Actions.pop()
      }
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  constructStoneOptions(store, stone) {
    let requiredData = {
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      viewingRemotely: this.props.viewingRemotely
    };
    let items = [];

    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:() => { Actions.deviceBehaviourEdit(requiredData) }});

    items.push({label: 'Customize how this Crownstone reacts to your presence.', type: 'explanation', below: true});

    return items;
  }


  constructApplianceOptions(store, appliance, applianceId) {
    let requiredData = {
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      applianceId: applianceId,
      viewingRemotely: this.props.viewingRemotely
    };
    let items = [];

    //
    items.push({label: 'Customize how this Device reacts to your presence.', type: 'explanation', below: false});

    // behaviour link
    items.push({label:'Behaviour', type: 'navigation', callback:() => { Actions.deviceBehaviourEdit(requiredData) }});

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
    const stone   = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let applianceOptions = [];
    let stoneOptions = this.constructStoneOptions(store, stone);
    if (stone.config.applianceId) {
      let appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      applianceOptions = this.constructApplianceOptions(store, appliance, stone.config.applianceId);
    }

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);

    return (
      <Background image={backgroundImage} >
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
