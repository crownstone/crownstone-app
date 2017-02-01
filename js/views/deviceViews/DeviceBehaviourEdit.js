import React, { Component } from 'react'
import {
  TouchableOpacity,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  Text,
  Vibration,
  View
} from 'react-native';
import { styles, colors } from '../styles'
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/dataUtil'
import { Background } from '../components/Background'
import { ListEditableItems } from '../components/ListEditableItems'
import { getUUID, addDistanceToRssi }           from '../../util/util'
import { LOG } from '../../logging/Log'
import { NativeBus }         from '../../native/Proxy'
const Actions = require('react-native-router-flux').Actions;

let toggleOptions = [];
toggleOptions.push({label: 'turn on.',  value: 1});
toggleOptions.push({label: 'turn off.', value: 0});
toggleOptions.push({label: "do nothing.", value: null});

let timeOptions = [];
timeOptions.push({label: '2 seconds', type: 'checkbar', value: 2});
timeOptions.push({label: '10 seconds', type: 'checkbar', value: 10});
timeOptions.push({label: '30 seconds', type: 'checkbar', value: 30});
timeOptions.push({label: '1 Minute', type: 'checkbar', value: 60});
timeOptions.push({label: '2 Minutes', type: 'checkbar', value: 120});
timeOptions.push({label: '5 Minutes', type: 'checkbar', value: 300});
timeOptions.push({label: '10 Minutes', type: 'checkbar', value: 600});
timeOptions.push({label: '15 Minutes', type: 'checkbar', value: 900});
timeOptions.push({label: '30 Minutes', type: 'checkbar', value: 1800});

export class DeviceBehaviourEdit extends Component {
  constructor() {
    super();
    this.detectionTimeout = undefined;
    this.unsubscribeNative = undefined;
    this._uuid = getUUID();
  }

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
    clearTimeout(this.detectionTimeout);
    clearTimeout(this.pocketTimeout);
  }

  _getDelayLabel(delay) {
    if (delay < 60) {
      return Math.floor(delay) + ' seconds';
    }
    else {
      return Math.floor(delay/60) + ' minutes';
    }
  }

  defineThreshold(iBeaconId) {
    // show loading screen
    this.props.eventBus.emit("showLoading", "Determining range...");

    // make sure we don't strangely trigger stuff while doing this.
    this.props.eventBus.emit("ignoreTriggers");

    let measurements = [];

    // in case we do not measure enough samples, notify the user
    this.detectionTimeout = setTimeout(() => {
      this.unsubscribeNative();
      this.unsubscribeNative = undefined;
      Alert.alert("I'm not sure yet...", "I could not collect enough points.. Could you try again?", [{text:'OK', onPress: () => {
        this.props.eventBus.emit("hideLoading");
        this.props.eventBus.emit("useTriggers");

        // notify the user when the measurement failed
        Vibration.vibrate(400, false);

      }}]);
    }, 10000);


    // listen to all advertisements
    this.unsubscribeNative = NativeBus.on(NativeBus.topics.iBeaconAdvertisement, (data) => {
      data.forEach((iBeaconAdvertisement) => {
        // filter for our crownstone with only valid rssi measurements. We force the strings to lowercase to avoid os interpretation of UUIDs
        if (iBeaconId && iBeaconAdvertisement && iBeaconId.toLowerCase() === iBeaconAdvertisement.id.toLowerCase() && iBeaconAdvertisement.rssi < 0) {
          measurements.push(iBeaconAdvertisement.rssi);
        }
      });
      if (measurements.length > 3) {
        clearTimeout(this.detectionTimeout);

        // unsubscribe from the iBeacon messages
        this.unsubscribeNative();
        this.unsubscribeNative = undefined;

        // get average rssi
        let total = 0;
        measurements.forEach((measurement) => {
          total += measurement;
        });

        let average = Math.round(total / measurements.length);
        let averageCorrected = addDistanceToRssi(average, 0.5); // the + 0.5 meter makes sure the user is not defining a place where he will sit: on the threshold.

        // update trigger range.
        this.props.store.dispatch({
          type:     "UPDATE_STONE_CONFIG",
          sphereId: this.props.sphereId,
          stoneId:  this.props.stoneId,
          data: { nearThreshold: averageCorrected }
        });

        // tell the user it was a success!
        this.props.eventBus.emit("showLoading", "Great!");

        // notify the user when the measurement is complete!
        Vibration.vibrate(400, false);

        Alert.alert("Great!", "I'll make sure to respond when you are within this range! When you move out and move back in I can start to respond!", [{
          text: 'OK', onPress: () => {
            this.props.eventBus.emit("hideLoading");
            this.props.eventBus.emit("useTriggers");
          }
        }]);
      }
    });
  }

  constructOptions(state, device, stone, canDoIndoorLocalization) {
    let requiredData = {sphereId: this.props.sphereId, stoneId: this.props.stoneId, applianceId: stone.config.applianceId, viewingRemotely: this.props.viewingRemotely};
    let items = [];

    let generateDelayField = (eventLabel, label) => {
      return {
        type: 'dropdown',
        label: label,
        labelStyle: {fontSize:14, paddingLeft:15},
        valueRight: true,
        valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize:14},
        value: device.behaviour[eventLabel].delay,
        valueLabel: this._getDelayLabel(device.behaviour[eventLabel].delay),
        items: timeOptions,
        callback: (newValue) => {
          this.props.store.dispatch({...requiredData, type: "UPDATE_STONE_BEHAVIOUR_FOR_" + eventLabel, data: {delay: newValue}})
        }
      };
    };

    let generateDropdown = (eventLabel, label, options) => {
      return {
        type: 'dropdown',
        label: label,
        valueRight: true,
        valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize:14},
        value: device.behaviour[eventLabel].active === true ? device.behaviour[eventLabel].state : null,
        labelStyle: {fontSize:14},
        items: options,
        callback: (newValue) => {
          if (newValue === null) {
            this.props.store.dispatch({...requiredData, type: "UPDATE_STONE_BEHAVIOUR_FOR_" + eventLabel, data: {active: false}})
          }
          else {
            this.props.store.dispatch({...requiredData, type: "UPDATE_STONE_BEHAVIOUR_FOR_" + eventLabel, data: {state: newValue ? 1 : 0, active: true}})
          }
        }
      }
    };

    // Behaviour for onHomeEnter event
    let eventLabel = 'onHomeEnter';
    items.push({label:'ENTERING AND LEAVING THE SPHERE', type: 'explanation', style: styles.topExplanation, below:false});
    items.push(generateDropdown(eventLabel, 'When I enter the Sphere', toggleOptions));

    eventLabel = 'onHomeExit';
    items.push(generateDropdown(eventLabel, 'When I leave for ' + this._getDelayLabel(state.spheres[this.props.sphereId].config.exitDelay), toggleOptions));
    items.push({label:'If there are still people (from your Sphere) left in the Sphere, this will not be triggered. The "Leave" delay is defined per Sphere in the Sphere settings.', type: 'explanation',  below:true});


    if (canDoIndoorLocalization === false) {
      eventLabel = 'onNear';
      items.push({label:'BEING NEAR OR AWAY FROM THE CROWNSTONE', type: 'explanation', style: styles.topExplanation, below:false});
      items.push(generateDropdown(eventLabel, 'When I get near', toggleOptions));

      eventLabel = 'onAway';
      items.push(generateDropdown(eventLabel, "When I'm away for " + this._getDelayLabel(device.behaviour[eventLabel].delay), toggleOptions));

      if (device.behaviour[eventLabel].active === true) {
        items.push(generateDelayField(eventLabel,'Delay when away'))
      }

      let defineCallback = () => {
        let state = this.props.store.getState();
        let iBeaconUUID = state.spheres[this.props.sphereId].config.iBeaconUUID;
        let iBeaconId = iBeaconUUID + ".Maj:" + stone.config.iBeaconMajor + ".Min:" + stone.config.iBeaconMinor;

        Alert.alert(
          "How near is near?",
          "You can choose the switching point between near and far! After you press OK you have 5 seconds to hold your phone where it usually is (in your pocket?)",
          [{text: 'Cancel', style: 'cancel'}, {
            text: 'OK', onPress: () => {
              // show loading bar
              this.props.eventBus.emit("showLoading", "Put your phone in your pocket or somewhere it usually is!");
              this.pocketTimeout = setTimeout(() => {
                this.defineThreshold(iBeaconId)
              }, 5000);
            }
          }]
        );
      };
      if ((device.behaviour['onNear'].active === true || device.behaviour['onAway'].active === true) && stone.config.nearThreshold === null) {
        items.push({
          type: 'button',
          label: 'Define Near',
          style: {color: colors.iosBlue.hex, fontSize: 14, fontWeight: '600'},
          callback: defineCallback
        });
        items.push({label:'You will need to define near before you can use this feature.', type: 'explanation',  below:true});
      }
      else {
        items.push({
          type: 'button',
          label: 'Define Near',
          style: {color: colors.iosBlue.hex, fontSize: 14},
          callback: defineCallback
        });
        items.push({label:'Away will trigger when you move out of the Near range.', type: 'explanation',  below:true});
      }

    }
    else {
      if (stone.config.locationId !== null) {
        eventLabel = 'onRoomEnter';
        items.push({label:'ENTERING AND LEAVING THE ROOM', type: 'explanation', style: styles.topExplanation, below:false});
        items.push(generateDropdown(eventLabel, 'When I enter the room', toggleOptions));

        eventLabel = 'onRoomExit';
        items.push(generateDropdown(eventLabel, 'When I leave for ' + this._getDelayLabel(device.behaviour[eventLabel].delay), toggleOptions));

        if (device.behaviour[eventLabel].active === true) {
          items.push(generateDelayField(eventLabel, 'Delay when leaving room'));
        }
        items.push({label:'If there are still people (from your Sphere) left in the room, Leave will not be triggered. The delay is to avoid switching too quickly.', type: 'explanation',  below:true});
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
    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
    let stone   = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let options = [];
    if (stone.config.applianceId) {
      let device = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      options = this.constructOptions(state, device, stone, canDoIndoorLocalization);
    }
    else {
      options = this.constructOptions(state, stone, stone, canDoIndoorLocalization);
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
