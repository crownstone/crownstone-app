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
import { colors, screenWidth } from "../styles";
import { NavigationUtil } from "../../util/NavigationUtil";
import { xUtil } from "../../util/StandAloneUtil";


export class SetupCrownstone_step1 extends Component<any, any> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;

    return {
      title: "New Crownstone",
    }
  };


  randomIcon: string;
  storeEvents = []
  newCrownstoneState : any;
  constructor(props) {
    super(props);

    this.randomIcon = getRandomC1Name();

    this.newCrownstoneState = {
      name: null,
      icon: null,
      room: null,
    }

  }

  componentDidMount() {
    this.storeEvents.push(core.eventBus.on("databaseChange", (data) => {
      let change = data.change;
      if (
        change.updateLocationConfig ||
        change.changeLocations
      ) {
        console.log("Triggering a forceUpdate SCS")
        this.forceUpdate();
      }
    }));
  }

  componentWillUnmount() {
    this.storeEvents.forEach((unsub) => { unsub(); });
  }


  getCards() : interviewCards {
    console.log("Getting Cards")
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
      locationElements.push({name:locations[locationId].config.name, icon: locations[locationId].config.icon});
    });
    locationElements.sort((a,b) => { return a.name < b.name ? -1 : 1});

    let roomOptions : interviewOption[] = [];
    locationElements.forEach((location) => {
      roomOptions.push({
        label: location.name,
        icon: location.icon,
        nextCard: 'dimmable',
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
                return true
                // Alert.alert("Please give me a name!", "Anything will do!", [{text:'OK'}]);
                // return false;
              }
              else {
                this.newCrownstoneState.name = name;
                return true
              }
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
      }
    }
  }


  render() {
    return (
      <Background hasNavBar={false} image={require('../../images/backgrounds/plugBackground.png')}>
        <Interview getCards={this.getCards.bind(this)}/>
        <SetupProgress />
      </Background>
    );
  }

}

class SetupProgress extends LiveComponent<any, any> {
  render() {
    return <View></View>
  }
}

