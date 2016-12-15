import React, { Component } from 'react'
import {
  Alert,
  TouchableOpacity,
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
import { getUUID }           from '../../util/util'
import { getAiData }         from '../../util/dataUtil'
import { BleUtil }           from '../../native/BleUtil'
import { NativeBus }         from '../../native/Proxy'
import { Vibration }         from 'react-native'
const Actions = require('react-native-router-flux').Actions;
import { styles, colors} from '../styles'
import { TYPES } from '../../router/store/reducers/stones'

export class DeviceStateEdit extends Component {
  constructor() {
    super();
    this.detectionTimeout = undefined;
    this.unsubscribeNative = undefined;
    this.stopHFScanning = undefined;
    this._uuid = getUUID();
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
    clearTimeout(this.detectionTimeout);
    clearTimeout(this.pocketTimeout);
    if (this.unsubscribeNative) {
      this.unsubscribeNative();
    }

    // stop the high frequency scanning
    if (this.stopHFScanning)
      this.stopHFScanning();
    this.props.eventBus.emit("useTriggers");
  }


  _getExplanationLabel() {
    switch (this.props.eventName) {
      case TYPES.HOME_ENTER:
        return 'enter the house';
      case TYPES.HOME_EXIT:
        return 'leave the house';
      case TYPES.ROOM_ENTER:
        return 'enter the room';
      case TYPES.ROOM_EXIT:
        return 'leave the room';
      case TYPES.NEAR:
        return 'come near';
      case TYPES.AWAY:
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
    let requiredData = {
      sphereId: this.props.sphereId,
      stoneId: this.props.stoneId,
      applianceId: stone.config.applianceId
    };
    let currentBehaviour = device.behaviour[this.props.eventName];
    let items = [];

    let actionBase = this._getBaseActionString(stone);

    items.push({label: "NEW STATE", type: 'explanation', below: false});
    // Dimming control
    if (device.config.dimmable === true) {
      items.push({
        label: "State", value: currentBehaviour.state, type: 'slider', callback: (newValue) => {
          store.dispatch({
            ...requiredData,
            type: actionBase + this.props.eventName,
            data: {state: newValue}
          });
        }
      });
      items.push({
        label: 'When you ' + this._getExplanationLabel() + ', the light is dimmed to the level you specify here.',
        type: 'explanation',
        below: true
      });
    }
    else {
      items.push({
        label: "State", value: currentBehaviour.state === 1, type: 'switch', callback: (newValue) => {
          store.dispatch({
            ...requiredData,
            type: actionBase + this.props.eventName,
            data: {state: newValue ? 1 : 0}
          });
        }
      });
      items.push({
        label: 'The device will switched to match the state when you ' + this._getExplanationLabel() + '.',
        type: 'explanation',
        below: true
      });
    }


    let options = [];
    if (this.props.eventName === TYPES.HOME_ENTER || this.props.eventName === TYPES.ROOM_ENTER || this.props.eventName === TYPES.NEAR) {
      options.push({label: 'None', type: 'checkbar', value: 0});
    }
    if (this.props.eventName !== TYPES.HOME_EXIT) {
      options.push({label: '2 seconds', type: 'checkbar', value: 2});
      options.push({label: '10 seconds', type: 'checkbar', value: 10});
      options.push({label: '20 seconds', type: 'checkbar', value: 20});
      options.push({label: '30 seconds', type: 'checkbar', value: 30});
      options.push({label: '1 Minute',   type: 'checkbar', value: 60});
    }
    options.push({label: '2 Minutes',  type: 'checkbar', value: 120});
    options.push({label: '5 Minutes',  type: 'checkbar', value: 300});
    options.push({label: '10 Minutes', type: 'checkbar', value: 600});
    options.push({label: '15 Minutes', type: 'checkbar', value: 900});
    options.push({label: '30 Minutes', type: 'checkbar', value: 1800});



    if (!(this.props.eventName === TYPES.HOME_ENTER || this.props.eventName === TYPES.ROOM_ENTER || this.props.eventName === TYPES.NEAR)) {
      items.push({
        type: 'dropdown',
        label: 'Delay',
        value: currentBehaviour.delay,
        valueLabel: this._getDelayLabel(currentBehaviour),
        // buttons:true,
        dropdownHeight: 130,
        items: options,
        callback: (newValue) => {
          LOG("new Value", newValue);
          store.dispatch({
            ...requiredData,
            type: actionBase + this.props.eventName,
            data: {delay: newValue}
          });
        }
      });
      items.push({
        label: 'You can set a delay between when you ' + this._getExplanationLabel() + ' and when the device responds to it. If the device is switched by something before this delay has finished, the first event will be discarded.',
        type: 'explanation',
        below: true
      });
    }

    if (this.props.eventName === TYPES.NEAR || this.props.eventName === TYPES.AWAY) {
      items.push({
        type: 'button',
        label: 'Define Range',
        style: {color: colors.iosBlue.hex},
        callback: () => {
          let stoneHandle = stone.config.handle;
          if (stoneHandle) {
            Alert.alert(
              "How near is near?",
              "You can choose the switching point between near and far! After you press OK you have 5 seconds to hold your phone where it usually is (in your pocket?)",
              [{text: 'Cancel', style: 'cancel'}, {
                text: 'OK', onPress: () => {
                  // show loading bar
                  this.props.eventBus.emit("showLoading", "Put your phone in your pocket or somewhere it usually is!");
                  this.pocketTimeout = setTimeout(() => {
                    this.defineThreshold(stoneHandle)
                  }, 5000);
                }
              }]
            );
          }
          else {
            Alert.alert(
              "I haven't seen this Crownstone",
              "Please stand in range of this Crownstone so I can get to know it first!",
              [{text: 'OK'}]
            );
          }

        }
      });
      let ai = getAiData(store.getState(), this.props.sphereId);
      items.push({label:'Tell ' + ai.name + ' how near you will be before you want the device to respond!', type: 'explanation', below: true});
    }

    return items;
  }

  defineThreshold(stoneHandle) {
    // show loading bar
    this.props.eventBus.emit("showLoading", "Determining range...");

    // make sure we don't strangely trigger stuff while doing this.
    this.props.eventBus.emit("ignoreTriggers");

    // wait 1 sec for the user to hold the phone in the right position.
    this.detectionTimeout = setTimeout(() => {
      let measurements = [];

      // in case we dont measure enough:
      this.detectionTimeout = setTimeout(() => {
        this.unsubscribeNative();
        this.unsubscribeNative = undefined;
        Alert.alert("I'm not sure yet...", "I could not collect enough points.. Could you try again?", [{text:'OK', onPress: () => {
          this.props.eventBus.emit("hideLoading");
          this.props.eventBus.emit("useTriggers");

          // notify the user when the measurement failed
          Vibration.vibrate(400, false);

          // stop the high frequency scanning
          if (this.stopHFScanning)
            this.stopHFScanning();
        }}]);
      },4000);


      // listen to all advertisements
      this.unsubscribeNative = NativeBus.on(NativeBus.topics.advertisement, (data) => {
        // filter for our crownstone with only valid rssi measurements.
        if (stoneHandle === data.handle && data.rssi < 0) {
          measurements.push(data.rssi);

          if (measurements.length > 15) {
            clearTimeout(this.detectionTimeout);
            this.unsubscribeNative();
            this.unsubscribeNative = undefined;
            let total = 0;
            measurements.forEach((measurement) => { total += measurement; });
            let average = Math.round(total / measurements.length) - 5; // the - five makes sure the user is not defining a place where he will sit: on the threshold.
            this.props.store.dispatch({type:"UPDATE_STONE_CONFIG", sphereId: this.props.sphereId, stoneId: this.props.stoneId, data:{ nearThreshold: average }});

            // stop the high frequency scanning
            if (this.stopHFScanning)
              this.stopHFScanning();

            // tell the user it was a success!
            this.props.eventBus.emit("showLoading", "Great!");

            // notify the user when the measurement is complete!
            Vibration.vibrate(400, false);

            Alert.alert("Great!", "I'll make sure to respond when you are within this range! When you move out and move back in I can start to respond!", [{text:'OK', onPress: () => {
              this.props.eventBus.emit("hideLoading");
              this.props.eventBus.emit("useTriggers");
            }}]);
          }
        }
      });

      this.stopHFScanning = BleUtil.startHighFrequencyScanning(this._uuid, 4000);
    }, 1000)
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
    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);
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
