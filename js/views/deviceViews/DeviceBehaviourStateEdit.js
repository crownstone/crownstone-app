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
import { Background }        from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { EditSpacer }        from '../components/editComponents/EditSpacer'
import { SlideFadeInView }   from '../components/animated/SlideFadeInView'
import { LOG }               from '../../logging/Log'
var Actions = require('react-native-router-flux').Actions;
import { styles, colors} from '../styles'


export class DeviceStateEdit extends Component {
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


  _getExplanationLabel() {
    switch (this.props.eventName) {
      case 'onHomeEnter':
        return 'enter the house';
      case 'onHomeExit':
        return 'leave the house';
      case 'onRoomEnter':
        return 'enter the room';
      case 'onRoomExit':
        return 'leave the room';
      case 'onNear':
        return 'come near';
      case 'onAway':
        return 'are further away';
      default:
        return '--- invalid event: ' + this.props.eventName;
    }
  }


  _getDelayLabel(currentBehaviour) {
    let delay = currentBehaviour.delay;

    if (delay === undefined || delay == 0)
      return 'None';

    if (delay < 60) {
      return 'after ' + Math.floor(delay) + ' seconds';
    }
    else {
      return 'after ' + Math.floor(delay/60) + ' minutes';
    }
  }


  _getBaseActionString(stone) {
    if (stone.config.applianceId === null) {
      return "UPDATE_STONE_BEHAVIOUR_FOR_";
    }
    return "UPDATE_APPLIANCE_BEHAVIOUR_FOR_";
  }

  constructOptions(store, device, stone) {
    let requiredData = {sphereId: this.props.sphereId, stoneId: this.props.stoneId, applianceId: stone.config.applianceId};
    let currentBehaviour = device.behaviour[this.props.eventName];
    
    let items = [];

    let actionBase = this._getBaseActionString(stone);

    // behaviour explanation
    items.push({label:"Device Responds", value: currentBehaviour.active, type: 'switch', callback:(newValue) => {
      store.dispatch({
        ...requiredData,
        type: actionBase + this.props.eventName,
        data: {active: newValue}
      });
    }});
    if (currentBehaviour.active === false) {
      items.push({
        label: 'If you want this device to respond to you when you ' + this._getExplanationLabel() + ', enable Device Responds.',
        style: {height: 0},
        type: 'explanation',
        below: true
      });
    }
    return items;
  }

  constructStateOptions(store, device, stone) {
    let requiredData = {sphereId: this.props.sphereId, stoneId: this.props.stoneId, applianceId: stone.config.applianceId};
    let currentBehaviour = device.behaviour[this.props.eventName];
    let items = [];

    let actionBase = this._getBaseActionString(stone);

    items.push({label: "NEW STATE", type: 'explanation', below: false});
    // Dimming control
    if (device.config.dimmable === true) {
      //TODO: DIMMING CONTROL IS BROKEN, could be fixed by passing panHandlers in RN 0.23?
      items.push({label:"State", value: currentBehaviour.state, type: 'slider', callback:(newValue) => {
        store.dispatch({
          ...requiredData,
          type: actionBase + this.props.eventName,
          data: {state: newValue}
        });
      }});
      items.push({label: 'When you ' + this._getExplanationLabel() + ', the light is dimmed to the level you specify here.', type: 'explanation', below: true});
    }
    else {
      items.push({label:"State", value: currentBehaviour.state === 1, type: 'switch', callback:(newValue) => {
        store.dispatch({
          ...requiredData,
          type: actionBase + this.props.eventName,
          data: {state: newValue ? 1 : 0}
        });
      }});
      items.push({label:'The device will switched to match the state when you ' + this._getExplanationLabel() + '.', type: 'explanation', below: true});
    }


    let options = [];
    if (this.props.eventName === "onHomeEnter" || this.props.eventName === "onRoomEnter") {
      options.push({label: 'None', type: 'checkbar', value: 0});
      options.push({label: '2 seconds', type: 'checkbar', value: 2});
      options.push({label: '10 seconds', type: 'checkbar', value: 10});
      options.push({label: '1 Minute', type: 'checkbar', value: 60});
    }
    options.push({label:'2 Minutes',  type: 'checkbar', value: 120});
    options.push({label:'5 Minutes',  type: 'checkbar', value: 300});
    options.push({label:'10 Minutes', type: 'checkbar', value: 600});
    options.push({label:'15 Minutes', type: 'checkbar', value: 900});
    options.push({label:'30 Minutes', type: 'checkbar', value: 1800});


    items.push({
      type:'dropdown',
      label:'Delay',
      value: currentBehaviour.delay,
      valueLabel: this._getDelayLabel(currentBehaviour),
      // buttons:true,
      dropdownHeight:130,
      items:options,
      callback: (newValue) => {
        LOG("new Value", newValue);
        store.dispatch({
          ...requiredData,
          type: actionBase + this.props.eventName,
          data: {delay: newValue}
        });
      }
    });

    // items.push({label:"Delay", value: this._getDelayLabel(currentBehaviour), valueStyle:styles.rightNavigationValue, type: 'navigation',  callback:() => {
    //   Actions.delaySelection({
    //     ...requiredData,
    //     extractionMethod: (device) => {return device.behaviour[this.props.eventName].delay;},
    //     callback: (newValue) => {
    //       store.dispatch({
    //         ...requiredData,
    //         type: actionBase + this.props.eventName,
    //         data: {delay: newValue}
    //       });
    //     }
    //   })
    // }});
    items.push({label:'You can set a delay between when you ' + this._getExplanationLabel() + ' and when the device responds to it. If the device is switched by something before this delay has finished, the first event will be discarded.', type: 'explanation', below: true});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    let stone     = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let device = stone;
    if (stone.config.applianceId)
      device = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];

    let currentBehaviour = device.behaviour[this.props.eventName];

    let options = this.constructOptions(store, device, stone);
    let stateOptions = this.constructStateOptions(store, device, stone);
    let backgroundImage = this.props.getBackground.call(this, 'menu');
    return (
      <Background image={backgroundImage} >
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options}/>
          <SlideFadeInView  visible={currentBehaviour.active}>
            <ListEditableItems items={stateOptions}/>
          </SlideFadeInView>
        </ScrollView>


      </Background>
    )
  }
}
