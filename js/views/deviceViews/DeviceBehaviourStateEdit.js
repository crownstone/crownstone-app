import React, {
  Component,
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
import { SlideFadeInView }        from '../components/animated/SlideFadeInView'
var Actions = require('react-native-router-flux').Actions;

import {stylesIOS, colors} from '../styles'
let styles = stylesIOS;

export class DeviceStateEdit extends Component {
  componentDidMount() {
    this.unsubscribe = this.props.store.subscribe(() => {
      this.forceUpdate();
    })
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  _getTopExplanation() {
    switch(this.props.eventName) {
      case 'onHomeEnter':
        return 'SHOULD THE DEVICE REACT TO YOU ENTERING THE HOUSE?';
      case 'onHomeExit':
        return 'SHOULD THE DEVICE REACT TO YOU LEAVING THE HOUSE?';
      case 'onRoomEnter':
        return 'SHOULD THE DEVICE REACT TO YOU ENTERING THE ROOM?';
      case 'onRoomExit':
        return 'SHOULD THE DEVICE REACT TO YOU LEAVING THE ROOM?';
      default:
        return '--- invalid event: ' + this.props.eventName;
    }
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
      default:
        return '--- invalid event: ' + this.props.eventName;
    }
  }


  _getDelayLabel(currentBehaviour) {
    switch(currentBehaviour.delay) {
      case 0:
        return 'None';
      case 60:
        return "1 Minute";
      default:
        return Math.floor(currentBehaviour.delay/60) + ' Minutes';
    }
  }

  constructOptions(store, device) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId, stoneId: this.props.stoneId};
    let currentBehaviour = device.behaviour[this.props.eventName];
    let items = [];

    // behaviour explanation
    items.push({label:"Device Responds", value: currentBehaviour.active, type: 'switch', callback:(newValue) => {
      store.dispatch({
        ...requiredData,
        type: 'UPDATE_BEHAVIOUR_FOR_' + this.props.eventName,
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

  constructStateOptions(store, device) {
    let requiredData = {groupId: this.props.groupId, locationId: this.props.locationId, stoneId: this.props.stoneId};
    let currentBehaviour = device.behaviour[this.props.eventName];
    let items = [];

    items.push({label: "NEW STATE", type: 'explanation', below: false});
    // Dimming control
    if (device.config.dimmable === true) {
      //TODO: DIMMING CONTROL IS BROKEN, could be fixed by passing panHandlers in RN 0.23?
      items.push({label:"State", value: currentBehaviour.state, type: 'slider', callback:(newValue) => {
        store.dispatch({
          ...requiredData,
          type: 'UPDATE_BEHAVIOUR_FOR_' + this.props.eventName,
          data: {state: newValue}
        });
      }});
      items.push({label: 'When you ' + this._getExplanationLabel() + ', the light is dimmed to the level you specify here.', type: 'explanation', below: true});
    }
    else {
      items.push({label:"State", value: currentBehaviour.state === 1, type: 'switch', callback:(newValue) => {
        store.dispatch({
          ...requiredData,
          type: 'UPDATE_BEHAVIOUR_FOR_' + this.props.eventName,
          data: {state: newValue ? 1 : 0}
        });
      }});
      items.push({label:'The device will switched to match the state when you ' + this._getExplanationLabel() + '.', type: 'explanation', below: true});
    }

    items.push({label:"Delay", value: this._getDelayLabel(currentBehaviour), valueStyle:styles.rightNavigationValue, type: 'navigation',  callback:() => {
      Actions.delaySelection({
        ...requiredData,
        extractionMethod: (device) => {return device.behaviour[this.props.eventName].delay;},
        callback: (newValue) => {
          store.dispatch({
            ...requiredData,
            type: 'UPDATE_BEHAVIOUR_FOR_' + this.props.eventName,
            data: {delay: newValue}
          });
        }
      })
    }});
    items.push({label:'You can set a delay between when you ' + this._getExplanationLabel() + ' and when the device responds to it. If the device is switched by something before this delay has finished, the first event will be discarded.', type: 'explanation', below: true});

    return items;
  }

  render() {
    const store   = this.props.store;
    const state   = store.getState();
    const room    = state.groups[this.props.groupId].locations[this.props.locationId];
    const device  = room.stones[this.props.stoneId];
    let currentBehaviour = device.behaviour[this.props.eventName];

    let options = this.constructOptions(store, device);
    let stateOptions = this.constructStateOptions(store, device);
    return (
      <Background>
        <ScrollView>
          <EditSpacer top={true} />
          <ListEditableItems items={options}/>
          <SlideFadeInView height={300} visible={currentBehaviour.active}>
            <ListEditableItems items={stateOptions}/>
          </SlideFadeInView>
        </ScrollView>


      </Background>
    )
  }
}
