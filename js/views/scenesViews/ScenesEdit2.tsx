import { LiveComponent } from "../LiveComponent";
import { core } from "../../core";
import * as React from "react";
import { Background } from "../components/Background";
import { TopbarImitation } from "../components/TopbarImitation";
import { NavigationUtil } from "../../util/NavigationUtil";
import { Alert, ScrollView, Switch, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { NotificationLine } from "../components/NotificationLine";
import { availableModalHeight, colors, deviceStyles, screenWidth } from "../styles";
import { useState } from "react";
import { Circle } from "../components/Circle";
import { Icon } from "../components/Icon";
import { SlideSideFadeInView } from "../components/animated/SlideFadeInView";
import { LocationFlavourImage } from "../roomViews/RoomOverview";
import Slider from "@react-native-community/slider";

/**
 *
 * We're going to copy a number of rules from the origin Crownstone to a number of other Crownstones.
 *
 * Possible Conflicts:
 *  A - Rule requires dimming, but the candidate crownstone can't dim
 *  B - Candidate Crownstone already has a rule at that timepoint.
 *
 * Possible solutions for A:
 *  1 - During selection, provide an "Enable dimming" button before the Crownstone can be selected.
 *  2 - Change the rule from "40% dimmed" to "on" but keep the behaviour times and conditions the same (Twilight will be ignored).
 *  3 - Decline the copying of the rules that require dimming and copy the remainder.
 *  4 - Just blindly copy the behaviour and twilight and let the Crownstone decide to what to do. If it can't dim, it will turn on.
 *
 * Possible solutions for B:
 *  1 - Detect if the rule has the exact same timeslots and replace, if not, merge. (example: copied behaviour from 15-20, existing from 14-21 --> 14-15 old 15-20 copied 20-21 old)
 *  2 - Delete existing conflicting rule and replace with new one.
 *  3 - Block the copy fully
 *  4 - Only ignore the copying of the conflicting rules.
 *
 * Decision:
 *  We go with A1 for the dimming and warn the user about the override (similar button system) and do B2
 *
 *  UPDATE: We copy ALL the rules from 1 Crownstone to another.
 *
 */
export class ScenesEdit extends LiveComponent<{sphereId: string}, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };


  unsubscribeStoreEvents;
  callback;

  constructor(props) {
    super(props);

    this.state = { selectionMap: {} }
  }

  componentDidMount() {
    this.unsubscribeStoreEvents = core.eventBus.on("databaseChange", (data) => {
      let change = data.change;

      if (
        change.stoneChangeRules || change.stoneChangeAbilities
      ) {
        this.forceUpdate();
      }
    });
  }

  componentWillUnmount(): void {
    this.unsubscribeStoreEvents();
  }

  _getLocationStoneList() {
    let state = core.store.getState();
    let sphere = state.spheres[this.props.sphereId];
    let stones = sphere.stones;
    let locations = sphere.locations;
    let locationIds = Object.keys(locations);
    locationIds.sort((a,b) => { return locations[a].config.name > locations[b].config.name ? 1 : -1});

    let stoneIds = Object.keys(stones);
    stoneIds.sort((a,b) => { return stones[a].config.name > stones[b].config.name ? 1 : -1})

    let components = [];

    locationIds.forEach((locationId) => {
      let stoneDataArray = stoneIds
        .filter((stoneId) => { return stones[stoneId].config.locationId === locationId;  })
        .map((stoneId) => { return { id: stoneId, stone: stones[stoneId], selected: this.state.selectionMap[stoneId] }; })

      components.push(
        <LocationStoneList
          key={locationId}
          sphereId={this.props.sphereId}
          location={locations[locationId]}
          stoneDataArray={stoneDataArray}
        />
      )
    })

    return (
      <React.Fragment>
        { components }
      </React.Fragment>
    )
  }

  render() {
    return (
      <Background image={core.background.lightBlurLighter} fullScreen={true} hideNotifications={true} hideOrangeLine={true}>
        <TopbarImitation
          title={"Create Scene"}
          leftAction={() => {  NavigationUtil.dismissModal() }}
          leftLabel={"Back"}
          rightAction={() => {
            if (Object.keys(this.state.selectionMap).length === 0) {
              Alert.alert("No Crownstone selected!","Select at least one Crownstone to copy behaviour to. You can tap on them to select!", [{text:"OK"}]);
            }
            else {
              // this.props.callback(Object.keys(this.state.selectionMap));
            }
          }}
          right={"Select"}
        />
        <NotificationLine />
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center' }}>
            { this._getLocationStoneList() }
          </View>
        </ScrollView>
      </Background>
    )
  }
}

function LocationStoneList({location, sphereId, stoneDataArray}) {
  let [showLocations, setShowLocations] = useState(false);

  if (stoneDataArray.length === 0) {
    return <View></View>
  }
  return (
    <React.Fragment>
      <TouchableOpacity onPress={() => { setShowLocations(!showLocations); }}><LocationRow location={location} /></TouchableOpacity>
      { showLocations && <StoneList stoneDataArray={stoneDataArray} sphereId={sphereId} /> }
      {/*{ showLocations && <View style={{height: 30}} /> }*/}
    </React.Fragment>
  );
}


function StoneList({stoneDataArray, sphereId,  }) {
  let stoneComponents = [];
  stoneDataArray.forEach((stoneData) => {
    stoneComponents.push(
      <StoneRow
        key={stoneData.id}
        sphereId={sphereId}
        stoneId={stoneData.id}
        stone={stoneData.stone}
        selected={stoneData.selected}
      />
    )
  })

  return (
    <React.Fragment>
      { stoneComponents }
    </React.Fragment>
  )
}

function StoneRow({sphereId, stoneId, stone, selected}) {
  let [using, setUsing] = useState(false);
  let [switchState, setSwitchState] = useState(stone.state.state);

  let height = 80;
  let padding = 10;


  let containerStyle : ViewStyle = {
    width:screenWidth,
    height: height,
    padding:padding,
    paddingLeft:30,
    flexDirection:'row',
    alignItems:'center',
    backgroundColor: colors.white.rgba(0.8),
    borderColor: colors.black.rgba(0.3),
    borderBottomWidth: 1
  };

  let circleBackgroundColor = using ? colors.green.hex : colors.black.rgba(0.2);


  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 15}}>{stone.config.name}</Text>
      </View>
    </React.Fragment>
  );


  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={() => { setUsing(!using) }}
    >
      { content }
      <SlideSideFadeInView width={180} visible={ using }>
        <View style={{width:180, alignItems:'flex-end'}}>
          {stone.abilities.dimming.enabledTarget ?
            <Slider
              style={{ width: 150, height: 60}}
              minimumValue={0}
              maximumValue={1}
              step={0.025}
              value={switchState}
              minimumTrackTintColor={colors.gray.hex}
              maximumTrackTintColor={colors.gray.hex}
              onValueChange={(value) => { setSwitchState(value); }}
            />
            :
            <Switch value={switchState === 1} onValueChange={() => {
              setSwitchState(switchState === 1 ? 0 : 1)
            }}/>
          }
        </View>
      </SlideSideFadeInView>
    </TouchableOpacity>
  )
}

function LocationRow({location}) {
  let height = 80;
  let textBackgroundColor = "transparent";
  if (location.config.picture) {
    textBackgroundColor = colors.white.rgba(0.8);
  }
  return (
    <View style={{width: screenWidth, borderColor: colors.black.rgba(0.5), borderBottomWidth: 1, borderTopWidth: 1}}>
      <View style={{opacity: 0.8}}><LocationFlavourImage location={location} height={height}/></View>
      <View style={{position:'absolute', top:0, left:0, width: screenWidth, height: height, justifyContent:'center'}}>
        <View style={{backgroundColor: textBackgroundColor, width: 30 + (location.config.name.length || 0) * 14}}>
          <Text style={{fontSize: 20, fontWeight: 'bold', fontStyle:'italic', padding:10}}>{location.config.name}</Text>
        </View>
      </View>
    </View>
  )
}