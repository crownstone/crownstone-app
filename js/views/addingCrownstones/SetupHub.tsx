import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupHub", key)(a,b,c,d,e);
}


import * as React from 'react'; import { Component } from 'react';
import {
  Animated, Platform,
  TouchableOpacity,
  View
} from "react-native";
import { core } from "../../core";
import { Interview } from "../components/Interview";
import { IconCircle } from "../components/IconCircle";
import { colors, screenHeight, screenWidth, styles } from "../styles";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { SetupCircle } from "../components/animated/SetupCircle";
import { Icon } from "../components/Icon";
import KeepAwake from 'react-native-keep-awake';
import { BlePromiseManager } from "../../logic/BlePromiseManager";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";
import { TopBarUtil } from "../../util/TopBarUtil";
import { delay, Util } from "../../util/Util";
import { BleUtil } from "../../util/BleUtil";
import { getRandomHubIcon } from "../deviceViews/DeviceIconSelection";
import { Scheduler } from "../../logic/Scheduler";
import { TopbarImitation } from "../components/TopbarImitation";
import { NativeBus } from "../../native/libInterface/NativeBus";
import { HubHelper } from "../../native/setup/HubHelper";
import { Login } from "../startupViews/Login";
import { LOG, LOGe, LOGi, LOGw } from "../../logging/Log";
import { HubReplyError } from "../../Enums";

export class SetupHub extends LiveComponent<{
  sphereId: string,
  setupItem: any,
  componentId: any,
  restoration: boolean,
  unownedVerified: boolean
}, any> {
  static options(props) {
    let title = "Setup the hub";
    return TopBarUtil.getOptions({title: title});
  }

  _interview: any;
  randomIcon: string;
  storeEvents = [];
  abort : boolean = false;
  newCrownstoneState : any;
  constructor(props) {
    super(props);

    this.randomIcon = getRandomHubIcon();

    this.newCrownstoneState = {
      name:           null,
      icon:           this.randomIcon,
      location:       {id:null, name: null, icon:null},
      configFinished: false,
      stoneSetupFinished:  false,
      setupFinished:  false,
      newStoneId:     null,
      newHubId:       null,
    };
  }

  componentDidMount() {
    this.storeEvents.push(core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.updateLocationConfig ||
        change.changeLocations
      ) {
        this.forceUpdate();
      }
    }));

    if (this.props.restoration) {
      this.startSetupPhase();
    }
  }

  componentWillUnmount() {
    this.storeEvents.forEach((unsub) => { unsub(); });
  }


  _disableBackButton() {
    let title =  "Pairing with hub";
    TopBarUtil.updateOptions(this.props.componentId, {title: title, disableBack: true})
  }


  /**
   * This is the setup
   */
  async startSetupPhase() {
    this._disableBackButton();
    this.abort = false;

    let checkTimeout;
    // we want to know if the hub is already setup before we start the process
    let unsubscriber = NativeBus.on(NativeBus.topics.setupAdvertisement, (data : crownstoneAdvertisement) => {
      if (data.serviceData.deviceType === 'hub') {
        unsubscriber();
        clearTimeout(checkTimeout);
        this._setup(data.serviceData.hubHasBeenSetup);
      }
    })
    return new Promise((resolve, reject) => {
      checkTimeout = setTimeout(() => {
        unsubscriber();
        if (this.abort) {
          return this._interview.setLockedCard("aborted");
        }
        if (this.newCrownstoneState.stoneSetupFinished === true) {
          return this._interview.setLockedCard("problemHub");
        }
        this._interview.setLockedCard("problemBle");
        reject("NOT_FOUND");
      }, 10000);
    }).catch()

  }

  async _setup(hubIsAlreadySetup) {
    try {
      let familiar = false;
      if (this.newCrownstoneState.stoneSetupFinished === false) {
        let newStoneData = await SetupStateHandler.setupStone(this.props.setupItem.handle, this.props.sphereId)
          .catch((err) => { if (this.abort === false) { return Scheduler.delay(2000) } throw err; })
          .catch((err) => { if (this.abort === false) { return SetupStateHandler.setupStone(this.props.setupItem.handle, this.props.sphereId); } throw err;})
          .catch((err) => { if (this.abort === false) { return Scheduler.delay(2000) } throw err; })
          .catch((err) => { if (this.abort === false) { return SetupStateHandler.setupStone(this.props.setupItem.handle, this.props.sphereId); } throw err;})

        this.newCrownstoneState.newStoneId = newStoneData.id;

        if (newStoneData.familiarCrownstone === true) {
          familiar = true;
          let state = core.store.getState();
          let sphere = state.spheres[this.props.sphereId];
          let stone = sphere.stones[this.newCrownstoneState.newStoneId];
          let location = sphere.locations[stone.config.locationId];

          this.newCrownstoneState.name = stone.config.name;
          this.newCrownstoneState.icon = stone.config.icon;
          this.newCrownstoneState.configFinished = true;
          this.newCrownstoneState.location = {id:null, name: null, icon:null};
          this.newCrownstoneState.location.id =   location ? stone.config.locationId : null;
          this.newCrownstoneState.location.name = location ? location.config.name    : null;
          this.newCrownstoneState.location.icon = location ? location.config.icon    : null;
        }

      }
      this.newCrownstoneState.stoneSetupFinished = true;
      core.store.dispatch({
        type: "UPDATE_STONE_CONFIG",
        sphereId: this.props.sphereId,
        stoneId: this.newCrownstoneState.newStoneId,
        data: {
          name: this.newCrownstoneState.name,
          icon: this.newCrownstoneState.icon,
          locationId: this.newCrownstoneState.location.id
        }
      });
      let hubHelper = new HubHelper();
      let hubData;
      LOGi.info("Setting up the hub... hubIsAlreadySetup:", hubIsAlreadySetup)
      if (hubIsAlreadySetup === false) {
        hubData = await hubHelper.setup(this.props.sphereId, this.newCrownstoneState.newStoneId);
      }
      else {
        try {
          hubData = await hubHelper.setUartKey(this.props.sphereId, this.newCrownstoneState.newStoneId);
        }
        catch (err) {
          // in case the hub advertention is lying and the hub is not setup, set it up now.
          if (err?.code === 3 && err?.errorType === HubReplyError.IN_SETUP_MODE) {
            LOGw.info("Setting up the hub now, the advertisment was lying...");
            hubData = await hubHelper.setup(this.props.sphereId, this.newCrownstoneState.newStoneId);
          }
        }
      }
      this.newCrownstoneState.newHubId      = hubData.hubId;
      this.newCrownstoneState.setupFinished = true;

      let wrapUp = () => {
        if (this.newCrownstoneState.configFinished) {
          this._wrapUp();
        }
      };


      if (familiar === true) {
        if (this.props.restoration) {
          return wrapUp();
        }

        // this check is here because the user MIGHT go back somehow, destroying the view
        if (this._interview) {
          this._interview.setLockedCard("iKnowThisOne");
        }
        return;
      }
      else {
        wrapUp();
      }
    }
    catch (err) {
      LOGe.info("Something went wrong with the hub setup", err);
      if (this.abort) {
        return this._interview.setLockedCard("aborted");
      }
      if (this.newCrownstoneState.stoneSetupFinished === true) {

        return this._interview.setLockedCard("problemHub");
      }


      if (err.code) {
        if (err.code === 1) {
          this._interview.setLockedCard("problemBle");
        }
        else if (err.code === "network_error") {
          this._interview.setLockedCard("problemCloud");
        }
        else {
          this._interview.setLockedCard("problemBle");
        }
      }
      this._interview.setLockedCard("problemBle");
    }
  }

  _wrapUp() {
    // navigate the interview to the finished state.
    if (this.props.restoration) {
      return NavigationUtil.dismissModal()
    }

    if (this.abort) {
      this._interview.setLockedCard("successWhileAborting")
    }
    else {
      this._interview.setLockedCard("setupMore")
    }
  }

  getCards() : interviewCards {
    let state = core.store.getState();

    let namePlaceholder = "Crownstone Hub";

    let sphereId = this.props.sphereId;

    let sphere = state.spheres[sphereId];
    if (!sphere) return null;
    let locations = sphere.locations;
    let locationIds = Object.keys(locations);
    let locationElements = [];
    locationIds.forEach((locationId) => {
      locationElements.push({id: locationId, name: locations[locationId].config.name, icon: locations[locationId].config.icon});
    });
    locationElements.sort((a,b) => { return a.name < b.name ? -1 : 1});

    let roomOptions : interviewOption[] = [];
    locationElements.forEach((location) => {
      roomOptions.push({
        label: location.name,
        icon: location.icon,
        nextCard: 'waitToFinish',
        response: lang("Im_almost_done_"),
        onSelect: () => {
          this.newCrownstoneState.location       = location;
          this.newCrownstoneState.configFinished = true;
          if (this.newCrownstoneState.setupFinished === true) {
            this._wrapUp();
            return false;
          }
        }
      })
    });

    roomOptions.push({
      label: lang("add_a_new_room_"),
      icon: "md-cube",
      theme: 'create',
      onSelect: () => {
        NavigationUtil.navigate( "RoomAdd", {sphereId: sphereId, isModal: false});
      }
    });

    let failedOptions = [
      {
        label: lang("OK__try_again_"),
        onSelect: (result) => {
          this.newCrownstoneState.setupFinished = false;
          this.newCrownstoneState.configFinished = false;
          if (!this.newCrownstoneState.name) {
            return this._interview.resetStackToCard("start");
          }
          else if (!this.newCrownstoneState.icon) {
            this.startSetupPhase();
            return this._interview.resetStackToCard("icon");
          }
          else if (!this.newCrownstoneState.location.id) {
            this.startSetupPhase();
            return this._interview.resetStackToCard("rooms");
          }
          else {
            this.startSetupPhase();
            this.newCrownstoneState.configFinished = true;
            return this._interview.resetStackToCard("waitToFinish");
          }
        }
      },
      {
        label: lang("Ill_try_again_later___"),
        onSelect: (result) => { NavigationUtil.dismissModal(); }
      },
    ];

    let successOptions = [
      {
        label: lang("Add_more_Crownstones_"),
        onSelect: (result) => {
          NavigationUtil.back();
        }
      },
      {
        label: lang("Take_me_to__",this.newCrownstoneState.location.name),
        onSelect: (result) => {
          NavigationUtil.dismissAllModalsAndNavigate("RoomOverview", {sphereId: this.props.sphereId, locationId: this.newCrownstoneState.location.id });
        }
      },
    ];

    let restorationCard = {
      header: "Restoring Hub...",
      subHeader: lang("This_should_only_take_a_m"),
      backgroundImage: require('../../images/backgrounds/fadedLightBackground.jpg'),
      component: (
        <View style={{...styles.centered, flex:1}}>
          <View style={{width:0.6*screenWidth, height:0.6*screenWidth}}>
            <SetupCircle radius={0.3*screenWidth} multiplier={0.5}/>
          </View>
        </View>
      ),
      options: [
        {
          label: lang("Aborting___Abort",this.abort),
          onSelect: (result) => { this.abort = true; this.forceUpdate(); },
          dangerous: true,
        }
      ]
    }

    let problemCards = {
      problemCloud: {
        header: lang("Something_went_wrong__"),
        subHeader: lang("Please_verify_that_you_ar"),
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-cloudy-night" size={0.3*screenHeight} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: failedOptions
      },
      problemBle: {
        header: lang("Something_went_wrong__"),
        subHeader: lang("Please_restart_the_Blueto"),
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-bluetooth" size={0.25*screenHeight} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: failedOptions
      },
      problem: {
        header:lang("Something_went_wrong__"),
        subHeader: lang("Please_try_again_later_"),
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-alert" size={0.3*screenHeight} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: lang("Ill_try_again_later___"),
            onSelect: (result) => { NavigationUtil.dismissModal(); }
          },
        ]
      },
      problemHub: {
        header:lang("Something_went_wrong__"),
        subHeader: "Go to the room and tap on the hub. Follow the instructions there to resolve the issue.",
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-alert" size={0.3*screenHeight} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: lang("Take_me_to__",this.newCrownstoneState.location.name),
            onSelect: (result) => { NavigationUtil.dismissAllModalsAndNavigate("RoomOverview", {sphereId: this.props.sphereId, locationId: this.newCrownstoneState.location.id }) }
          },
        ]
      },
      aborted: {
        header:lang("Aborted_"),
        subHeader: lang("The_Crownstone_was_not_ad"),
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-alert" size={0.3*screenHeight} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: lang("Ill_try_again_later___"),
            onSelect: (result) => { NavigationUtil.dismissModal(); }
          },
        ]
      }
    }

    if (this.props.restoration) {
      return {
        start: restorationCard,
        ...problemCards
      }
    }


    return {
      start: {
        header: "Let's add this hub!",
        subHeader: "Would you like to give it a nice name?",
        hasTextInputField: true,
        placeholder: namePlaceholder,
        options: [
          {
            label: lang("Next"),
            textAlign:'right',
            nextCard: 'icon',
            dynamicResponse: (value) => { if (value.textfieldState === '') { return lang("Default_name_it_is_");} else { return lang("Thats_a_good_name_")}},
            onSelect: (result) => {
              console.log("ON SELETOR")
              let name = result.textfieldState;
              if (name == "") {
                this.newCrownstoneState.name = namePlaceholder;
              }
              else {
                this.newCrownstoneState.name = name;
              }

              this.startSetupPhase();
              return true
            }}
        ]
      },
      icon: {
        header: lang("Lets_pick_an_icon_"),
        subHeader: lang("Lets_give_this_Crownstone"),
        explanation: lang("You_can_always_change_thi"),
        editableItem: (state, setState) => {
          return (
            <TouchableOpacity onPress={() => {
              NavigationUtil.launchModal( "DeviceIconSelection",{
                icon: state,
                closeModal:true,
                callback: (newIcon) => {
                  setState(newIcon);
                }
              });
            }}>
              <IconCircle
                icon={state || this.randomIcon}
                size={0.5*screenWidth}
                iconSize={0.25*screenWidth}
                color={colors.white.hex}
                borderColor={colors.csOrange.hex}
                backgroundColor={colors.csBlueDark.hex}
                showEdit={true}
                borderWidth={8}
              />
            </TouchableOpacity>
          );
        },
        options: [
          {label: lang("Next"), textAlign:'right', nextCard: 'rooms', response: lang("Cool__so_thatll_be_my_ico"),
            onSelect: (result) => {
              let icon = result.customElementState || this.randomIcon;
              this.newCrownstoneState.icon = icon;
            }}
        ]
      },
      rooms: {
        header:    lang("Lets_pick_a_room_"),
        subHeader: lang("In_which_room_did_you_put", xUtil.capitalize(this.newCrownstoneState.name)),
        optionsBottom: true,
        options: roomOptions
      },
      waitToFinish: {
        header: lang("Working_on_it_"),
        subHeader: lang("Setting_up_your_new_Crown"),
        backgroundImage: require('../../images/backgrounds/fadedLightBackground.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{width:0.6*screenWidth, height:0.6*screenWidth}}>
              <SetupCircle radius={0.3*screenWidth} multiplier={0.5} />
            </View>
          </View>
        ),
        options: [
          {
            label: lang("Aborting___Abort",this.abort,true),
            onSelect: (result) => { this.abort = true; this.forceUpdate(); },
            dangerous: true,
          }
        ]
      },
      setupMore: {
        header:lang("Thats_it_"),
        subHeader: lang("Would_you_like_to_setup_m"),
        backgroundImage: require('../../images/backgrounds/fadedLightBackgroundGreen.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.rgba(0.8)} />
          </View>
        ),
        optionsBottom: true,
        options: successOptions
      },
      successWhileAborting: {
        header:    lang("Setup_complete_"),
        subHeader: lang("This_Crownstone_was_added"),
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.jpg'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <Icon name="ios-checkmark-circle" size={0.4*screenWidth} color={colors.white.rgba(0.8)} />
          </View>
        ),
        optionsBottom: true,
        options: successOptions
      },
      iKnowThisOne: {
        header:    lang("I_know_this_one_"),
        subHeader: lang("This_Crownstone_was_alrea", this.newCrownstoneState.name, this.newCrownstoneState.location.name),
        backgroundImage: require('../../images/backgrounds/fadedLightBackgroundGreen.jpg'),
        optionsBottom: true,
        options: successOptions
      },
      ...problemCards
    }
  }


  render() {
    let backgroundImage = require('../../images/backgrounds/fadedLightBackground.jpg');
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
    }

    return (
      <AnimatedBackground hasNavBar={false} image={backgroundImage} hideNotifications={true}>
        <KeepAwake />
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
      </AnimatedBackground>
    );
  }
}
