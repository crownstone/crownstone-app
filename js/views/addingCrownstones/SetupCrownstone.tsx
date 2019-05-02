import * as React from 'react'; import { Component } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform, ScrollView, StatusBar,
  Text, TextStyle, TouchableOpacity,
  View, ViewStyle
} from "react-native";
import Carousel, { Pagination } from 'react-native-snap-carousel';
import { core } from "../../core";
import { Background } from "../components/Background";
import { Interview } from "../components/Interview";
import { LiveComponent } from "../LiveComponent";
import { IconCircle } from "../components/IconCircle";
import { getRandomC1Name } from "../../fonts/customIcons";
import { colors, screenWidth, styles } from "../styles";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";
import { SetupStateHandler } from "../../native/setup/SetupStateHandler";
import set = Reflect.set;
import { AnimatedBackground } from "../components/animated/AnimatedBackground";
import { SetupCircle } from "../components/animated/SetupCircle";


export class SetupCrownstone extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;


    return {
      title: "New Crownstone",
      headerLeft: params && params.disableBack ? null : undefined
    }
  };


  _interview: any;
  randomIcon: string;
  storeEvents = []
  newCrownstoneState : any;
  constructor(props) {
    super(props);

    this.randomIcon = getRandomC1Name();

    this.newCrownstoneState = {
      name:           null,
      icon:           null,
      locationId:     null,
      location:       {id:null, name: null, icon:null},
      configFinished: false,
      setupFinished:  false,
      newStoneId:     null,
    }

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
    SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId)
      .catch((err) => { return SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId); })
      .catch((err) => { return SetupStateHandler.setupStone(this.props.setupStone.handle, this.props.sphereId); })
      .then((newStoneId) => {
        this.newCrownstoneState.newStoneId    = newStoneId;
        this.newCrownstoneState.setupFinished = true;
        if (this.newCrownstoneState.configFinished) {
          this._wrapUp();
        }
      })
  }

  _wrapUp() {
    core.store.dispatch({
      type: "UPDATE_STONE_CONFIG",
      sphereId: this.props.sphereId,
      stoneId: this.newCrownstoneState.newStoneId,
      data: {
        name: this.newCrownstoneState.name,
        icon: this.newCrownstoneState.icon,
        locationId: this.newCrownstoneState.locationId
      }
    });

    // navigate the interview to the finished state.
    this._interview.setLockedCard("setupMore")
  }

  getCards() : interviewCards {
    let state = core.store.getState();

    let namePlaceholder = "My New Crownstone";

    // TODO REMOVE HACK
    let sphereId = this.props.sphereId || Object.keys(state.spheres)[0];


    let sphere = state.spheres[sphereId];
    if (!sphere) return null;
    let locations = sphere.locations;
    let locationIds = Object.keys(locations);
    let locationElements = []
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
        onSelect: () => {
          this.newCrownstoneState.location       = location;
          this.newCrownstoneState.locationId     = location.id;
          this.newCrownstoneState.configFinished = true;
          if (this.newCrownstoneState.setupFinished === true) {
            this._wrapUp();
            return false;
          }
        }
      })
    });

    roomOptions.push({
      label: "add a new room!",
      icon: "md-cube",
      theme: 'create',
      onSelect: () => {
        NavigationUtil.navigate("RoomAdd", {sphereId: sphereId, returnToRoute:'SetupCrownstone_step1'});
      }
    });

    return {
      start: {
        header:"Let's get started!",
        subHeader: "What shall I call this Crownstone?",
        hasTextInputField: true,
        placeholder: namePlaceholder,
        options: [
          {
            label: "Next",
            textAlign:'right',
            nextCard: 'icon',
            onSelect: (result) => {
              let name = result.textfieldState;
              if (name == "") {
                this.newCrownstoneState.name = namePlaceholder;
              }
              else {
                this.newCrownstoneState.name = name;
              }

              this._startSetup()


              return true
            }}
        ]
      },
      icon: {
        header:"That's a good name!",
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
          {label: "Next", textAlign:'right', nextCard: 'rooms',
            onSelect: (result) => {
              let icon = result.customElementState;
              this.newCrownstoneState.icon = icon;
            }}
        ]
      },
      rooms: {
        header:"Cool, so that'll be my icon!",
        subHeader: "In which room did you put " + xUtil.capitalize(this.newCrownstoneState.name) + "?",
        optionsBottom: true,
        options: roomOptions
      },
      waitToFinish: {
        header:"I'm almost done!",
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
        optionsBottom: true,
        options: [
          {
            label: "Add more Crownstones!",
            onSelect: (result) => {
              if (SetupStateHandler.areSetupStonesAvailable()) {
                NavigationUtil.back();
              }
              else {
                NavigationUtil.navigateAndReplaceVia("Main", "AddCrownstones", {sphereId: this.props.sphereId}); }
              }
          },
          {
            label: "Take me to " + this.newCrownstoneState.location.name + "!",
            onSelect: (result) => { NavigationUtil.navigateAndReplaceVia("Main", "RoomOverview", {sphereId: this.props.sphereId, locationId: this.newCrownstoneState.locationId }); }
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
        <Interview
          ref={     (i) => { this._interview = i; }}
          getCards={ () => { return this.getCards();}}
          update={   () => { this.forceUpdate() }}
        />
        <SetupProgress />
      </AnimatedBackground>
    );
  }

}

class SetupProgress extends LiveComponent<any, any> {
  render() {
    return <View></View>
  }
}

