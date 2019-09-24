
import { Languages } from "../../../Languages"

function lang(key,a?,b?,c?,d?,e?) {
  return Languages.get("DeviceSmartBehaviour", key)(a,b,c,d,e);
}
import * as React from 'react';
import { core } from "../../../core";
import { Background } from "../../components/Background";
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from "react-native";
import { TopBarUtil } from "../../../util/TopBarUtil";
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
import { NavigationUtil } from "../../../util/NavigationUtil";
import { BEHAVIOUR_TYPES } from "../../../router/store/reducers/stoneSubReducers/rules";
import { AicoreBehaviour } from "./supportCode/AicoreBehaviour";
import { SlideSideFadeInView } from "../../components/animated/SlideFadeInView";



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
export class DeviceSmartBehaviour_CopyStoneSelection extends LiveComponent<{copyType: string, callback(data: any): void, sphereId: string, originId: string, originIsDimmable:boolean, rulesRequireDimming: true}, any> {
  static options(props) {
    let options : topbarOptions = {title: props.copyType === "FROM" ? "Copy from whom?" : "Copy to whom?"};
    if (props.copyType === "TO") {
      options.nav = {id: 'select', text:'Select'};
    }

    return TopBarUtil.getOptions(options);
  }

  navigationButtonPressed({ buttonId }) {
    if (buttonId === 'select') {
      this.props.callback(Object.keys(this.state.selectionMap));
    }
  }

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

        this.setState({selectionMap: newMap })
      }
    }
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

    console.log(this.props)
    if (this.props.copyType === "TO") {
      locationIds.forEach((locationId) => {
        let stoneDataArray = stoneIds
          .filter((stoneId) => { return stones[stoneId].config.locationId === locationId;  })
          .map((stoneId) => { return { id: stoneId, stone: stones[stoneId], selected: this.state.selectionMap[stoneId] }; })

        components.push(<LocationStoneList key={locationId} location={locations[locationId]} stoneDataArray={stoneDataArray} callback={this.callback} dimmingRequired={this.props.rulesRequireDimming} originId={this.props.originId} />)
      })
    }
    else {
      locationIds.forEach((locationId) => {
        let stoneDataArray = stoneIds
          .filter((stoneId) => { return stones[stoneId].config.locationId === locationId;  })
          .map((stoneId) => { return { id: stoneId, stone: stones[stoneId], selected: this.state.selectionMap[stoneId] }; })

        components.push(<LocationStoneList key={locationId} location={locations[locationId]} stoneDataArray={stoneDataArray} callback={this.callback} rulesRequired={true} originId={this.props.originId} />)
      })
    }

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
      <Background image={core.background.lightBlur} hasNavBar={false}>
        <ScrollView>
          <View style={{ width: screenWidth, minHeight: availableModalHeight, alignItems:'center', paddingTop:30 }}>
            <Text style={[deviceStyles.header, {width: 0.85*screenWidth}]} numberOfLines={1} adjustsFontSizeToFit={true} minimumFontScale={0.1}>{ header }</Text>
            <View style={{height:30}} />
            { this._getLocationStoneList() }
          </View>
        </ScrollView>
      </Background>
    )
  }
}

function LocationStoneList({location, stoneDataArray, callback, originId, dimmingRequired = false, rulesRequired = false }) {

  if (stoneDataArray.length === 0) {
    return <View></View>
  }
  return (
    <React.Fragment>
      <LocationRow location={location} />
      <StoneList stoneDataArray={stoneDataArray} callback={callback} dimmingRequired={dimmingRequired} rulesRequired={rulesRequired} originId={originId} />
      <View style={{height:50}} />
    </React.Fragment>
  );
}


function StoneList({stoneDataArray, callback, dimmingRequired, rulesRequired, originId}) {
  let stoneComponents = [];
  stoneDataArray.forEach((stoneData) => {
    stoneComponents.push(
      <StoneRow
        key={stoneData.id}
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

function StoneRow({isOrigin, stone, selected, callback, dimmingRequired, rulesRequired}) {
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

  let clickable = true;
  let overrideButton = null;
  let circleBackgroundColor = colors.green.hex;
  let subText = null;
  if (rulesRequired) {
    if (Object.keys(stone.rules).length === 0) {
      clickable = false;
      circleBackgroundColor = colors.gray.hex;
      subText = "No behaviours to copy...";
    }
  }

  if (dimmingRequired && !isOrigin) {
    if (stone.abilities.dimming.enabledTarget !== true) {
      clickable = false;
      subText = "Dimming is required to copy this behaviour.";
      overrideButton = (
        <TouchableOpacity style={{
          backgroundColor: colors.menuTextSelected.hex, borderRadius: 15, padding:10
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
  }




  let content = (
    <React.Fragment>
      <Circle size={height-2*padding} color={circleBackgroundColor}>
        <Icon name={stone.config.icon} size={35} color={'#ffffff'} />
      </Circle>
      <View style={{justifyContent:'center', height: height-2*padding, flex:1, paddingLeft:15}}>
        <Text style={{fontSize: 15}}>{stone.config.name}</Text>
        { subText ? <Text style={{fontSize: 12, color: colors.black.rgba(0.3)}}>{subText}</Text> : undefined }
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