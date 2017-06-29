import * as React from 'react'; import { Component } from 'react';
import {
  Alert,
  PixelRatio,
  ScrollView,
  Switch,
  TextInput,
  TouchableOpacity,
  Text,
  Vibration,
  View
} from 'react-native';
import { styles, colors, screenWidth } from '../styles'
import { Background }                  from '../components/Background'
import { ListEditableItems }           from '../components/ListEditableItems'
import { Util, addDistanceToRssi }     from '../../util/Util'
import { NativeBus }                   from '../../native/libInterface/NativeBus'
import { enoughCrownstonesInLocationsForIndoorLocalization } from '../../util/DataUtil'
const Actions = require('react-native-router-flux').Actions;


let toggleOptions = [];
toggleOptions.push({label: 'turn on',    value: 1});
toggleOptions.push({label: 'turn off',   value: 0});
toggleOptions.push({label: "do nothing", value: null});

let timeOptions = [];
timeOptions.push({label: '2 seconds',    value: 2});

let timeOptionsV2 = [];
timeOptionsV2.push({label: '2 seconds',    value: 2});
timeOptionsV2.push({label: '10 seconds',   value: 10});
timeOptionsV2.push({label: '30 seconds',   value: 30});
timeOptionsV2.push({label: '1 minute',     value: 60});
timeOptionsV2.push({label: '2 minutes',    value: 120});
timeOptionsV2.push({label: '5 minutes',    value: 300});
timeOptionsV2.push({label: '10 minutes',   value: 600});
timeOptionsV2.push({label: '15 minutes',   value: 900});
timeOptionsV2.push({label: '30 minutes',   value: 1800});

export class DeviceBehaviourEdit extends Component<any, any> {
  detectionTimeout : any;
  unsubscribeNative : any;
  unsubscribe : any;
  _uuid : string;
  element : any;
  stone : any;
  pocketTimeout : any;
  viewingRemotely : any;
  canDoIndoorLocalization : boolean;

  constructor() {
    super();
    this.detectionTimeout = undefined;
    this.unsubscribeNative = undefined;
    this._uuid = Util.getUUID();
    this.element = undefined;
    this.stone = undefined;
    this.canDoIndoorLocalization = false;
  }

  componentDidMount() {
    this.unsubscribe = this.props.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      // if the stone has been deleted, close everything.
      if (change.removeStone && change.removeStone.stoneIds[this.props.stoneId]) {
        return Actions.pop();
      }

      let state = this.props.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      let applianceId = stone.config.applianceId;

      if  (
        (stone && stone.config.applianceId && change.updateApplianceConfig && change.updateApplianceConfig.stoneIds[this.props.applianceId]) ||
        (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId])
          ) {
        this.forceUpdate();
      }

      if (
        change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId] ||
        change.updateStoneBehaviour && change.updateStoneBehaviour.stoneIds[this.props.stoneId] ||
        applianceId && change.updateApplianceConfig && change.updateApplianceConfig.applianceIds[applianceId] ||
        applianceId && change.updateApplianceBehaviour && change.updateApplianceBehaviour.applianceIds[applianceId]
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount() {
    if (this.canDoIndoorLocalization === false &&
          (this.element.behaviour['onNear'].active === true || this.element.behaviour['onAway'].active === true) &&
          this.stone.config.nearThreshold === null) {
      Alert.alert(
        "Near behaviour disabled: define range first.",
        "You defined behaviour for being near and move away from a Crownstone. This feature is disabled until you define what 'near' is using the blue button.",
        [
          {text:'Later'},
          {text:'OK', onPress: () => {Actions.deviceBehaviourEdit({sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.viewingRemotely});}}
        ]);
    }

    this.unsubscribe();
    clearTimeout(this.detectionTimeout);
    clearTimeout(this.pocketTimeout);
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

      // notify the user when the measurement failed
      Vibration.vibrate(400, false);

      Alert.alert("I'm not sure yet...", "I could not collect enough points.. Could you try again?", [{text:'OK', onPress: () => {
        this.props.eventBus.emit("hideLoading");
        this.props.eventBus.emit("useTriggers");
      }}], { cancelable: false });
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
        }], { cancelable: false });
      }
    });
  }

  constructOptions(state, element, stone, canDoIndoorLocalization) {
    this.element = element;
    this.stone = stone;

    let requiredData = {sphereId: this.props.sphereId, stoneId: this.props.stoneId, applianceId: stone.config.applianceId, viewingRemotely: this.props.viewingRemotely};
    let items = [];

    let dataTypeString = "STONE";
    if (stone.config.applianceId) {
      dataTypeString = "APPLIANCE"
    }

    let addDelayFieldToItems = (items, eventLabel, label, stone) => {
      let delays = timeOptions;
      let explanation = null;
      if (stone.config.firmwareVersion) {
        if (Util.versions.isHigherOrEqual(stone.config.firmwareVersion, '2.0.0')) {
          delays = timeOptionsV2;
        }
        else {
          // In case the default value does not match with the only allowed value, force it to a higher one now. This is
          // not very clean but it is a one time event. I do not want to change the default value from 2 minutes to 2 seconds,
          // because that would not be the optimal setting for normal users.
          if (element.behaviour[eventLabel].delay !== timeOptionsV2[0].value) {
            this.props.store.dispatch({
              ...requiredData,
              type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel,
              data: {delay: timeOptionsV2[0].value}
            });
          }
          explanation = "More delay options will be enabled when this Crownstone's firmware is updated. You will be notified when this is possible.";
        }
      }
      else {
        explanation = "More delay options will be enabled when this Crownstone's firmware is identified. This will be done automatically. Please check back later.";
      }

      items.push({
        type: 'dropdown',
        label: label,
        labelStyle: { paddingLeft: 15 },
        dropdownHeight: 130,
        valueRight: true,
        buttons: delays.length === 1,
        valueStyle: {color: colors.darkGray2.hex, textAlign: 'right', fontSize: 15},
        value: element.behaviour[eventLabel].delay,
        valueLabel: Util.getDelayLabel(element.behaviour[eventLabel].delay, true),
        items: delays,
        callback: (newValue) => {
          this.props.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {delay: newValue}})
        }
      });

      if (explanation) {
        items.push({type:'explanation', label: explanation, below: true});
      }
    };

    let generateDropdown = (eventLabel, label, options) => {
      return {
        type: 'dropdown',
        label: label,
        key: eventLabel + '_dropdown',
        // labelStyle: {fontSize: 15},
        valueRight: true,
        dropdownHeight: 130,
        valueStyle: {
          color: colors.darkGray2.hex,
          textAlign: 'right',
          fontSize: 15
        },
        value: element.behaviour[eventLabel].active === true ? element.behaviour[eventLabel].state : -1,
        items: options,
        callback: (newValue) => {
          if (newValue === -1) {
            this.props.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {active: false}})
          }
          else {
            this.props.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {state: newValue ? 1 : 0, active: true}})
          }
        }
      }
    };

    let toggleOptions = [];
    toggleOptions.push({label: 'turn on',    value: 1});
    toggleOptions.push({label: 'turn off',   value: 0});
    toggleOptions.push({label: "do nothing", value: -1});

    let toggleOptionsExitSphere = [];
    toggleOptionsExitSphere.push({label: 'turn on after ' + Util.getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay)),  value: 1});
    toggleOptionsExitSphere.push({label: 'turn off after ' + Util.getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay)), value: 0});
    toggleOptionsExitSphere.push({label: "do nothing", value: -1});

    let toggleOptionsExit = [];
    toggleOptionsExit.push({label: 'turn on with delay',   value: 1});
    toggleOptionsExit.push({label: 'turn off with delay' , value: 0});
    toggleOptionsExit.push({label: "do nothing", value: -1});

    // Behaviour for onHomeEnter event
    let eventLabel = 'onHomeEnter';
    items.push({label:'WHEN YOU ...', type: 'explanation', style: styles.topExplanation, below:false});
    items.push(generateDropdown(eventLabel, 'Enter Sphere', toggleOptions));

    eventLabel = 'onHomeExit';
    items.push(generateDropdown(eventLabel, 'Leave Sphere', toggleOptionsExitSphere));

    if (element.behaviour[eventLabel].active === true) {
      items.push({
        label: 'Leaving the sphere will be triggered ' + Util.getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay), true) + ' after leaving. You can customize this in the Sphere settings.',
        style: {paddingBottom: 5},
        type: 'explanation',
        below: true
      });
    }

    if (canDoIndoorLocalization === false) {
      eventLabel = 'onNear';
      items.push({label:'WHEN YOU ...', type: 'explanation', style: styles.topExplanation, below:false});
      items.push(generateDropdown(eventLabel, 'Get near', toggleOptions));

      eventLabel = 'onAway';
      items.push(generateDropdown(eventLabel, 'Move away', toggleOptionsExit));


      if (element.behaviour[eventLabel].active === true) {
        addDelayFieldToItems(items, eventLabel, 'Delay', stone);
      }

      // only show the define button when the feature is being used.
      if (element.behaviour['onNear'].active === true || element.behaviour['onAway'].active === true) {
        let defineNearLabel = 'Define the "near" distance';
        if (stone.config.nearThreshold === null) {
          defineNearLabel = 'Tap here to define "near"'
        }

        items.push({
          type: 'button',
          label: defineNearLabel,
          style: {color: colors.iosBlue.hex},
          callback: () => {
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
            );}
        });

        if (stone.config.nearThreshold === null) {
          items.push({
            label: 'You need to define the near range before you can use this feature.',
            style: {paddingBottom: 0},
            type: 'explanation',
            below: true
          });
        }
      }


    }
    else {
      if (stone.config.locationId !== null) {
        eventLabel = 'onRoomEnter';
        items.push({label:'WHEN YOU ...', type: 'explanation', style: styles.topExplanation, below:false});
        items.push(generateDropdown(eventLabel, 'Enter room', toggleOptions));

        eventLabel = 'onRoomExit';
        items.push(generateDropdown(eventLabel, 'Leave room', toggleOptionsExit));
        if (element.behaviour[eventLabel].active === true) {
          addDelayFieldToItems(items, eventLabel, 'Delay', stone);
        }

        if (element.behaviour[eventLabel].active === true) {
          items.push({
            label: 'If there are people (from your Sphere) in the room, the enter/leave events will not be triggered.',
            style: {paddingBottom: 0},
            type: 'explanation',
            below: true
          });
        }
      }
      else if (canDoIndoorLocalization === true) {
        items.push({label: 'Since this Crownstone is not in a room, we cannot give it behaviour for entering or leaving it\'s room.', style:{paddingBottom:0}, type: 'explanation', below: true});
      }
    }

    items.push({label: 'EXCEPTIONS', type: 'explanation', style: styles.topExplanation, below:false});
    items.push({label: 'Only turn on if it\'s dark outside', style:{fontSize:15}, type: 'switch', value: element.config.onlyOnWhenDark === true, callback: (newValue) => {
      this.props.store.dispatch({type: 'UPDATE_'+dataTypeString+'_CONFIG', ...requiredData, data: { onlyOnWhenDark : newValue } })
    }});
    items.push({type:  'spacer'});

    return items;
  }

  render() {
    const store = this.props.store;
    const state = store.getState();
    let canDoIndoorLocalization = enoughCrownstonesInLocationsForIndoorLocalization(state, this.props.sphereId);
    this.canDoIndoorLocalization = canDoIndoorLocalization;

    let stone   = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let options = [];
    if (stone.config.applianceId) {
      let appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      options = this.constructOptions(state, appliance, stone, canDoIndoorLocalization);
    }
    else {
      options = this.constructOptions(state, stone, stone, canDoIndoorLocalization);
    }

    let backgroundImage = this.props.getBackground('menu', this.props.viewingRemotely);
    return (
      <Background image={backgroundImage} >
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true} />
        </ScrollView>
      </Background>
    )
  }
}
