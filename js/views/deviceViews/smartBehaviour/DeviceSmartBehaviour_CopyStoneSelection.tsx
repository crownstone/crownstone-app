
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react';
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { Alert, Platform, ScrollView, Text, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native";
import { LiveComponent } from "../../LiveComponent";
import {
  availableModalHeight,
  colors,
  deviceStyles,
  screenWidth
} from "../../styles";
import { LocationFlavourImage } from "../../roomViews/RoomOverview";
import { Icon } from "../../components/Icon";
import { Circle } from "../../components/Circle";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";
import { Component, useState } from "react";
import { NavigationUtil } from "../../../util/NavigationUtil";
import { TopbarImitation } from "../../components/TopbarImitation";
import { NotificationLine } from "../../components/NotificationLine";
import ResponsiveText from "../../components/ResponsiveText";



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
export class DeviceSmartBehaviour_CopyStoneSelection extends LiveComponent<{copyType: string, callback(data: any): void, sphereId: string, originId: string, rulesRequireDimming: true}, any> {
  static options = {
    topBar: { visible: false, height: 0 }
  };


  unsubscribeStoreEvents;
  callback;

  constructor(props) {
    super(props);

    this.state = { selectionMap: {} }

    // define the callback based on the multiselect.
    this.callback = this.props.callback;
    if (this.props.copyType === "TO") {
      this.callback = (stoneId) => {
        let newMap = {...this.state.selectionMap};

        if (this.state.selectionMap[stoneId]) {
          delete newMap[stoneId];
        }
        else {
          newMap[stoneId] = true;
        }

        this.setState({ selectionMap: newMap })
      }
    }
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
          callback={this.callback}
          rulesRequired={this.props.copyType === "FROM"} // if we want to copy behaviour from a Crownstone it must have behaviour
          dimmingRequired={this.props.copyType === "TO" ? this.props.rulesRequireDimming : false} // if we are copying to, it is important to know if dimming is required.
          originId={this.props.originId}
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
    let header = null
    if (this.props.copyType === 'TO') {
      header = "Who I shall copy my behaviour to?"
    }
    else {
      header = "Who shall I copy behaviour from?"
    }

    return (
      <Background image={core.background.lightBlurLighter} fullScreen={true} hideNotifications={true} hideOrangeLine={true}>
        <TopbarImitation
          title={this.props.copyType === "FROM" ? "Copy from whom?" : "Copy to whom?"}
          leftAction={() => { NavigationUtil.back() }}
          leftLabel={"Back"}
          rightAction={() => {
            if (Object.keys(this.state.selectionMap).length === 0) {
              Alert.alert("No Crownstone selected!","Select at least one Crownstone to copy behaviour to. You can tap on them to select!", [{text:"OK"}]);
            }
            else {
              this.props.callback(Object.keys(this.state.selectionMap));
            }
          }}
          right={this.props.copyType === "FROM" ? null : "Select"}
        />
        <NotificationLine />
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <ResponsiveText style={{...deviceStyles.header, width: 0.85*screenWidth}} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</ResponsiveText>
            <View style={{height:30}} />
            { this._getLocationStoneList() }
          </View>
        </ScrollView>
      </Background>
    )
  }
}

function LocationStoneList({location, sphereId, stoneDataArray, callback, originId, dimmingRequired = false, rulesRequired = false }) {
  if (stoneDataArray.length === 0) {
    return <View></View>
  }
  return (
    <React.Fragment>
      <LocationRow location={location} />
      <StoneList stoneDataArray={stoneDataArray} sphereId={sphereId} callback={callback} dimmingRequired={dimmingRequired} rulesRequired={rulesRequired} originId={originId} />
      <View style={{height:50}} />
    </React.Fragment>
  );
}


function StoneList({stoneDataArray, sphereId, dimmingRequired, rulesRequired, originId, callback}) {
  let stoneComponents = [];
  stoneDataArray.forEach((stoneData) => {
    stoneComponents.push(
      <StoneRow
        key={stoneData.id}
        sphereId={sphereId}
        stoneId={stoneData.id}
        isOrigin={stoneData.id === originId}
        stone={stoneData.stone}
        callback={() => { callback(stoneData.id); }}
        selected={stoneData.selected}
        dimmingRequired={dimmingRequired}
        rulesRequired={rulesRequired}
      />
    )
  })

  return (
    <React.Fragment>
      { stoneComponents }
    </React.Fragment>
  )
}

function StoneRow({isOrigin, sphereId, stoneId, stone, selected, callback, dimmingRequired, rulesRequired}) {
  let [allowOverwrite, setAllowOverwrite] = useState(false);

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

  let stoneHasRules = Object.keys(stone.rules).length > 0;
  let clickable = true;
  let overrideButton = null;
  let circleBackgroundColor = selected ? colors.green.hex : colors.green.rgba(0.5);
  let subText = null;
  let subTextStyleOverride : TextStyle = {};

  if (rulesRequired) {
    if (!stoneHasRules) {
      clickable = false;
      circleBackgroundColor = colors.gray.hex;
      subText = "No behaviours to copy...";
    }
    else {
      subText = "Behaviours available to copy!";
      circleBackgroundColor = colors.green.hex;
      if (!selected) {
        subText += "\n(Tap to select)"
      }
    }
  }
  else {
    if (stoneHasRules) {
      if (allowOverwrite === false) {
        clickable = false;
        circleBackgroundColor = colors.csOrange.rgba(0.5);
        subText = "Existing behaviour will be overwritten.";
        overrideButton = (
          <TouchableOpacity style={{backgroundColor: colors.csOrange.hex, borderRadius: 15, padding:10}} onPress={() => { setAllowOverwrite(true) }}>
            <Text style={{fontSize:13, color: colors.white.hex, fontWeight:'bold', textAlign:'center'}}>{"Allow"}</Text>
          </TouchableOpacity>
        );
      }
      else {
        subText = "Existing behaviour will be overwritten.";
        if (!selected) {
          subText += " (Tap to select)"
        }
        else {
          subTextStyleOverride = {fontWeight:'bold', color: colors.black.rgba(0.8)};
        }
      }
    }
  }

  if (dimmingRequired && !isOrigin && !overrideButton) {
    if (stone.abilities.dimming.enabledTarget !== true) {
      clickable = false;
      subText = "Dimming is required to copy this behaviour.";
      circleBackgroundColor = colors.csOrange.blend(colors.green, 0.75).rgba(0.5);
      subTextStyleOverride = {};
      overrideButton = (
        <TouchableOpacity style={{backgroundColor: colors.menuTextSelected.hex, borderRadius: 15, padding:10}} onPress={() => {
          core.store.dispatch({type:'UPDATE_ABILITY_DIMMER', sphereId: sphereId, stoneId: stoneId, data: {enabledTarget: true}})
        }}>
          <Text style={{fontSize:13, color: colors.white.hex, fontWeight:'bold', textAlign:'center'}}>{"Enable\nDimming"}</Text>
        </TouchableOpacity>
      );
    }
  }

  if (isOrigin) {
    clickable = false;
    subText = "This is me!";
    circleBackgroundColor = colors.menuTextSelected.hex;
    overrideButton = null;
    subTextStyleOverride = {};
  }


  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 15}}>{stone.config.name}</Text>
        { subText ? <Text style={{fontSize: 12, color: colors.black.rgba(0.3), paddingRight:5, ...subTextStyleOverride}}>{subText}</Text> : undefined }
      </View>
      { overrideButton }
    </React.Fragment>
  );

  if (!clickable) {
    return (
      <View style={containerStyle}>
        { content }
      </View>
    )
  }

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={callback}
    >
      { content }
      <SlideSideFadeInView width={50} visible={!selected}></SlideSideFadeInView>
      <SlideSideFadeInView width={50} visible={selected}>
        <View style={{width:50, alignItems:'flex-end'}}>
          <Icon name={'ios-checkmark-circle'} color={colors.green.hex} size={26} />
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