import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceBehaviourEdit", key)(a,b,c,d,e);
}
import * as React from 'react';
import {
  Alert,
  ScrollView,
  Vibration} from 'react-native';
import { styles, colors} from '../styles'
import { Background }                  from '../components/Background'
import { ListEditableItems }           from '../components/ListEditableItems'
import { addDistanceToRssi }     from '../../util/Util'
import {canUseIndoorLocalizationInSphere } from '../../util/DataUtil'
import {BehaviourUtil} from "../../util/BehaviourUtil";

import { xUtil } from "../../util/StandAloneUtil";
import { core } from "../../core";
import { NavigationUtil } from "../../util/NavigationUtil";
import { TopbarBackButton } from "../components/topbar/TopbarButton";
import { TopBarUtil } from "../../util/TopBarUtil";


let toggleOptions = [];
toggleOptions.push({label: lang("turn_on"),    value: 1});
toggleOptions.push({label: lang("turn_off"),   value: 0});
toggleOptions.push({label: lang("do_nothing"), value: null});

let timeOptions = [];
timeOptions.push({label: lang("seconds", 2),    value: 2});

let timeOptionsV2 = [];
timeOptionsV2.push({label: lang("seconds", 2),     value: 2});
timeOptionsV2.push({label: lang("seconds", 10),    value: 10});
timeOptionsV2.push({label: lang("seconds", 30),    value: 30});
timeOptionsV2.push({label: lang("minute" , 1),    value: 60});
timeOptionsV2.push({label: lang("minutes", 2),   value: 120});
timeOptionsV2.push({label: lang("minutes", 5),   value: 300});
timeOptionsV2.push({label: lang("minutes", 10),   value: 600});
timeOptionsV2.push({label: lang("minutes", 15),   value: 900});
timeOptionsV2.push({label: lang("minutes", 30),  value: 1800});

export class DeviceBehaviourEdit extends LiveComponent<any, any> {
  static options(props) {
    return TopBarUtil.getOptions({title:  lang("Behaviour"), closeModal: true});
  }

  detectionTimeout : any;
  unsubscribeNative : any;
  unsubscribe : any;
  _uuid : string;
  element : any;
  stone : any;
  pocketTimeout : any;
  viewingRemotely : any;
  canDoIndoorLocalization : boolean;

  constructor(props) {
    super(props);
    this.detectionTimeout = undefined;
    this.unsubscribeNative = undefined;
    this._uuid = xUtil.getUUID();
    this.element = undefined;
    this.stone = undefined;
    this.canDoIndoorLocalization = false;
  }

  componentDidMount() {
    this.unsubscribe = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      // if the stone has been deleted, close everything.
      if (change.removeStone && change.removeStone.stoneIds[this.props.stoneId]) {
        return NavigationUtil.back();
      }

      let state = core.store.getState();
      let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];
      let applianceId = stone.config.applianceId;

      if  (
        change.changeAppSettings ||
        (stone && stone.config.applianceId && change.updateApplianceConfig && change.updateApplianceConfig.stoneIds[this.props.applianceId]) ||
        (change.updateStoneConfig && change.updateStoneConfig.stoneIds[this.props.stoneId])
          ) {
        return this.forceUpdate();
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
        lang("_Near_behaviour_disabled__header"),
        lang("_Near_behaviour_disabled__body"),
        [{text:lang("_Near_behaviour_disabled__left")},
                  {
        text:lang("_Near_behaviour_disabled__right"), onPress: () => {
          NavigationUtil.launchModal( "DeviceBehaviourEdit",{sphereId: this.props.sphereId, stoneId: this.props.stoneId, viewingRemotely: this.viewingRemotely});}}
        ]);
    }

    this.unsubscribe();
    clearTimeout(this.detectionTimeout);
    clearTimeout(this.pocketTimeout);
  }

  defineThreshold(uuid, major, minor) {
    // show loading screen
    core.eventBus.emit("showLoading", "Determining range...");


    // make sure we don't strangely trigger stuff while doing this.
    core.eventBus.emit("ignoreTriggers");

    let measurements = [];

    // in case we do not measure enough samples, notify the user
    this.detectionTimeout = setTimeout(() => {
      this.unsubscribeNative();
      this.unsubscribeNative = undefined;

      // notify the user when the measurement failed
      Vibration.vibrate(400, false);

      Alert.alert(
lang("_Im_not_sure_yet_____I_co_header"),
lang("_Im_not_sure_yet_____I_co_body"),
[{text:lang("_Im_not_sure_yet_____I_co_left"), onPress: () => {
        core.eventBus.emit("hideLoading");
        core.eventBus.emit("useTriggers");
      }}], { cancelable: false });
    }, 15000);


    // listen to all advertisements
    this.unsubscribeNative = core.nativeBus.on(core.nativeBus.topics.iBeaconAdvertisement, (data) => {
      data.forEach((iBeaconAdvertisement) => {
        // filter for our crownstone with only valid rssi measurements. We force the strings to lowercase to avoid os interpretation of UUIDs
        if (
          iBeaconAdvertisement.uuid.toLowerCase() == uuid.toLowerCase() &&
          iBeaconAdvertisement.major == major &&
          iBeaconAdvertisement.minor == minor &&
          iBeaconAdvertisement.rssi < 0) {
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
        core.store.dispatch({
          type:     "UPDATE_STONE_CONFIG",
          sphereId: this.props.sphereId,
          stoneId:  this.props.stoneId,
          data: { nearThreshold: averageCorrected }
        });

        // tell the user it was a success!
        core.eventBus.emit("showLoading", "Great!");

        // notify the user when the measurement is complete!
        Vibration.vibrate(400, false);

        Alert.alert(
lang("_Great___Ill_make_sure_to_header"),
lang("_Great___Ill_make_sure_to_body"),
[{text: lang("_Great___Ill_make_sure_to_left"), onPress: () => {
            core.eventBus.emit("hideLoading");
            core.eventBus.emit("useTriggers");
          }
        }], { cancelable: false });
      }
    });
  }

  constructOptions(state, element, stone, canDoIndoorLocalization) {
    this.element = element;
    this.stone = stone;

    let useExitEvents = state.app.keepAlivesEnabled;

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
        if (xUtil.versions.isHigherOrEqual(stone.config.firmwareVersion, '2.0.0')) {
          delays = timeOptionsV2;
        }
        else {
          // In case the default value does not match with the only allowed value, force it to a higher one now. This is
          // not very clean but it is a one time event. I do not want to change the default value from 2 minutes to 2 seconds,
          // because that would not be the optimal setting for normal users.
          if (element.behaviour[eventLabel].delay !== timeOptionsV2[0].value) {
            core.store.dispatch({
              ...requiredData,
              type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel,
              data: {delay: timeOptionsV2[0].value}
            });
          }
          explanation =  lang("More_delay_options_will_b");
        }
      }
      else {
        explanation =  lang("More_delay_options_will_be");
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
        valueLabel: getDelayLabel(element.behaviour[eventLabel].delay, true),
        items: delays,
        callback: (newValue) => {
          core.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {delay: newValue}})
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
            core.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {active: false}})
          }
          else {
            core.store.dispatch({...requiredData, type: "UPDATE_"+dataTypeString+"_BEHAVIOUR_FOR_" + eventLabel, data: {state: newValue ? 1 : 0, active: true}})
          }
        }
      }
    };

    let toggleOptions = [];
    toggleOptions.push({label: lang("turn_on"),    value: 1});
    toggleOptions.push({label: lang("turn_off"),   value: 0});
    toggleOptions.push({label: lang("do_nothing"), value: -1});

    let toggleOptionsExitSphere = [];
    toggleOptionsExitSphere.push({label: lang("turn_on_after_",getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay))),  value: 1});
    toggleOptionsExitSphere.push({label: lang("turn_off_after_",getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay))), value: 0});
    toggleOptionsExitSphere.push({label: lang("do_nothing"), value: -1});

    let toggleOptionsExit = [];
    toggleOptionsExit.push({label: lang("turn_on_with_delay"),   value: 1});
    toggleOptionsExit.push({label: lang("turn_off_with_delay"), value: 0});
    toggleOptionsExit.push({label: lang("do_nothing"), value: -1});

    // Behaviour for onHomeEnter event
    let eventLabel = 'onHomeEnter';
    items.push({label: lang("WHEN_YOU____"), type: 'explanation', style: styles.topExplanation, below:false});
    items.push(generateDropdown(eventLabel, 'Enter Sphere', toggleOptions));

    // hide exit event if there is no keepAlive.
    if (useExitEvents) {
      eventLabel = 'onHomeExit';
      items.push(generateDropdown(eventLabel, 'Leave Sphere', toggleOptionsExitSphere));
      if (element.behaviour[eventLabel].active === true) {
        items.push({
          label: lang("Leaving_the_sphere_will_b",getDelayLabel(Math.max(300, state.spheres[this.props.sphereId].config.exitDelay), true)),
          style: {paddingBottom: 5},
          type: 'explanation',
          below: true
        });
      }
    }



    if (canDoIndoorLocalization === false) {
      eventLabel = 'onNear';
      items.push({label: lang("WHEN_YOU____"), type: 'explanation', style: styles.topExplanation, below:false});
      items.push(generateDropdown(eventLabel, 'Get near', toggleOptions));

      eventLabel = 'onAway';
      items.push(generateDropdown(eventLabel, 'Move away', toggleOptionsExit));


      if (element.behaviour[eventLabel].active === true) {
        addDelayFieldToItems(items, eventLabel, 'Delay', stone);
      }

      // only show the define button when the feature is being used.
      if (element.behaviour['onNear'].active === true || element.behaviour['onAway'].active === true) {
        let defineNearLabel =  lang("Define_the___near___dista");
        if (stone.config.nearThreshold === null) {
          defineNearLabel =  lang("Tap_here_to_define___near")}

        items.push({
          type: 'button',
          label: defineNearLabel,
          style: {color: colors.iosBlue.hex},
          callback: () => {
            let state = core.store.getState();
            let iBeaconUUID = state.spheres[this.props.sphereId].config.iBeaconUUID;

            Alert.alert(
lang("_How_near_is_near___You_c_header"),
lang("_How_near_is_near___You_c_body"),
[{text: lang("_How_near_is_near___You_c_left"), style: 'cancel'}, {
                
text: lang("_How_near_is_near___You_c_right"), onPress: () => {
                  // show loading bar
                  core.eventBus.emit("showLoading", "Put your phone in your pocket or somewhere it usually is!");
                  this.pocketTimeout = setTimeout(() => {
                    this.defineThreshold(iBeaconUUID, stone.config.iBeaconMajor, stone.config.iBeaconMinor);
                  }, 5000);
                }
              }]
            );}
        });

        if (stone.config.nearThreshold === null) {
          items.push({
            label: lang("You_need_to_define_the_ne"),
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
        items.push({label: lang("WHEN_YOU____"), type: 'explanation', style: styles.topExplanation, below:false});
        items.push(generateDropdown(eventLabel, 'Enter room', toggleOptions));


        // hide exit event if there is no keepAlive.
        if (useExitEvents) {
          eventLabel = 'onRoomExit';
          items.push(generateDropdown(eventLabel, 'Leave room', toggleOptionsExit));
          if (element.behaviour[eventLabel].active === true) {
            addDelayFieldToItems(items, eventLabel, 'Delay', stone);
          }
        }

        if (element.behaviour[eventLabel].active === true) {
          // items.push({
          //   label: lang("If_there_are_people__from"),
          //   style: {paddingBottom: 0},
          //   type: 'explanation',
          //   below: true
          // });
        }
      }
      else if (canDoIndoorLocalization === true) {
        items.push({label: lang("Since_this_Crownstone_is_"), style:{paddingBottom:0}, type: 'explanation', below: true});
      }
    }

    items.push({label: lang("EXCEPTIONS"), type: 'explanation', style: styles.topExplanation, below:false});
    items.push({label: lang("Only_turn_on_if_it_s_dark"), style:{fontSize:15}, type: 'switch', value: element.config.onlyOnWhenDark === true, callback: (newValue) => {
      core.store.dispatch({type: 'UPDATE_'+dataTypeString+'_CONFIG', ...requiredData, data: { onlyOnWhenDark : newValue } })
    }});

    let times = BehaviourUtil.getEveningTimes(state.spheres[this.props.sphereId]);

    items.push({label: lang("Today__for_this_Sphere__i",times.eveningReadable,times.morningReadable), type: 'explanation', below:true});
    items.push({type:  'spacer'});

    return items;
  }

  render() {
    const store = core.store;
    const state = store.getState();
    let stone = state.spheres[this.props.sphereId].stones[this.props.stoneId];

    let canDoIndoorLocalization = canUseIndoorLocalizationInSphere(state, this.props.sphereId) && stone.config.locationId !== null;

    this.canDoIndoorLocalization = canDoIndoorLocalization;

    let options = [];
    if (stone.config.applianceId) {
      let appliance = state.spheres[this.props.sphereId].appliances[stone.config.applianceId];
      options = this.constructOptions(state, appliance, stone, canDoIndoorLocalization);
    }
    else {
      options = this.constructOptions(state, stone, stone, canDoIndoorLocalization);
    }

    let backgroundImage = core.background.menu;
    return (
      <Background hasNavBar={false} image={backgroundImage} >
        <ScrollView>
          <ListEditableItems items={options} separatorIndent={true} />
        </ScrollView>
      </Background>
    )
  }
}


export function getDelayLabel(delay, fullLengthText = false) {
  if (delay < 60) {
    return Math.floor(delay) + ' seconds';
  }
  else {
    if (fullLengthText === true) {
      return Math.floor(delay / 60) + ' minutes';
    }
    else {
      return Math.floor(delay / 60) + ' min';
    }
  }
}