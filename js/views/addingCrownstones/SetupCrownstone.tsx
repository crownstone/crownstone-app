import { LiveComponent }          from "../LiveComponent";

import { Languages } from "../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("SetupCrownstone", key)(a,b,c,d,e);
}
import * as React from 'react'; import { Component } from 'react';
import {
  TouchableOpacity,
  View} from "react-native";
import { Pagination } from 'react-native-snap-carousel';
import { core } from "../../core";
import { Interview } from "../components/Interview";
import { IconCircle } from "../components/IconCircle";
import { getRandomC1Name } from "../../fonts/customIcons";
import { colors, screenWidth, styles } from "../styles";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { SetupCircle } from "../components/animated/SetupCircle";
import { Icon } from "../components/Icon";
import KeepAwake from 'react-native-keep-awake';
import { BlePromiseManager } from "../../logic/BlePromiseManager";
import { BluenetPromiseWrapper } from "../../native/libInterface/BluenetPromise";

export class SetupCrownstone extends LiveComponent<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: lang("New_Crownstone"),
      headerLeft: params && params.disableBack ? null : undefined
    }
  };

  _interview: any;
  randomIcon: string;
  storeEvents = [];
  newCrownstoneState : any;
  constructor(props) {
    super(props);

    this.randomIcon = getRandomC1Name();

    this.newCrownstoneState = {
      name:           null,
      icon:           null,
      location:       {id:null, name: null, icon:null},
      configFinished: false,
      setupFinished:  false,
      newStoneId:     null,
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
  }

  componentWillUnmount() {
    this.storeEvents.forEach((unsub) => { unsub(); });
  }


  _disableBackButton() {
    this.props.navigation.setParams({disableBack: true});
    // TODO: disable android back button
  }


  _startSetup() {
    this._disableBackButton();

    const performSetup = () => {
      SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId)
        .catch((err) => { return SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId); })
        .catch((err) => { return SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId); })
        .then((newStoneData : any) => {
          this.newCrownstoneState.newStoneId    = newStoneData.id;
          this.newCrownstoneState.setupFinished = true;

          let wrapUp = () => {
            if (this.newCrownstoneState.configFinished) {
              this._wrapUp();
            }
          };

          if (newStoneData.familiarCrownstone === true) {
            let state = core.store.getState();
            let sphere = state.spheres[this.props.sphereId];
            if (!sphere) { return wrapUp(); }
            let stone = sphere.stones[newStoneData.id];
            if (!stone) { return wrapUp(); }
            let location = sphere.locations[stone.config.locationId];

            this.newCrownstoneState.name = stone.config.name;
            this.newCrownstoneState.icon = stone.config.icon;
            this.newCrownstoneState.configFinished = true;
            this.newCrownstoneState.location = {id:null, name: null, icon:null};
            this.newCrownstoneState.location.id =   location ? stone.config.locationId : null;
            this.newCrownstoneState.location.name = location ? location.config.name    : null;
            this.newCrownstoneState.location.icon = location ? location.config.icon    : null;

            this._interview.setLockedCard("iKnowThisOne");
            return;
          }
          else {
            wrapUp();
          }
        })
        .catch((err) => {
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
        })
    };

    if (this.props.unownedVerified) {
      let resetPromise = () => {
        return new Promise((resolve, reject) => {
          BluenetPromiseWrapper.connect(this.props.setupStone.handle, this.props.sphereId)
            .then(() => { return BluenetPromiseWrapper.commandFactoryReset() })
            .then(() => { return BluenetPromiseWrapper.disconnectCommand() })
            .then(() => { return BluenetPromiseWrapper.phoneDisconnect() })
            .then(() => { resolve() })
            .catch((err) => { reject(err) })
        })
      };
      BlePromiseManager.registerPriority(resetPromise, {from: 'Setup: resetting stone ' + this.props.setupStone.handle})
        .then(() => {
          return performSetup();
        })
        .catch(() => {
          this._interview.setLockedCard("problem");
        })
    }
    else {
      performSetup();
    }


  }

  _wrapUp() {
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

    // navigate the interview to the finished state.
    this._interview.setLockedCard("setupMore")
  }

  getCards() : interviewCards {
    let state = core.store.getState();

    let namePlaceholder = "My New Crownstone";

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
        response: "I'm almost done!",
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
        NavigationUtil.navigate("RoomAdd", {sphereId: sphereId, returnToRoute:'SetupCrownstone_step1'});
      }
    });

    let failedOptions = [
      {
        label: lang("OK__try_again_"),
        onSelect: (result) => {
          this.newCrownstoneState.setupFinished = false;
          this.newCrownstoneState.configFinished = false;

          console.log("HERE", this.newCrownstoneState);
          if (!this.newCrownstoneState.name) {
            return this._interview.resetStackToCard("start");
          }
          else if (!this.newCrownstoneState.icon) {
            this._startSetup();
            return this._interview.resetStackToCard("icon");
          }
          else if (!this.newCrownstoneState.location.id) {
            this._startSetup();
            return this._interview.resetStackToCard("rooms");
          }
          else {
            this._startSetup();
            this.newCrownstoneState.configFinished = true;
            return this._interview.resetStackToCard("waitToFinish");
          }
        }
      },
      {
        label: lang("Ill_try_again_later___"),
        onSelect: (result) => { NavigationUtil.backTo("Main"); }
      },
    ];

    return {
      start: {
        header:"Let's get started!",
        subHeader: "What shall I call this Crownstone?",
        hasTextInputField: true,
        placeholder: namePlaceholder,
        options: [
          {
            label: lang("Next"),
            textAlign:'right',
            nextCard: 'icon',
            response: "That's a good name!",
            onSelect: (result) => {
              let name = result.textfieldState;
              if (name == "") {
                this.newCrownstoneState.name = namePlaceholder;
              }
              else {
                this.newCrownstoneState.name = name;
              }

              this._startSetup();


              return true
            }}
        ]
      },
      icon: {
        header: "Let's pick an icon!",
        subHeader: "Let's give this Crownstone an icon so we can quickly recognize it!",
        explanation: "You can always change this later in the Crownstone's settings.",
        editableItem: (state, setState) => {
          return (
            <TouchableOpacity onPress={() => {
              NavigationUtil.navigate("DeviceIconSelection",{
                icon: state,
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
          {label: lang("Next"), textAlign:'right', nextCard: 'rooms', response: "Cool, so that'll be my icon!",
            onSelect: (result) => {
              let icon = result.customElementState || this.randomIcon;
              this.newCrownstoneState.icon = icon;
            }}
        ]
      },
      rooms: {
        header:"Let's pick a room!",
        subHeader: "In which room did you put " + xUtil.capitalize(this.newCrownstoneState.name) + "?",
        optionsBottom: true,
        options: roomOptions
      },
      waitToFinish: {
        header: "Working on it!",
        subHeader: "Setting up your new Crownstone now...",
        backgroundImage: require('../../images/backgrounds/fadedLightBackground.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View style={{width:0.6*screenWidth, height:0.6*screenWidth}}>
              <SetupCircle radius={0.3*screenWidth} />
            </View>
          </View>
        ),
        options: []
      },
      setupMore: {
        header:"That's it!",
        subHeader: "Would you like to setup more Crownstones or is this enough for now?",
        backgroundImage: require('../../images/backgrounds/fadedLightBackgroundGreen.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <Icon name="ios-checkmark-circle" size={0.5*screenWidth} color={colors.white.rgba(0.8)} />
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: lang("Add_more_Crownstones_"),
            onSelect: (result) => {
              if (SetupStateHandler.areSetupStonesAvailable()) {
                NavigationUtil.back();
              }
              else {
                NavigationUtil.navigateAndReplaceVia("Main", "AddCrownstones", {sphereId: this.props.sphereId}); }
              }
          },
          {
            label: lang("Take_me_to__",this.newCrownstoneState.location.name),
            onSelect: (result) => { NavigationUtil.navigateAndReplaceVia("Main", "RoomOverview", {sphereId: this.props.sphereId, locationId: this.newCrownstoneState.location.id }); }
          },
        ]
      },
      iKnowThisOne: {
        header:"I know this one!",
        subHeader: "This Crownstone was already in your Sphere. I've restored it to the way it was!\n\n" +
          "Name: " + this.newCrownstoneState.name + "\n" +
          "Room: " + (this.newCrownstoneState.location.name || "Unknown") + "\n\n" +
          "What would you like to do now?",
        backgroundImage: require('../../images/backgrounds/fadedLightBackgroundGreen.png'),
        optionsBottom: true,
        options: [
          {
            label: lang("Add_more_Crownstones_"),
            onSelect: (result) => {
              if (SetupStateHandler.areSetupStonesAvailable()) {
                NavigationUtil.back();
              }
              else {
                NavigationUtil.navigateAndReplaceVia("Main", "AddCrownstones", {sphereId: this.props.sphereId}); }
            }
          },
          {
            label: lang("Take_me_to__",this.newCrownstoneState.location.name),
            onSelect: (result) => { NavigationUtil.navigateAndReplaceVia("Main", "RoomOverview", {sphereId: this.props.sphereId, locationId: this.newCrownstoneState.location.id }); }
          },
        ]
      },
      problemCloud: {
        header:"Something went wrong..",
        subHeader: "Please verify that you are connected to the internet and try again.",
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-cloudy-night" size={0.6*screenWidth} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: failedOptions
      },
      problemBle: {
        header:"Something went wrong..",
        subHeader: "Please restart the Bluetooth on your phone and make sure you're really close to this Crownstone!",
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-bluetooth" size={0.6*screenWidth} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: failedOptions
      },
      problem: {
        header:"Something went wrong..",
        subHeader: "Please try again later!",
        textColor: colors.white.hex,
        backgroundImage: require('../../images/backgrounds/somethingWrongBlue.png'),
        component: (
          <View style={{...styles.centered, flex:1}}>
            <View>
              <Icon name="ios-alert" size={0.6*screenWidth} color={colors.white.rgba(0.8)} />
            </View>
          </View>
        ),
        optionsBottom: true,
        options: [
          {
            label: lang("Ill_try_again_later___"),
            onSelect: (result) => { NavigationUtil.backTo("Main"); }
          },
        ]
      }
    }
  }


  render() {
    let backgroundImage = require('../../images/backgrounds/fadedLightBackground.png');
    if (this._interview) {
      backgroundImage = this._interview.getBackgroundFromCard() || backgroundImage;
    }

    return (
      <AnimatedBackground hasNavBar={false} image={backgroundImage}>
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
