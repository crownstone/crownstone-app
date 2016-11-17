import React, { Component } from 'react'
import {
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  View
} from 'react-native';
import { styles, colors } from '../styles'
import { enoughCrownstonesForIndoorLocalization } from '../../util/dataUtil'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'

var Actions = require('react-native-router-flux').Actions;

export class DeviceBehaviourEdit extends Component {
  componentDidMount() {
    const { store } = this.props;
    this.unsubscribe = store.subscribe(() => {
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

  _getStateLabel(device, event) {
    if (device.behaviour[event].active === false) {
      return 'No Change';
    }
    else if (device.behaviour[event].state < 1 && device.behaviour[event].state > 0) {
      return 'On (' + Math.round(100 * device.behaviour[event].state) + '%)'
    }
    else if (device.behaviour[event].state === 1) {
      return 'On'
    }

    return 'Off'
  }

  _getDelayLabel(device, event) {
    let delay = Math.floor(device.behaviour[event].delay);

    if (delay === undefined || delay == 0)
      return '';

    if (device.behaviour[event].active === false)
      return '';

    if (delay < 60) {
      return 'after ' + Math.floor(delay) + ' seconds';
    }
    else {
      return 'after ' + Math.floor(delay/60) + ' minutes';
    }
  }

  _getTitle(eventName, fewCrownstones = false) {
    switch (eventName) {
      case 'onHomeEnter':
        if (fewCrownstones)
          return 'When In Range';
        else
          return 'Entering House';
      case 'onHomeExit':
        if (fewCrownstones)
          return 'Out of Range';
        else
          return 'Leaving House';
      case 'onRoomEnter':
        return 'Entering Room';
      case 'onRoomExit':
        return 'Leaving Room';
      case 'onNear':
        return 'Close By';
      case 'onAway':
        return 'Further Away';
      default:
        return '--- invalid event: ' + eventName;
    }
  }

  constructOptions(device, stone, canDoIndoorLocalization) {
    let requiredData = {sphereId: this.props.sphereId, locationId: this.props.locationId, stoneId: this.props.stoneId, applianceId: stone.config.applianceId, viewingRemotely: this.props.viewingRemotely};
    let items = [];

    let toDeviceStateSetup = (eventName) => {Actions.deviceStateEdit({eventName, title: this._getTitle(eventName, canDoIndoorLocalization === false), ...requiredData})};

    if (canDoIndoorLocalization === false) {
      // Behaviour for onHomeEnter event
      let eventLabel = 'onHomeEnter';
      items.push({label:'WHEN YOU GET WITHIN RANGE', type: 'explanation', style: styles.topExplanation, below:false});
      items.push({label:this._getStateLabel(device, eventLabel, true), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});

      // Behaviour for onHomeExit event
      eventLabel = 'onHomeExit';
      items.push({label:'WHEN YOU MOVE OUT OF RANGE', type: 'explanation',  below:false});
      items.push({label:this._getStateLabel(device, eventLabel, true), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});
      items.push({label:'If there are still people (from your sphere) left in range, this will not be triggered.', type: 'explanation',  below:true});

      // Behaviour for onNear event
      eventLabel = 'onNear';
      items.push({label:'WHEN YOU GET CLOSE', type: 'explanation', style:{paddingTop:0}, below:false});
      items.push({label:this._getStateLabel(device, eventLabel, true), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});
      items.push({label:'Will trigger when you are roughly within a few meters.', type: 'explanation',  below:true});

      // Behaviour for onAway event
      eventLabel = 'onAway';
      items.push({label:'WHEN YOU MOVE FURTHER AWAY', type: 'explanation', style:{paddingTop:0}, below:false});
      items.push({label:this._getStateLabel(device, eventLabel, true), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});
      items.push({label:'Will trigger when you move out of the near zone.', type: 'explanation',  below:true});
    }
    else {
      // Behaviour for onHomeEnter event
      let eventLabel = 'onHomeEnter';
      items.push({label:'WHEN YOU COME HOME', type: 'explanation', style: styles.topExplanation, below:false});
      items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});

      // Behaviour for onHomeExit event
      eventLabel = 'onHomeExit';
      items.push({label:'WHEN YOU LEAVE YOUR HOME', type: 'explanation',  below:false});
      items.push({label:this._getStateLabel(device, eventLabel), value: this._getDelayLabel(device, eventLabel), type: 'navigation', valueStyle:{color:'#888'}, callback:toDeviceStateSetup.bind(this,eventLabel)});
      items.push({label:'If there are still people (from your sphere) left in the house, this will not be triggered.', type: 'explanation',  below:true});

      if (stone.config.locationId !== null) {
        // Behaviour for onRoomEnter event
        eventLabel = 'onRoomEnter';
        items.push({label: 'WHEN YOU ENTER THE ROOM', type: 'explanation', below: false, style: {paddingTop: 0}});
        items.push({
          label: this._getStateLabel(device, eventLabel),
          value: this._getDelayLabel(device, eventLabel),
          type: 'navigation',
          valueStyle: {color: '#888'},
          callback: toDeviceStateSetup.bind(this, eventLabel)
        });

        // Behaviour for onRoomExit event
        eventLabel = 'onRoomExit';
        items.push({label: 'WHEN YOU LEAVE THE ROOM', type: 'explanation', below: false});
        items.push({
          label: this._getStateLabel(device, eventLabel),
          value: this._getDelayLabel(device, eventLabel),
          type: 'navigation',
          valueStyle: {color: '#888'},
          callback: toDeviceStateSetup.bind(this, eventLabel)
        });
        items.push({
          label: 'If there are still people (from your sphere) left in the room, this will not be triggered.',
          type: 'explanation',
          below: true
        });
      }
      else if (canDoIndoorLocalization === true) {
        items.push({label: 'Since this Crownstone is not in a room, we cannot give it behaviour for entering or leaving it\'s room.', type: 'explanation', below: false});
      }
    }

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let canDoIndoorLocalization = enoughCrownstonesForIndoorLocalization(state, this.props.sphereId);
    let stone   = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let options = [];
    if (stone.config.applianceId) {
      let device = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      options = this.constructOptions(device, stone, canDoIndoorLocalization);
    }
    else {
      options = this.constructOptions(stone, stone, canDoIndoorLocalization);
    }

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);
    return (
      <Background image={backgroundImage} >
        <ScrollView>
          <ListEditableItems items={options}/>
        </ScrollView>
      </Background>
    )
  }
}
